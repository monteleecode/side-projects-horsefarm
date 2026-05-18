# Production Readiness Checklist

The MVP should not be treated as production-ready until these launch gates are satisfied.

## Data Protection

- [ ] Automated daily PostgreSQL backups are configured.
- [ ] At least one backup copy is stored off-machine or off-host.
- [ ] Restore procedure is documented.
- [ ] Restore procedure has been tested successfully.

## Business Rule Safety

- [ ] Horse overlap hard-block tests pass.
- [ ] Instructor overlap hard-block tests pass.
- [ ] Student overlap hard-block tests pass.
- [ ] Same-day student lesson warning tests pass.
- [ ] Horse suitability tests pass.
- [ ] Horse status warning/blocking tests pass.
- [ ] Lesson completion ledger tests pass.
- [ ] No-show deduct/do-not-deduct tests pass.
- [ ] Reschedule history tests pass.
- [ ] Admin/instructor authorization tests pass.

## Authentication and Access

- [ ] Google OAuth login works for pre-created staff users.
- [ ] Unknown Google accounts are denied.
- [ ] Emergency admin login works.
- [ ] User deactivation revokes active sessions.
- [ ] Session cookies are secure, HTTP-only, and scoped correctly.

## Operations

- [ ] Audit logging is enabled for operational state changes.
- [ ] Production environment secrets are configured outside source control.
- [ ] Traefik and Cloudflare routes are verified.
- [ ] PostgreSQL is not publicly exposed.
- [ ] Staff seed users and roles are reviewed.
- [ ] External student and guardian notifications are disabled.
