use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Clone, Debug)]
pub struct AppConfig {
  pub database_url: String,
  pub public_base_url: String,
}

impl AppConfig {
  pub fn from_env() -> Result<Self, ConfigError> {
    let database_url =
      std::env::var("DATABASE_URL").map_err(|_| ConfigError::Missing("DATABASE_URL"))?;
    let public_base_url =
      std::env::var("PUBLIC_BASE_URL").map_err(|_| ConfigError::Missing("PUBLIC_BASE_URL"))?;

    Ok(Self {
      database_url,
      public_base_url,
    })
  }
}

#[derive(Debug, PartialEq, Eq)]
pub enum ConfigError {
  Missing(&'static str),
}

#[derive(Serialize)]
struct HealthResponse {
  status: &'static str,
  service: &'static str,
}

pub fn build_router(_config: AppConfig) -> Router {
  Router::new().nest("/api", api_router())
}

fn api_router() -> Router {
  Router::new().route("/health", get(health))
}

async fn health() -> Json<HealthResponse> {
  Json(HealthResponse {
    status: "ok",
    service: "horse-farm-backend",
  })
}
