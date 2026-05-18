# Horse Farm Management

Horse Farm Management is a staff-only system for running the operational side of a horse farm.

- lesson scheduling
- horse assignment
- practice rides
- lesson credit balances
- staff-facing calendar and review workflows

The goal is to replace spreadsheet-driven scheduling with a controlled internal app that keeps staff, horses, lessons, and balances in one place.

## Current Phase

The repo is in the foundation phase. It has the deployment skeleton in place, but not the full business application yet.

What exists now:

- a Next.js frontend shell
- a Rust Axum backend shell
- PostgreSQL wired into local deployment
- a backend health endpoint at `/api/health`
- a deployment contract test for the compose wiring

What does not exist yet:

- real lesson, horse, or student management screens
- authentication and authorization flows
- scheduling rules and conflict checking
- lesson balance logic
- file uploads, invoicing, notifications, and other later-phase features

This is a deployable infrastructure baseline, not a production-ready business application.

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
