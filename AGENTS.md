# Repository Guidelines

## Project Structure & Module Organization

This repository uses a Next.js frontend and a Rust Axum backend with PostgreSQL. The frontend lives in `frontend/`, with the app shell under `frontend/app/`, shared styles in `frontend/app/globals.css`, and the Next config in `frontend/next.config.ts`. The backend lives in `backend/`, with the crate root in `backend/Cargo.toml`, executable entry point in `backend/src/main.rs`, shared router/config logic in `backend/src/lib.rs`, and backend tests in `backend/tests/`. Deployment shape and environment wiring are tracked in `docker-compose.yml`.

## Build, Test, and Development Commands

Run `npm.cmd install` in `frontend/` after changing frontend dependencies. Use `npm.cmd run dev` from `frontend/` to start the Next app on port `3000`. Use `npm.cmd run build` to verify the frontend production build and `npm.cmd test` to run the frontend source contract test.

Run `cargo test` inside `backend/` to validate the Rust backend. Use `cargo run` from `backend/` when you need to start the API locally.

From the repo root, run `npm.cmd run test:deployment` to verify the Compose and routing contract.

## Coding Style & Naming Conventions

Use TypeScript and React for the frontend, and CommonJS is no longer the target style. Keep the app shell small and route browser API traffic through `/api/*`. In Rust, prefer small modules with explicit config and router seams. Keep two-space indentation in frontend code and idiomatic Rust formatting in backend code.

## Testing Guidelines

Prefer direct tests of source contracts and deployment wiring for the MVP shell. When adding frontend behavior, keep tests close to the relevant file in `frontend/app/`. When adding backend behavior, keep route and config tests under `backend/tests/`.

## Commit & Pull Request Guidelines

Use short, imperative commit messages. PRs should explain what changed, why the change matters to the MVP slice, and which checks were run. Include screenshots only when the frontend output changes visibly.

## Security & Configuration Tips

Keep secrets in `.env` files and out of source control. Do not commit local build output such as `frontend/.next/`, `frontend/node_modules/`, or `backend/target/`. The deployment baseline intentionally excludes MinIO until file uploads are implemented.

## Agent skills

### Issue tracker

GitHub Issues in `monteleecode/side-projects-horsefarm`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default label names for `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: one root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

### GitHub ship flow

Use the `github:yeet` skill to publish a branch, open the PR, merge it, delete the branch, and close the linked issue.
