use horse_farm_backend::{build_persistent_router, AppConfig};
use tokio::net::TcpListener;

fn main() {
  tracing_subscriber::fmt()
    .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
    .init();

  let config = AppConfig::from_env().expect("backend configuration must be set");
  let app = build_persistent_router(config).expect("backend must initialize the session store");
  let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:3001".to_string());
  let runtime = tokio::runtime::Builder::new_multi_thread()
    .enable_all()
    .build()
    .expect("tokio runtime must start");

  runtime.block_on(async move {
    let listener = TcpListener::bind(&bind_addr)
      .await
      .expect("backend bind address must be available");

    tracing::info!(%bind_addr, "backend listening");
    axum::serve(listener, app)
      .await
      .expect("backend server should run");
  });
}
