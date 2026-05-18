# Security Stack Recommendation
## Horse Farm Management System

---

# 1. Authentication Security

## Google OAuth 2.0

Primary login method.

### Purpose
- Secure authentication
- Reduced password management burden
- Easier onboarding
- Better account recovery

### Recommended Providers
- Google OAuth

### Rust Libraries
```toml
oauth2
openidconnect
```

---

## Local Password Login (Fallback)

Even with Google OAuth, keep optional local login for:
- Admin emergency access
- Offline/local-only situations
- Recovery accounts

---

## Password Hashing

### Recommended Algorithm
## Argon2id

Why:
- Modern password hashing standard
- Resistant to GPU attacks
- Memory-hard algorithm
- Recommended over bcrypt for new systems

### Rust Crates
```toml
argon2
password-hash
rand_core
```

### Password Policy
Recommended:
- Minimum 12 characters
- Require strong passwords for admin accounts
- Password reset flow
- Password expiration NOT required

---

# 2. Session and Token Security

## Recommended Authentication Method

### JWT + Secure Cookies

Recommended setup:
- Access token (short-lived)
- Refresh token
- HTTP-only cookies

---

## Cookie Security

Enable:
- HttpOnly
- Secure
- SameSite=Lax or Strict

---

## Session Expiration

### Suggested Settings

| Token Type | Expiration |
|---|---|
| Access Token | 15 minutes |
| Refresh Token | 7–30 days |

---

# 3. Authorization Security

## Role-Based Access Control (RBAC)

Required roles:
- Admin
- Instructor
- Student
- Parent
- Volunteer
- Partner

---

## Permission Middleware

Backend middleware should:
- Verify login
- Verify role
- Verify ownership/access rights

Examples:
- Parent can only view linked child
- Instructor only edits assigned lessons
- Volunteer cannot access invoices

---

# 4. API Security

## HTTPS Everywhere

Since you already use:
- Traefik
- Cloudflare Tunnel

You already have strong HTTPS infrastructure.

---

## Rate Limiting

Protect:
- Login endpoints
- OAuth callbacks
- File uploads
- Public APIs

### Recommended Rust Crates
```toml
tower-governor
```

---

## Request Validation

Validate:
- Input length
- Email format
- File type
- File size
- JSON structure

### Recommended Libraries
```toml
validator
serde
```

---

# 5. Database Security

## PostgreSQL Security

### Recommended Practices

- Strong DB password
- Internal-only database access
- No public PostgreSQL exposure
- Separate DB user for app
- Regular backups

---

## Database Access

Use:
```txt
SQLx
```

Benefits:
- Compile-time checked SQL
- Prevents many SQL injection risks
- Parameterized queries

---

# 6. File Upload Security

## Required Protections

### File Type Validation

Allow only:
- images
- pdf
- doc/docx
- spreadsheets if needed

Reject:
- executable files
- scripts

---

## File Size Limits

Recommended:
- Images: 10 MB
- Documents: 20 MB

---

## File Storage Isolation

Store uploads:
- outside frontend public directory
- in MinIO bucket
- behind authenticated API access

---

## Virus Scanning (Future)

Optional later:
```txt
ClamAV container
```

---

# 7. Infrastructure Security

## Docker Security

### Recommendations

- Use non-root containers
- Use Docker secrets for credentials
- Separate internal networks
- Minimal container permissions

---

## Traefik Security

### Recommended Features

- HTTPS only
- Security headers
- IP whitelisting for admin routes if desired
- Middleware protections

---

## Cloudflare Tunnel

Benefits:
- No direct port exposure
- DDoS protection
- Hidden origin server
- TLS handled externally

---

# 8. Email Security

## Recommended Email Providers

Production:
- SendGrid
- Amazon SES
- Resend
- Mailgun

For local testing:
- Mailpit container

---

## Email Protections

Configure:
- SPF
- DKIM
- DMARC

Especially important for:
- lesson reminders
- parent notifications
- invoice emails

---

# 9. Logging and Audit Security

## Audit Logging

Track:
- Login attempts
- Permission changes
- Lesson changes
- Horse assignment changes
- Invoice changes
- File uploads/deletes

---

## Recommended Logging Stack

Simple MVP:
```txt
tracing
tracing-subscriber
```

Future:
```txt
Grafana + Loki
```

---

# 10. Backup and Disaster Recovery

## PostgreSQL Backups

Recommended:
- Daily automated backups
- Weekly full backup retention
- Off-machine backup copy

---

## MinIO/File Backups

Backup:
- Uploaded photos
- Documents
- Event records

---

# 11. Secrets Management

## Never Hardcode

Do NOT hardcode:
- OAuth secrets
- DB passwords
- JWT secrets
- SMTP credentials

---

## Recommended Storage

### MVP
```txt
.env files
Docker secrets
```

### Future
```txt
Vault
1Password Secrets Automation
```

---

# 12. Recommended Rust Security Crates

## Authentication
```toml
oauth2
openidconnect
jsonwebtoken
argon2
```

---

## Validation
```toml
validator
serde
```

---

## Security Utilities
```toml
tower-http
tower-governor
```

---

## Logging
```toml
tracing
tracing-subscriber
```

---

# 13. Recommended Security Architecture

```txt
Cloudflare Tunnel
        ↓
Traefik
        ↓
Frontend (Next.js)
        ↓
Rust Backend (Axum)
        ↓
PostgreSQL + MinIO
```

Security layers:
- HTTPS
- OAuth
- JWT
- RBAC
- Rate limiting
- Secure cookies
- Input validation
- File validation
- Internal-only DB access

---

# 14. Recommended MVP Security Checklist

## Must Have Before Production

### Authentication
- [ ] Google OAuth
- [ ] Argon2 password hashing
- [ ] Secure cookies
- [ ] JWT expiration

### API
- [ ] Rate limiting
- [ ] Input validation
- [ ] Role middleware

### Infrastructure
- [ ] HTTPS enabled
- [ ] DB not publicly exposed
- [ ] Secure Docker setup

### File Uploads
- [ ] File type validation
- [ ] File size limits
- [ ] Authenticated file access

### Operations
- [ ] Daily backups
- [ ] Audit logs
- [ ] Environment secrets protection

---

# Final Recommendation

For your system size (~100 users), this security stack is more than enough for a professional production deployment.

Priority order:
1. Authentication security
2. RBAC permissions
3. Backup strategy
4. File upload security
5. Audit logging

Those five areas matter the most for real-world farm operations.

Related documents:
- Product Plan: ./product-plan.md
- Database Design: ./db-design.md

# End of Document