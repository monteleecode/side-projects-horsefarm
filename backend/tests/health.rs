use axum::{
  body::Body,
  http::{Request, StatusCode},
};
use horse_farm_backend::{build_router, AppConfig};
use http_body_util::BodyExt;
use serde_json::json;
use tower::ServiceExt;

#[tokio::test]
async fn health_endpoint_reports_backend_is_ready() {
  let app = build_router(AppConfig {
    database_url: "postgres://horsefarm:horsefarm@localhost:5432/horsefarm".to_string(),
    public_base_url: "http://localhost:3000".to_string(),
  });

  let response = app
    .oneshot(
      Request::builder()
        .uri("/api/health")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::OK);

  let body = response.into_body().collect().await.unwrap().to_bytes();
  let payload: serde_json::Value = serde_json::from_slice(&body).unwrap();

  assert_eq!(
    payload,
    json!({
      "status": "ok",
      "service": "horse-farm-backend"
    })
  );
}
