# Backend Owns Authentication and Authorization

The frontend is a Next.js application, but the Rust Axum backend owns authentication, session issuance, and authorization enforcement. Next.js may render login and route guard UI, but the backend sets and validates secure HTTP-only session cookies and protects all application APIs so permission rules live with the data they protect.
