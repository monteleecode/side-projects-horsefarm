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

async fn login_with_google(app: &axum::Router, code: &str) -> String {
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
          "/api/auth/google/callback?code={code}&state={}",
          oauth_state.split('=').nth(1).unwrap_or("")
        ))
        .header(header::COOKIE, oauth_state)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  cookie_value(&header_value(&callback, header::SET_COOKIE))
}

async fn login_as_admin(app: &axum::Router) -> String {
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

  cookie_value(&header_value(&login, header::SET_COOKIE))
}

#[tokio::test]
async fn admin_can_create_students_and_edit_riding_levels() {
  let app = build_router(test_config());
  let admin_cookie = login_as_admin(&app).await;

  let create = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/students")
        .header(header::COOKIE, &admin_cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "first_name": "Mia",
            "last_name": "Grant",
            "date_of_birth": "2011-05-01",
            "active": true,
            "main_instructor_id": "staff-mkt-monte",
            "riding_level_id": "level-green",
            "notes": "Prefers bay horses.",
            "guardians": [
              {
                "name": "Alex Grant",
                "relationship": "guardian",
                "phone": "555-0201",
                "email": "alex.grant@example.com"
              }
            ],
            "emergency_contacts": [
              {
                "name": "Taylor Grant",
                "relationship": "emergency contact",
                "phone": "555-0202",
                "email": "taylor.grant@example.com"
              }
            ]
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(create.status(), StatusCode::OK);
  let created = read_json(create).await;
  let student_id = created["id"].as_str().unwrap().to_string();
  assert_eq!(created["date_of_birth"], json!("2011-05-01"));
  assert_eq!(created["is_minor"], json!(true));
  assert_eq!(created["main_instructor"]["id"], json!("staff-mkt-monte"));
  assert_eq!(created["guardians"].as_array().unwrap().len(), 1);
  assert_eq!(created["emergency_contacts"].as_array().unwrap().len(), 1);

  let list = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/students")
        .header(header::COOKIE, &admin_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(list.status(), StatusCode::OK);
  let list_payload = read_json(list).await;
  assert!(
    list_payload["students"]
      .as_array()
      .unwrap()
      .iter()
      .any(|student| student["id"] == student_id)
  );

  let update_level = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(format!("/api/students/{student_id}/riding-level"))
        .header(header::COOKIE, &admin_cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "recommended_riding_level_id": "level-solid"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(update_level.status(), StatusCode::OK);
  let updated_level = read_json(update_level).await;
  assert_eq!(updated_level["riding_level"]["id"], json!("level-solid"));

  let riding_level_edit = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri("/api/riding-levels/level-green")
        .header(header::COOKIE, &admin_cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "display_name": "Green Rider",
            "description": "Updated description"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(riding_level_edit.status(), StatusCode::OK);
  let edited_level = read_json(riding_level_edit).await;
  assert_eq!(edited_level["display_name"], json!("Green Rider"));
}

#[tokio::test]
async fn instructors_can_submit_opinions_but_not_authoritative_level_changes() {
  let app = build_router(test_config());
  let instructor_cookie = login_with_google(&app, "google-code-lee").await;

  let list = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/students")
        .header(header::COOKIE, &instructor_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(list.status(), StatusCode::OK);
  let list_payload = read_json(list).await;
  let student_id = list_payload["students"][0]["id"].as_str().unwrap().to_string();

  let opinion = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(format!("/api/students/{student_id}/riding-level-opinions"))
        .header(header::COOKIE, &instructor_cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "recommended_riding_level_id": "level-advanced",
            "note": "Ready for more independent work."
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(opinion.status(), StatusCode::OK);
  let opinion_payload = read_json(opinion).await;
  assert_eq!(opinion_payload["opinions"].as_array().unwrap().len(), 1);
  assert_eq!(opinion_payload["opinions"][0]["enters_review"], json!(true));

  let forbidden_update = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(format!("/api/students/{student_id}/riding-level"))
        .header(header::COOKIE, &instructor_cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "recommended_riding_level_id": "level-solid"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(forbidden_update.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn instructors_do_not_see_full_birthdates_by_default() {
  let app = build_router(test_config());
  let instructor_cookie = login_with_google(&app, "google-code-mkt").await;

  let response = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/students")
        .header(header::COOKIE, &instructor_cookie)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::OK);
  let payload = read_json(response).await;
  assert!(payload["students"][0]["date_of_birth"].is_null());
  assert!(payload["students"][0]["is_minor"].is_boolean());
}

#[tokio::test]
async fn students_require_contacts_and_guardians_when_minor() {
  let app = build_router(test_config());
  let admin_cookie = login_as_admin(&app).await;

  let missing_contacts = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/students")
        .header(header::COOKIE, &admin_cookie)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "first_name": "No",
            "last_name": "Contacts",
            "date_of_birth": "2012-01-01",
            "active": true,
            "main_instructor_id": "staff-mkt-monte",
            "riding_level_id": "level-green",
            "notes": null,
            "guardians": [],
            "emergency_contacts": []
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(missing_contacts.status(), StatusCode::UNPROCESSABLE_ENTITY);
}
