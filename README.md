# Horse Farm Management

Staff-only MVP for horse farm scheduling, horse assignment, practice rides, and lesson credit balances.

## Development

Run the frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Run the backend after installing Rust:

```powershell
cd backend
cargo test
cargo run
```

Run the deployment contract test:

```powershell
npm.cmd run test:deployment
```

## Deployment Shape

The MVP uses separate frontend, backend, and PostgreSQL services. File uploads and MinIO are intentionally deferred until file workflows are in scope.

See [Production Readiness](docs/production-readiness.md) before treating any deployment as production-ready.
