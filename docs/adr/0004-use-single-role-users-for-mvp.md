# Use Single-Role Users for the MVP

The broader product plan includes `roles` and `user_roles`, but the staff-only MVP only needs Admin and Instructor users. We will store one primary role per user and centralize authorization checks in backend permission helpers, preserving a straightforward migration path to multi-role RBAC by backfilling current roles into `user_roles` if parent, student, volunteer, or partner access is added later.
