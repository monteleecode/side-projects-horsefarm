use horse_farm_backend::{build_persistent_router, AppConfig};
use std::{thread, time::Duration};
use tokio::net::TcpListener;

const SESSION_STORE_INIT_ATTEMPTS: usize = 20;
const SESSION_STORE_INIT_RETRY_DELAY: Duration = Duration::from_secs(1);

fn main() {
  tracing_subscriber::fmt()
    .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
    .init();

  let config = AppConfig::from_env().expect("backend configuration must be set");
  let app = {
    let mut initialized_app = None;
    let mut last_error = None;

    for attempt in 1..=SESSION_STORE_INIT_ATTEMPTS {
      match build_persistent_router(config.clone()) {
        Ok(app) => {
          initialized_app = Some(app);
          break;
        }
        Err(error) => {
          tracing::warn!(
            attempt,
            max_attempts = SESSION_STORE_INIT_ATTEMPTS,
            %error,
            "backend session store is not ready"
          );
          last_error = Some(error);
          thread::sleep(SESSION_STORE_INIT_RETRY_DELAY);
        }
      }
    }

    initialized_app.unwrap_or_else(|| {
      panic!(
        "backend must initialize the session store after retries: {}",
        last_error
          .map(|error| error.to_string())
          .unwrap_or_else(|| "unknown error".to_string())
      )
    })
  };
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
