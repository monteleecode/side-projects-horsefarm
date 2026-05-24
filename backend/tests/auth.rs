use axum::{
  body::Body,
  http::{header, Request, StatusCode},
};
use horse_farm_backend::{build_router, AppConfig};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tower::ServiceExt;

fn test_config() -> AppConfig {
  AppConfig {
    database_url: "postgres://horsefarm:horsefarm@localhost:5432/horsefarm".to_string(),
    public_base_url: "http://localhost:3000".to_string(),
    google_client_id: "test-client-id".to_string(),
    google_client_secret: "test-client-secret".to_string(),
    google_redirect_uri: "http://localhost:3000/api/auth/google/callback".to_string(),
    session_cookie_name: "horse_farm_session".to_string(),
    session_cookie_secure: false,
    session_ttl_seconds: 3600,
  }
}

async fn read_json(response: axum::response::Response) -> Value {
  let body = response.into_body().collect().await.unwrap().to_bytes();
  serde_json::from_slice(&body).unwrap()
}

fn cookie_value(set_cookie: &str) -> String {
  set_cookie
    .split(';')
    .next()
    .unwrap_or(set_cookie)
    .to_string()
}

fn header_value(response: &axum::response::Response, name: header::HeaderName) -> String {
  response
    .headers()
    .get(name)
    .unwrap()
    .to_str()
    .unwrap()
    .to_string()
}

#[tokio::test]
async fn google_login_issues_session_for_known_staff_user() {
  let app = build_router(test_config());

  let start = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/auth/google/start")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(start.status(), StatusCode::SEE_OTHER);
  let oauth_state = cookie_value(&header_value(&start, header::SET_COOKIE));
  let location = header_value(&start, header::LOCATION);
  assert!(location.contains("state="));
  assert!(location.contains("mock=true"));

  let callback = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(format!(
          "/api/auth/google/callback?code=google-code-mkt&state={}",
          oauth_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, oauth_state)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(callback.status(), StatusCode::SEE_OTHER);
  assert_eq!(header_value(&callback, header::LOCATION), "http://localhost:3000");
  let session_cookie = cookie_value(&header_value(&callback, header::SET_COOKIE));

  let me = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/me")
        .header(header::COOKIE, session_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(me.status(), StatusCode::OK);
  let payload = read_json(me).await;
  assert_eq!(
    payload,
    json!({
      "user": {
        "id": "staff-mkt-monte",
        "email": "mkt.monte@gmail.com",
        "display_name": "Mkt Monte",
        "role": "instructor"
      }
    })
  );
}

#[tokio::test]
async fn unknown_google_accounts_are_denied() {
  let app = build_router(test_config());

  let start = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/auth/google/start")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  let oauth_state = cookie_value(&header_value(&start, header::SET_COOKIE));

  let callback = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(format!(
          "/api/auth/google/callback?code=google-code-unknown&state={}",
          oauth_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, oauth_state)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(callback.status(), StatusCode::SEE_OTHER);
  assert!(header_value(&callback, header::LOCATION).contains("unknown_google_account"));
}

#[tokio::test]
async fn emergency_admin_login_creates_session_and_logout_revokes_it() {
  let app = build_router(test_config());

  let login = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/auth/emergency")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "username": "farmadmin",
            "password": "farmadmin"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(login.status(), StatusCode::OK);
  let session_cookie = cookie_value(&header_value(&login, header::SET_COOKIE));

  let me = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/me")
        .header(header::COOKIE, &session_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(me.status(), StatusCode::OK);

  let logout = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/logout")
        .header(header::COOKIE, &session_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(logout.status(), StatusCode::NO_CONTENT);

  let me_after_logout = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/me")
        .header(header::COOKIE, session_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(me_after_logout.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn deactivating_a_user_revokes_active_sessions() {
  let app = build_router(test_config());

  let start = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/auth/google/start")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  let oauth_state = cookie_value(&header_value(&start, header::SET_COOKIE));
  let callback = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(format!(
          "/api/auth/google/callback?code=google-code-mkt&state={}",
          oauth_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, oauth_state)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  let staff_cookie = cookie_value(&header_value(&callback, header::SET_COOKIE));

  let admin_login = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/auth/emergency")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "username": "farmadmin",
            "password": "farmadmin"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  let admin_cookie = cookie_value(&header_value(&admin_login, header::SET_COOKIE));

  let deactivate = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/staff/staff-mkt-monte/deactivate")
        .header(header::COOKIE, admin_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(deactivate.status(), StatusCode::OK);

  let me_after_deactivation = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/me")
        .header(header::COOKIE, staff_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(me_after_deactivation.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn admin_can_create_activate_and_manage_staff_users() {
  let app = build_router(test_config());

  let admin_login = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/auth/emergency")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "username": "farmadmin",
            "password": "farmadmin"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  let admin_cookie = cookie_value(&header_value(&admin_login, header::SET_COOKIE));

  let create = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/staff")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::COOKIE, &admin_cookie)
        .body(Body::from(
          json!({
            "email": "temp.staff@example.com",
            "display_name": "Temp Staff",
            "role": "instructor",
            "active": false
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(create.status(), StatusCode::OK);
  let created = read_json(create).await;
  let created_id = created["id"].as_str().unwrap().to_string();
  assert_eq!(created["email"], "temp.staff@example.com");
  assert_eq!(created["display_name"], "Temp Staff");
  assert_eq!(created["role"], "instructor");
  assert_eq!(created["active"], false);

  let login_before_activation = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/auth/google/start")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  let oauth_state = cookie_value(&header_value(&login_before_activation, header::SET_COOKIE));

  let denied_login = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(format!(
          "/api/auth/google/callback?code=google-code-temp&state={}",
          oauth_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, oauth_state.clone())
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert!(header_value(&denied_login, header::LOCATION).contains("unknown_google_account"));

  let activate = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(format!("/api/staff/{created_id}/activate"))
        .header(header::COOKIE, &admin_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(activate.status(), StatusCode::OK);
  let activated = read_json(activate).await;
  assert_eq!(activated["id"], created_id);
  assert_eq!(activated["active"], true);

  let activate_login_start = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/auth/google/start")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();
  let activate_state = cookie_value(&header_value(&activate_login_start, header::SET_COOKIE));

  let login_after_activation = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(format!(
          "/api/auth/google/callback?code=google-code-temp&state={}",
          activate_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, activate_state)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(login_after_activation.status(), StatusCode::SEE_OTHER);
  assert_eq!(
    header_value(&login_after_activation, header::LOCATION),
    "http://localhost:3000"
  );
}

#[tokio::test]
async fn instructors_cannot_manage_staff_users() {
  let app = build_router(test_config());

  let staff_login = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/auth/google/start")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  let oauth_state = cookie_value(&header_value(&staff_login, header::SET_COOKIE));
  let callback = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(format!(
          "/api/auth/google/callback?code=google-code-mkt&state={}",
          oauth_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, oauth_state)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();
  let instructor_cookie = cookie_value(&header_value(&callback, header::SET_COOKIE));

  let create = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/staff")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::COOKIE, &instructor_cookie)
        .body(Body::from(
          json!({
            "email": "blocked@example.com",
            "display_name": "Blocked User",
            "role": "instructor",
            "active": true
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(create.status(), StatusCode::FORBIDDEN);

  let deactivate = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/staff/staff-lee-wells/deactivate")
        .header(header::COOKIE, instructor_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(deactivate.status(), StatusCode::FORBIDDEN);
}
