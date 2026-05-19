mod auth;

pub use auth::{AppConfig, BuildError, ConfigError, StaffRole, StaffUser};

use axum::Router;
use tower_http::trace::TraceLayer;

pub fn build_router(config: AppConfig) -> Router {
  auth::build_router(config).layer(TraceLayer::new_for_http())
}

pub fn build_persistent_router(config: AppConfig) -> Result<Router, BuildError> {
  Ok(auth::build_persistent_router(config)?.layer(TraceLayer::new_for_http()))
}
