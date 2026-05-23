use axum::{
  extract::{Extension, Path, Query},
  http::{header, HeaderMap, HeaderValue, StatusCode},
  response::{IntoResponse, Redirect, Response},
  routing::{get, post},
  Json, Router,
};
use crate::students::StudentStore;
use postgres::{Client, NoTls};
use reqwest::blocking::Client as HttpClient;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  env,
  sync::{
    atomic::{AtomicU64, Ordering},
    Arc, Mutex, RwLock,
  },
  time::{Duration, SystemTime, UNIX_EPOCH},
};
use tracing::{info, warn};

static SESSION_COUNTER: AtomicU64 = AtomicU64::new(1);
static STAFF_COUNTER: AtomicU64 = AtomicU64::new(1);

const GOOGLE_AUTH_ENDPOINT: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT: &str = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_STATE_COOKIE: &str = "horse_farm_oauth_state";

#[derive(Clone, Debug)]
pub struct AppConfig {
  pub database_url: String,
  pub public_base_url: String,
  pub google_client_id: String,
  pub google_client_secret: String,
  pub google_redirect_uri: String,
  pub session_cookie_name: String,
  pub session_cookie_secure: bool,
  pub session_ttl_seconds: u64,
}

impl AppConfig {
  pub fn from_env() -> Result<Self, ConfigError> {
    let database_url =
      env::var("DATABASE_URL").map_err(|_| ConfigError::Missing("DATABASE_URL"))?;
    let public_base_url =
      env::var("PUBLIC_BASE_URL").map_err(|_| ConfigError::Missing("PUBLIC_BASE_URL"))?;
    let google_client_id =
      env::var("GOOGLE_CLIENT_ID").map_err(|_| ConfigError::Missing("GOOGLE_CLIENT_ID"))?;
    let google_client_secret = env::var("GOOGLE_CLIENT_SECRET")
      .map_err(|_| ConfigError::Missing("GOOGLE_CLIENT_SECRET"))?;
    let google_redirect_uri = env::var("GOOGLE_REDIRECT_URI").unwrap_or_else(|_| {
      format!(
        "{}/api/auth/google/callback",
        public_base_url.trim_end_matches('/')
      )
    });
    let session_cookie_name =
      env::var("SESSION_COOKIE_NAME").unwrap_or_else(|_| "horse_farm_session".to_string());
    let session_cookie_secure = env::var("SESSION_COOKIE_SECURE")
      .ok()
      .map(|value| value.eq_ignore_ascii_case("true"))
      .unwrap_or_else(|| public_base_url.starts_with("https://"));
    let session_ttl_seconds = env::var("SESSION_TTL_SECONDS")
      .ok()
      .and_then(|value| value.parse::<u64>().ok())
      .unwrap_or(60 * 60 * 24 * 7);

    Ok(Self {
      database_url,
      public_base_url,
      google_client_id,
      google_client_secret,
      google_redirect_uri,
      session_cookie_name,
      session_cookie_secure,
      session_ttl_seconds,
    })
  }
}

#[derive(Debug)]
pub enum ConfigError {
  Missing(&'static str),
}

#[derive(Debug)]
pub enum BuildError {
  SessionStore(SessionStoreInitError),
}

impl std::fmt::Display for BuildError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      BuildError::SessionStore(err) => write!(f, "session store init failed: {err}"),
    }
  }
}

impl std::error::Error for BuildError {}

impl From<SessionStoreInitError> for BuildError {
  fn from(value: SessionStoreInitError) -> Self {
    BuildError::SessionStore(value)
  }
}

#[derive(Debug)]
pub enum SessionStoreInitError {
  Postgres(postgres::Error),
}

impl std::fmt::Display for SessionStoreInitError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      SessionStoreInitError::Postgres(err) => write!(f, "{err}"),
    }
  }
}

impl std::error::Error for SessionStoreInitError {}

impl From<postgres::Error> for SessionStoreInitError {
  fn from(value: postgres::Error) -> Self {
    SessionStoreInitError::Postgres(value)
  }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum StaffRole {
  Admin,
  Instructor,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct StaffUser {
  pub id: String,
  pub email: String,
  pub display_name: String,
  pub role: StaffRole,
  pub active: bool,
}

#[derive(Clone, Debug)]
pub(crate) struct AppState {
  pub(crate) config: AppConfig,
  pub(crate) staff_directory: StaffDirectory,
  pub(crate) students: Arc<StudentStore>,
  pub(crate) sessions: Arc<dyn SessionStore>,
  pub(crate) google_auth: Arc<dyn GoogleAuthProvider>,
}

impl AppState {
  fn new(
    config: AppConfig,
    sessions: Arc<dyn SessionStore>,
    google_auth: Arc<dyn GoogleAuthProvider>,
  ) -> Self {
    Self {
      staff_directory: StaffDirectory::new(),
      students: Arc::new(StudentStore::seeded()),
      sessions,
      google_auth,
      config,
    }
  }
}

#[derive(Clone, Default, Debug)]
pub(crate) struct StaffDirectory {
  by_id: Arc<RwLock<HashMap<String, StaffUser>>>,
  by_email: Arc<RwLock<HashMap<String, String>>>,
}

impl StaffDirectory {
  fn new() -> Self {
    let users = vec![
      StaffUser {
        id: "emergency-admin".to_string(),
        email: "farmadmin".to_string(),
        display_name: "Farm Admin".to_string(),
        role: StaffRole::Admin,
        active: true,
      },
      StaffUser {
        id: "staff-mkt-monte".to_string(),
        email: "mkt.monte@gmail.com".to_string(),
        display_name: "Mkt Monte".to_string(),
        role: StaffRole::Instructor,
        active: true,
      },
      StaffUser {
        id: "staff-lee-wells".to_string(),
        email: "lee.wells@gmail.com".to_string(),
        display_name: "Lee Wells".to_string(),
        role: StaffRole::Instructor,
        active: true,
      },
    ];
    let mut by_id = HashMap::new();
    let mut by_email = HashMap::new();

    for user in users {
      by_email.insert(user.email.clone(), user.id.clone());
      by_id.insert(user.id.clone(), user);
    }

    Self {
      by_id: Arc::new(RwLock::new(by_id)),
      by_email: Arc::new(RwLock::new(by_email)),
    }
  }

  pub(crate) fn create(
    &self,
    email: String,
    display_name: String,
    role: StaffRole,
    active: bool,
  ) -> Result<StaffUser, StaffDirectoryError> {
    let mut by_id = self
      .by_id
      .write()
      .map_err(|_| StaffDirectoryError::Poisoned)?;
    let mut by_email = self
      .by_email
      .write()
      .map_err(|_| StaffDirectoryError::Poisoned)?;

    if by_email.contains_key(&email) {
      return Err(StaffDirectoryError::DuplicateEmail);
    }

    let user = StaffUser {
      id: generate_staff_id(),
      email: email.clone(),
      display_name,
      role,
      active,
    };

    by_email.insert(email, user.id.clone());
    by_id.insert(user.id.clone(), user.clone());

    Ok(user)
  }

  pub(crate) fn activate(&self, id: &str) -> Option<StaffUser> {
    let mut by_id = self.by_id.write().ok()?;
    let user = by_id.get_mut(id)?;
    user.active = true;
    Some(user.clone())
  }

  pub(crate) fn get_active_by_email(&self, email: &str) -> Option<StaffUser> {
    let user_id = self.by_email.read().ok()?.get(email)?.clone();
    let user = self.by_id.read().ok()?.get(&user_id)?.clone();

    if user.active {
      Some(user)
    } else {
      None
    }
  }

  pub(crate) fn get_by_id(&self, id: &str) -> Option<StaffUser> {
    self.by_id.read().ok()?.get(id).cloned()
  }

  pub(crate) fn deactivate(&self, id: &str) -> Option<StaffUser> {
    let mut by_id = self.by_id.write().ok()?;
    let user = by_id.get_mut(id)?;
    user.active = false;
    Some(user.clone())
  }
}

#[derive(Debug)]
pub(crate) enum StaffDirectoryError {
  DuplicateEmail,
  Poisoned,
}

impl std::fmt::Display for StaffDirectoryError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      StaffDirectoryError::DuplicateEmail => write!(f, "duplicate staff email"),
      StaffDirectoryError::Poisoned => write!(f, "staff directory lock poisoned"),
    }
  }
}

impl std::error::Error for StaffDirectoryError {}

#[derive(Clone, Debug)]
pub(crate) struct SessionRecord {
  user_id: String,
  expires_at: i64,
}

#[derive(Debug)]
pub(crate) enum SessionStoreError {
  Postgres(postgres::Error),
  Poisoned,
}

impl std::fmt::Display for SessionStoreError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      SessionStoreError::Postgres(err) => write!(f, "{err}"),
      SessionStoreError::Poisoned => write!(f, "session store lock poisoned"),
    }
  }
}

impl std::error::Error for SessionStoreError {}

impl From<postgres::Error> for SessionStoreError {
  fn from(value: postgres::Error) -> Self {
    SessionStoreError::Postgres(value)
  }
}

pub(crate) trait SessionStore: Send + Sync + std::fmt::Debug {
  fn create_session(&self, user_id: &str, ttl_seconds: u64) -> Result<String, SessionStoreError>;
  fn get_session(&self, session_id: &str) -> Result<Option<SessionRecord>, SessionStoreError>;
  fn revoke_session(&self, session_id: &str) -> Result<(), SessionStoreError>;
  fn revoke_user_sessions(&self, user_id: &str) -> Result<(), SessionStoreError>;
}

#[derive(Default, Debug)]
struct MemorySessionStore {
  sessions: Mutex<HashMap<String, SessionRecord>>,
}

impl SessionStore for MemorySessionStore {
  fn create_session(&self, user_id: &str, ttl_seconds: u64) -> Result<String, SessionStoreError> {
    let session_id = generate_session_id();
    let record = SessionRecord {
      user_id: user_id.to_string(),
      expires_at: now_epoch_seconds() + ttl_seconds as i64,
    };

    let mut sessions = self.sessions.lock().map_err(|_| SessionStoreError::Poisoned)?;
    sessions.insert(session_id.clone(), record);
    Ok(session_id)
  }

  fn get_session(&self, session_id: &str) -> Result<Option<SessionRecord>, SessionStoreError> {
    let mut sessions = self.sessions.lock().map_err(|_| SessionStoreError::Poisoned)?;
    let record = match sessions.get(session_id).cloned() {
      Some(record) => record,
      None => return Ok(None),
    };

    if record.expires_at <= now_epoch_seconds() {
      sessions.remove(session_id);
      Ok(None)
    } else {
      Ok(Some(record))
    }
  }

  fn revoke_session(&self, session_id: &str) -> Result<(), SessionStoreError> {
    let mut sessions = self.sessions.lock().map_err(|_| SessionStoreError::Poisoned)?;
    sessions.remove(session_id);
    Ok(())
  }

  fn revoke_user_sessions(&self, user_id: &str) -> Result<(), SessionStoreError> {
    let mut sessions = self.sessions.lock().map_err(|_| SessionStoreError::Poisoned)?;
    sessions.retain(|_, record| record.user_id != user_id);
    Ok(())
  }
}

struct PostgresSessionStore {
  client: Mutex<Client>,
}

impl std::fmt::Debug for PostgresSessionStore {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("PostgresSessionStore").finish_non_exhaustive()
  }
}

impl PostgresSessionStore {
  fn connect(database_url: &str) -> Result<Self, SessionStoreInitError> {
    let mut client = Client::connect(database_url, NoTls)?;
    client.batch_execute(
      r#"
        CREATE TABLE IF NOT EXISTS staff_sessions (
          session_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at BIGINT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS staff_sessions_user_id_idx ON staff_sessions (user_id);
      "#,
    )?;

    Ok(Self {
      client: Mutex::new(client),
    })
  }
}

impl SessionStore for PostgresSessionStore {
  fn create_session(&self, user_id: &str, ttl_seconds: u64) -> Result<String, SessionStoreError> {
    let session_id = generate_session_id();
    let expires_at = now_epoch_seconds() + ttl_seconds as i64;
    let mut client = self.client.lock().map_err(|_| SessionStoreError::Poisoned)?;

    client.execute(
      "INSERT INTO staff_sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3)",
      &[&session_id, &user_id, &expires_at],
    )?;

    Ok(session_id)
  }

  fn get_session(&self, session_id: &str) -> Result<Option<SessionRecord>, SessionStoreError> {
    let mut client = self.client.lock().map_err(|_| SessionStoreError::Poisoned)?;
    let row = client.query_opt(
      "SELECT user_id, expires_at FROM staff_sessions WHERE session_id = $1",
      &[&session_id],
    )?;

    match row {
      Some(row) => {
        let record = SessionRecord {
          user_id: row.get::<_, String>(0),
          expires_at: row.get::<_, i64>(1),
        };

        if record.expires_at <= now_epoch_seconds() {
          client.execute("DELETE FROM staff_sessions WHERE session_id = $1", &[&session_id])?;
          Ok(None)
        } else {
          Ok(Some(record))
        }
      }
      None => Ok(None),
    }
  }

  fn revoke_session(&self, session_id: &str) -> Result<(), SessionStoreError> {
    let mut client = self.client.lock().map_err(|_| SessionStoreError::Poisoned)?;
    client.execute("DELETE FROM staff_sessions WHERE session_id = $1", &[&session_id])?;
    Ok(())
  }

  fn revoke_user_sessions(&self, user_id: &str) -> Result<(), SessionStoreError> {
    let mut client = self.client.lock().map_err(|_| SessionStoreError::Poisoned)?;
    client.execute("DELETE FROM staff_sessions WHERE user_id = $1", &[&user_id])?;
    Ok(())
  }
}

#[derive(Debug, Clone)]
pub(crate) struct GoogleProfile {
  email: String,
  display_name: String,
}

#[derive(Debug)]
pub(crate) enum GoogleAuthError {
  Http(reqwest::Error),
  InvalidResponse(String),
}

impl std::fmt::Display for GoogleAuthError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      GoogleAuthError::Http(err) => write!(f, "{err}"),
      GoogleAuthError::InvalidResponse(message) => write!(f, "{message}"),
    }
  }
}

impl std::error::Error for GoogleAuthError {}

impl From<reqwest::Error> for GoogleAuthError {
  fn from(value: reqwest::Error) -> Self {
    GoogleAuthError::Http(value)
  }
}

pub(crate) trait GoogleAuthProvider: Send + Sync + std::fmt::Debug {
  fn authorization_url(&self, state: &str) -> String;
  fn exchange_code(&self, code: &str) -> Result<GoogleProfile, GoogleAuthError>;
}

#[derive(Debug)]
struct RealGoogleAuthProvider {
  client_id: String,
  client_secret: String,
  redirect_uri: String,
  client: HttpClient,
}

impl RealGoogleAuthProvider {
  fn new(config: &AppConfig) -> Self {
    Self {
      client_id: config.google_client_id.clone(),
      client_secret: config.google_client_secret.clone(),
      redirect_uri: config.google_redirect_uri.clone(),
      client: HttpClient::new(),
    }
  }
}

impl GoogleAuthProvider for RealGoogleAuthProvider {
  fn authorization_url(&self, state: &str) -> String {
    let mut url = Url::parse(GOOGLE_AUTH_ENDPOINT).expect("Google auth endpoint must parse");
    url.query_pairs_mut()
      .append_pair("client_id", &self.client_id)
      .append_pair("redirect_uri", &self.redirect_uri)
      .append_pair("response_type", "code")
      .append_pair("scope", "openid email profile")
      .append_pair("state", state)
      .append_pair("access_type", "offline")
      .append_pair("prompt", "select_account");
    url.into()
  }

  fn exchange_code(&self, code: &str) -> Result<GoogleProfile, GoogleAuthError> {
    #[derive(Deserialize)]
    struct TokenResponse {
      access_token: String,
    }

    #[derive(Deserialize)]
    struct UserInfoResponse {
      email: String,
      name: Option<String>,
      email_verified: Option<bool>,
    }

    let token_response: TokenResponse = self
      .client
      .post(GOOGLE_TOKEN_ENDPOINT)
      .form(&[
        ("client_id", self.client_id.as_str()),
        ("client_secret", self.client_secret.as_str()),
        ("code", code),
        ("grant_type", "authorization_code"),
        ("redirect_uri", self.redirect_uri.as_str()),
      ])
      .send()?
      .error_for_status()?
      .json()?;

    let userinfo: UserInfoResponse = self
      .client
      .get(GOOGLE_USERINFO_ENDPOINT)
      .bearer_auth(&token_response.access_token)
      .send()?
      .error_for_status()?
      .json()?;

    if userinfo.email.trim().is_empty() {
      return Err(GoogleAuthError::InvalidResponse(
        "google userinfo did not include an email".to_string(),
      ));
    }

    if userinfo.email_verified == Some(false) {
      return Err(GoogleAuthError::InvalidResponse(
        "google email is not verified".to_string(),
      ));
    }

    Ok(GoogleProfile {
      display_name: userinfo.name.unwrap_or_else(|| userinfo.email.clone()),
      email: userinfo.email,
    })
  }
}

#[derive(Debug)]
struct MockGoogleAuthProvider;

impl GoogleAuthProvider for MockGoogleAuthProvider {
  fn authorization_url(&self, state: &str) -> String {
    let mut url = Url::parse("https://accounts.google.com/o/oauth2/v2/auth")
      .expect("Google auth endpoint must parse");
    url.query_pairs_mut()
      .append_pair("response_type", "code")
      .append_pair("state", state)
      .append_pair("mock", "true");
    url.into()
  }

  fn exchange_code(&self, code: &str) -> Result<GoogleProfile, GoogleAuthError> {
    match code {
      "google-code-mkt" => Ok(GoogleProfile {
        email: "mkt.monte@gmail.com".to_string(),
        display_name: "Mkt Monte".to_string(),
      }),
      "google-code-lee" => Ok(GoogleProfile {
        email: "lee.wells@gmail.com".to_string(),
        display_name: "Lee Wells".to_string(),
      }),
      "google-code-temp" => Ok(GoogleProfile {
        email: "temp.staff@example.com".to_string(),
        display_name: "Temp Staff".to_string(),
      }),
      "google-code-unknown" => Ok(GoogleProfile {
        email: "outsider@example.com".to_string(),
        display_name: "Outsider".to_string(),
      }),
      other => Err(GoogleAuthError::InvalidResponse(format!(
        "unknown mock google code: {other}"
      ))),
    }
  }
}

#[derive(Serialize)]
struct HealthResponse {
  status: &'static str,
  service: &'static str,
}

#[derive(Serialize)]
struct ErrorResponse {
  error: &'static str,
}

#[derive(Serialize)]
struct StaffUserResponse {
  id: String,
  email: String,
  display_name: String,
  role: StaffRole,
  active: bool,
}

#[derive(Serialize)]
struct SessionUserResponse {
  id: String,
  email: String,
  display_name: String,
  role: StaffRole,
}

#[derive(Serialize)]
struct MeResponse {
  user: SessionUserResponse,
}

#[derive(Deserialize)]
struct GoogleCallbackQuery {
  code: Option<String>,
  state: Option<String>,
  error: Option<String>,
}

#[derive(Deserialize)]
struct EmergencyLoginRequest {
  username: String,
  password: String,
}

#[derive(Deserialize)]
struct CreateStaffUserRequest {
  email: String,
  display_name: String,
  role: StaffRole,
  active: Option<bool>,
}

fn build_session_user(user: &StaffUser) -> SessionUserResponse {
  SessionUserResponse {
    id: user.id.clone(),
    email: user.email.clone(),
    display_name: user.display_name.clone(),
    role: user.role.clone(),
  }
}

fn build_staff_user_response(user: &StaffUser) -> StaffUserResponse {
  StaffUserResponse {
    id: user.id.clone(),
    email: user.email.clone(),
    display_name: user.display_name.clone(),
    role: user.role.clone(),
    active: user.active,
  }
}

async fn require_admin(
  state: &Arc<AppState>,
  headers: &HeaderMap,
) -> Result<StaffUser, Response> {
  let current = match current_user(state, headers).await {
    Ok(user) => user,
    Err(response) => return Err(response),
  };

  if current.role != StaffRole::Admin {
    return Err((
      StatusCode::FORBIDDEN,
      Json(ErrorResponse {
        error: "admin_only",
      }),
    )
      .into_response());
  }

  Ok(current)
}

pub fn build_router(config: AppConfig) -> Router {
  build_router_with_deps(
    config,
    Arc::new(MemorySessionStore::default()),
    Arc::new(MockGoogleAuthProvider),
  )
}

pub fn build_persistent_router(config: AppConfig) -> Result<Router, BuildError> {
  let store = PostgresSessionStore::connect(&config.database_url)?;
  Ok(build_router_with_deps(
    config.clone(),
    Arc::new(store),
    Arc::new(RealGoogleAuthProvider::new(&config)),
  ))
}

fn build_router_with_deps(
  config: AppConfig,
  sessions: Arc<dyn SessionStore>,
  google_auth: Arc<dyn GoogleAuthProvider>,
) -> Router {
  let state = Arc::new(AppState::new(config, sessions, google_auth));

  Router::new()
    .nest("/api", api_router())
    .layer(Extension(state))
}

fn api_router() -> Router {
  Router::new()
    .route("/health", get(health))
    .route("/me", get(me))
    .route("/auth/google/start", get(google_start))
    .route("/auth/google/callback", get(google_callback))
    .route("/auth/emergency", post(emergency_login))
    .route("/staff", post(create_staff_user))
    .route("/staff/:user_id/activate", post(activate_staff_user))
    .route("/logout", post(logout))
    .route("/staff/:user_id/deactivate", post(deactivate_staff_user))
    .merge(crate::students::student_router())
}

async fn health() -> Json<HealthResponse> {
  Json(HealthResponse {
    status: "ok",
    service: "horse-farm-backend",
  })
}

async fn me(Extension(state): Extension<Arc<AppState>>, headers: HeaderMap) -> Response {
  match current_user(&state, &headers).await {
    Ok(user) => Json(MeResponse {
      user: build_session_user(&user),
    })
    .into_response(),
    Err(response) => response,
  }
}

async fn google_start(Extension(state): Extension<Arc<AppState>>) -> Response {
  let state_value = generate_session_id();
  let auth_url = state.google_auth.authorization_url(&state_value);
  let mut response = Redirect::to(&auth_url).into_response();
  response.headers_mut().insert(
    header::SET_COOKIE,
    HeaderValue::from_str(&oauth_state_cookie(
      &state_value,
      state.config.session_cookie_secure,
    ))
    .expect("oauth state cookie must be valid header value"),
  );
  response
}

async fn google_callback(
  Extension(state): Extension<Arc<AppState>>,
  Query(query): Query<GoogleCallbackQuery>,
  headers: HeaderMap,
) -> Response {
  if query.error.is_some() {
    return auth_failure_redirect(&state, "google_oauth_error");
  }

  let returned_state = match query.state.as_deref() {
    Some(value) => value,
    None => return auth_failure_redirect(&state, "missing_state"),
  };

  let cookie_state = match session_id_from_headers(GOOGLE_STATE_COOKIE, &headers) {
    Some(value) => value,
    None => return auth_failure_redirect(&state, "missing_state_cookie"),
  };

  if cookie_state != returned_state {
    return auth_failure_redirect(&state, "state_mismatch");
  }

  let code = match query.code.as_deref() {
    Some(value) => value,
    None => return auth_failure_redirect(&state, "missing_code"),
  };

  match state.google_auth.exchange_code(code) {
    Ok(profile) => match state.staff_directory.get_active_by_email(&profile.email) {
      Some(user) => {
        info!(
          email = %profile.email,
          display_name = %profile.display_name,
          "accepted Google staff login"
        );
        issue_session_redirect(state, user).await
      }
      None => {
        warn!(email = %profile.email, "denied unknown Google account");
        auth_failure_redirect(&state, "unknown_google_account")
      }
    },
    Err(err) => {
      warn!(error = %err, "google OAuth code exchange failed");
      auth_failure_redirect(&state, "google_exchange_failed")
    }
  }
}

async fn emergency_login(
  Extension(state): Extension<Arc<AppState>>,
  Json(payload): Json<EmergencyLoginRequest>,
) -> Response {
  if payload.username != "farmadmin" || payload.password != "farmadmin" {
    return (
      StatusCode::FORBIDDEN,
      Json(ErrorResponse {
        error: "invalid_emergency_login",
      }),
    )
      .into_response();
  }

  match state.staff_directory.get_active_by_email("farmadmin") {
    Some(user) => {
      info!(username = %payload.username, "accepted emergency admin login");
      issue_session_json(state, user).await
    }
    None => (
      StatusCode::FORBIDDEN,
      Json(ErrorResponse {
        error: "unknown_emergency_admin",
      }),
    )
      .into_response(),
  }
}

async fn logout(Extension(state): Extension<Arc<AppState>>, headers: HeaderMap) -> Response {
  if let Some(session_id) = session_id_from_headers(&state.config.session_cookie_name, &headers) {
    let _ = revoke_session(state.clone(), session_id).await;
  }

  (
    StatusCode::NO_CONTENT,
    [(
      header::SET_COOKIE,
      HeaderValue::from_str(&logout_cookie(&state.config.session_cookie_name))
        .expect("logout cookie must be valid header value"),
    )],
  )
    .into_response()
}

async fn deactivate_staff_user(
  Extension(state): Extension<Arc<AppState>>,
  Path(user_id): Path<String>,
  headers: HeaderMap,
) -> Response {
  let current = match require_admin(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  match state.staff_directory.deactivate(&user_id) {
    Some(deactivated) => {
      let _ = revoke_user_sessions(state.clone(), deactivated.id.clone()).await;
      info!(
        actor = %current.id,
        target = %deactivated.id,
        "deactivated staff user and revoked sessions"
      );
      Json(build_staff_user_response(&deactivated)).into_response()
    }
    None => (
      StatusCode::NOT_FOUND,
      Json(ErrorResponse {
        error: "staff_user_not_found",
      }),
    )
      .into_response(),
  }
}

async fn create_staff_user(
  Extension(state): Extension<Arc<AppState>>,
  headers: HeaderMap,
  Json(payload): Json<CreateStaffUserRequest>,
) -> Response {
  let current = match require_admin(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  let active = payload.active.unwrap_or(true);
  let role = payload.role;

  match state
    .staff_directory
    .create(payload.email, payload.display_name, role, active)
  {
    Ok(user) => {
      info!(
        actor = %current.id,
        target = %user.id,
        role = ?user.role,
        active = user.active,
        "created staff user"
      );
      Json(build_staff_user_response(&user)).into_response()
    }
    Err(StaffDirectoryError::DuplicateEmail) => (
      StatusCode::CONFLICT,
      Json(ErrorResponse {
        error: "staff_email_exists",
      }),
    )
      .into_response(),
    Err(StaffDirectoryError::Poisoned) => (
      StatusCode::INTERNAL_SERVER_ERROR,
      Json(ErrorResponse {
        error: "staff_directory_error",
      }),
    )
      .into_response(),
  }
}

async fn activate_staff_user(
  Extension(state): Extension<Arc<AppState>>,
  Path(user_id): Path<String>,
  headers: HeaderMap,
) -> Response {
  let current = match require_admin(&state, &headers).await {
    Ok(user) => user,
    Err(response) => return response,
  };

  match state.staff_directory.activate(&user_id) {
    Some(activated) => {
      info!(
        actor = %current.id,
        target = %activated.id,
        "activated staff user"
      );
      Json(build_staff_user_response(&activated)).into_response()
    }
    None => (
      StatusCode::NOT_FOUND,
      Json(ErrorResponse {
        error: "staff_user_not_found",
      }),
    )
      .into_response(),
  }
}

async fn issue_session_redirect(state: Arc<AppState>, user: StaffUser) -> Response {
  let session_id = create_session(state.clone(), user.id.clone())
    .await
    .expect("session creation should succeed");
  let mut response = Redirect::to(&state.config.public_base_url).into_response();
  response.headers_mut().insert(
    header::SET_COOKIE,
    HeaderValue::from_str(&session_cookie(
      &state.config.session_cookie_name,
      &session_id,
      state.config.session_cookie_secure,
      state.config.session_ttl_seconds,
    ))
    .expect("session cookie must be valid header value"),
  );
  response.headers_mut().append(
    header::SET_COOKIE,
    HeaderValue::from_str(&clear_oauth_state_cookie(state.config.session_cookie_secure))
      .expect("oauth state cookie must be valid header value"),
  );
  response
}

async fn issue_session_json(state: Arc<AppState>, user: StaffUser) -> Response {
  let session_id = create_session(state.clone(), user.id.clone())
    .await
    .expect("session creation should succeed");
  let mut response = (
    StatusCode::OK,
    Json(MeResponse {
      user: build_session_user(&user),
    }),
  )
    .into_response();
  response.headers_mut().insert(
    header::SET_COOKIE,
    HeaderValue::from_str(&session_cookie(
      &state.config.session_cookie_name,
      &session_id,
      state.config.session_cookie_secure,
      state.config.session_ttl_seconds,
    ))
    .expect("session cookie must be valid header value"),
  );
  response
}

fn auth_failure_redirect(state: &AppState, reason: &'static str) -> Response {
  let url = format!("{}/?auth={reason}", state.config.public_base_url.trim_end_matches('/'));
  let mut response = Redirect::to(&url).into_response();
  response.headers_mut().append(
    header::SET_COOKIE,
    HeaderValue::from_str(&clear_oauth_state_cookie(state.config.session_cookie_secure))
      .expect("oauth state cookie must be valid header value"),
  );
  response
}

pub(crate) async fn current_user(
  state: &Arc<AppState>,
  headers: &HeaderMap,
) -> Result<StaffUser, Response> {
  let session_id = session_id_from_headers(&state.config.session_cookie_name, headers)
    .ok_or_else(|| unauthorized("missing_session"))?;

  let session = get_session(state.clone(), session_id.clone())
    .await
    .map_err(|_| unauthorized("session_store_error"))?
    .ok_or_else(|| unauthorized("invalid_session"))?;

  let user = state
    .staff_directory
    .get_by_id(&session.user_id)
    .ok_or_else(|| unauthorized("unknown_session_user"))?;

  if !user.active {
    let _ = revoke_session(state.clone(), session_id).await;
    return Err(unauthorized("inactive_user"));
  }

  Ok(user)
}

async fn create_session(state: Arc<AppState>, user_id: String) -> Result<String, SessionStoreError> {
  let ttl_seconds = state.config.session_ttl_seconds;
  let sessions = state.sessions.clone();

  tokio::task::spawn_blocking(move || sessions.create_session(&user_id, ttl_seconds))
    .await
    .expect("blocking session creation task should complete")
}

async fn get_session(
  state: Arc<AppState>,
  session_id: String,
) -> Result<Option<SessionRecord>, SessionStoreError> {
  let sessions = state.sessions.clone();

  tokio::task::spawn_blocking(move || sessions.get_session(&session_id))
    .await
    .expect("blocking session lookup task should complete")
}

async fn revoke_session(state: Arc<AppState>, session_id: String) -> Result<(), SessionStoreError> {
  let sessions = state.sessions.clone();

  tokio::task::spawn_blocking(move || sessions.revoke_session(&session_id))
    .await
    .expect("blocking session revocation task should complete")
}

async fn revoke_user_sessions(
  state: Arc<AppState>,
  user_id: String,
) -> Result<(), SessionStoreError> {
  let sessions = state.sessions.clone();

  tokio::task::spawn_blocking(move || sessions.revoke_user_sessions(&user_id))
    .await
    .expect("blocking user session revocation task should complete")
}

fn unauthorized(error: &'static str) -> Response {
  (StatusCode::UNAUTHORIZED, Json(ErrorResponse { error })).into_response()
}

fn session_id_from_headers(cookie_name: &str, headers: &HeaderMap) -> Option<String> {
  let cookie_header = headers.get(header::COOKIE)?.to_str().ok()?;

  for cookie in cookie_header.split(';') {
    let trimmed = cookie.trim();
    let (name, value) = trimmed.split_once('=')?;

    if name == cookie_name {
      return Some(value.to_string());
    }
  }

  None
}

fn session_cookie(cookie_name: &str, session_id: &str, secure: bool, ttl_seconds: u64) -> String {
  let mut cookie = format!(
    "{cookie_name}={session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age={ttl_seconds}"
  );

  if secure {
    cookie.push_str("; Secure");
  }

  cookie
}

fn logout_cookie(cookie_name: &str) -> String {
  format!("{cookie_name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
}

fn oauth_state_cookie(state: &str, secure: bool) -> String {
  let mut cookie =
    format!("{GOOGLE_STATE_COOKIE}={state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600");
  if secure {
    cookie.push_str("; Secure");
  }
  cookie
}

fn clear_oauth_state_cookie(secure: bool) -> String {
  let mut cookie = format!("{GOOGLE_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  if secure {
    cookie.push_str("; Secure");
  }
  cookie
}

fn generate_session_id() -> String {
  let counter = SESSION_COUNTER.fetch_add(1, Ordering::Relaxed);
  let nanos = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_else(|_| Duration::from_secs(0))
    .as_nanos();
  format!("{nanos:x}{counter:x}")
}

fn generate_staff_id() -> String {
  let counter = STAFF_COUNTER.fetch_add(1, Ordering::Relaxed);
  let nanos = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_else(|_| Duration::from_secs(0))
    .as_nanos();
  format!("staff-{nanos:x}{counter:x}")
}

fn now_epoch_seconds() -> i64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_else(|_| Duration::from_secs(0))
    .as_secs() as i64
}
