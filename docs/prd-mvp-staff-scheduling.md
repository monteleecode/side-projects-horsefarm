# PRD: Staff Scheduling and Lesson Balance MVP

## Problem Statement

The farm needs a production-ready internal system for staff to manage lessons, horse assignments, practice rides, calendars, and lesson credit balances without exposing the system to students or guardians yet. Today, the highest operational risks are schedule conflicts, unsafe horse/student pairings, unclear lesson balance deductions, and lack of accountability when staff override scheduling warnings or correct records.

## Solution

Build a staff-only Horse Farm Management MVP centered on Admin and Instructor workflows. The MVP will support Google OAuth staff login with an emergency admin login, authoritative staff-managed student and horse records, lessons with participants and horse assignments, practice rides, scheduling constraints, warning overrides, calendars, lesson packages, lesson ledger balances, operational review, audit logging, and production readiness gates.

The system will use Next.js for the frontend, Rust Axum for the backend API, PostgreSQL for persistence, and separate frontend/backend/database containers behind Traefik and Cloudflare Tunnel. MinIO, student/guardian access, notifications, invoicing, files, events, chores, volunteers, and lease-management workflows are deferred.

## User Stories

1. As an Admin, I want to log in with my pre-created Google account, so that only authorized staff can access the system.
2. As an Admin, I want an emergency local admin login, so that I can recover access if Google OAuth fails.
3. As an Admin, I want unknown Google accounts denied, so that external users cannot self-register.
4. As an Admin, I want to create and deactivate staff users, so that access matches current farm staffing.
5. As an Admin, I want deactivating a user to revoke sessions, so that former staff lose access immediately.
6. As an Instructor, I want to log in with Google OAuth, so that I can manage my assigned schedule.
7. As an Admin, I want single-role staff users, so that MVP permissions stay simple.
8. As a Developer, I want centralized permission helpers, so that future multi-role RBAC migration is straightforward.
9. As an Admin, I want to manage student records, so that scheduling and emergency information is accurate.
10. As an Admin, I want every active student to have a main instructor, so that Riding Level ownership is clear.
11. As an Admin, I want every student to have an Emergency Contact, so that staff can respond to urgent safety situations.
12. As an Admin, I want minor students to have at least one Guardian, so that responsible adults are recorded.
13. As an Instructor, I want to see age/minor status and emergency details for students I teach or schedule, so that I can act safely without seeing unnecessary DOB details.
14. As a Main Instructor, I want to update a student's authoritative Riding Level, so that Horse Suitability rules reflect current ability.
15. As an Instructor, I want to submit a Riding Level Opinion, so that the main instructor or Admin can review level changes.
16. As an Admin, I want Riding Level definitions to have editable display names and descriptions, so that they match farm language while keeping stable ordering.
17. As an Admin, I want to manage horse profiles, so that staff can schedule horses safely.
18. As an Admin, I want to track Horse Status, so that injured, unavailable, retired, training, resting, limited-use, and active horses affect scheduling.
19. As an Admin, I want training, resting, and limited-use horses to create warnings, so that staff acknowledge non-standard horse use.
20. As an Admin, I want injured, unavailable, and retired horses to hard-block assignment, so that unsafe or impossible assignments are prevented.
21. As an Admin, I want to manage Horse Suitability by allowed Riding Levels and student-specific approvals/blocks, so that horse/student pairings are safe.
22. As an Instructor, I want unsuitable horse/student pairings to block me, so that I cannot bypass safety-sensitive suitability rules.
23. As an Admin, I want to override suitability per lesson or create lasting student approval, so that legitimate exceptions are explicit and audited.
24. As an Admin, I want missing Horse Suitability to warn me and block instructors, so that setup gaps are visible without blocking migration work.
25. As an Admin, I want horse restriction flags and notes, so that operational health and riding restrictions can affect scheduling without a full vet-history module.
26. As an Instructor, I want instructor-visible horse notes and admin-only horse notes separated, so that I see relevant restrictions without sensitive admin context.
27. As an Admin, I want Horse Ownership metadata, including ownership type, owner name, lessee name, and admin-only contacts, so that operational horse context is recorded without owner accounts.
28. As an Admin, I want Horse Ownership to remain metadata only, so that lease-specific scheduling rules stay out of MVP.
29. As an Instructor, I want to report a Horse Concern, so that Admin can review possible safety or health issues.
30. As an Admin, I want urgent Horse Concerns in Operational Review, so that serious horse observations get attention.
31. As an Instructor, I want urgent Horse Concerns to block me from assigning the horse, so that urgent concerns require Admin authority.
32. As an Admin, I want Horse Availability Constraints with block or warn effect, so that dated horse constraints can represent both hard unavailability and soft restrictions.
33. As an Instructor, I want to manage my own Instructor Availability Constraints, so that my normal availability and exceptions inform scheduling.
34. As an Admin, I want Instructor Availability Constraints to warn but not hard-block, so that schedule exceptions remain possible.
35. As an Admin, I want instructor double-booking to hard-block, so that the same instructor cannot be assigned to overlapping lessons.
36. As an Admin, I want horse overlap to hard-block, so that the same horse cannot be assigned to overlapping lessons or practice rides.
37. As an Admin, I want student overlap to hard-block, so that a student cannot be in overlapping lessons or practice rides.
38. As an Admin, I want Same-Day Student Activity Warnings, so that staff acknowledge when a student has another lesson or practice ride on the same day.
39. As an Admin, I want Warning Overrides to require warning-specific reason codes, so that exception history is useful.
40. As an Admin, I want Warning Overrides stored separately from lessons, so that multiple warnings and their contexts can be audited.
41. As an Admin, I want edited scheduled lessons to re-run Scheduling Constraints, so that old overrides cannot silently authorize changed conditions.
42. As an Admin, I want a backend constraint preview API, so that the frontend can show authoritative hard blocks and warnings before save.
43. As an Instructor, I want inline conflict and warning preview in scheduling dialogs, so that I can fix problems before submitting.
44. As an Admin, I want to manage Lesson Types, so that default duration, Lesson Credit amount, Participation Type, capacity, and Activity Intensity are controlled centrally.
45. As an Instructor, I want Lesson Type defaults copied into lessons, so that existing lessons do not change when defaults change later.
46. As an Admin, I want Lesson Type changes to affect only new lessons by default, so that scheduled history remains stable.
47. As an Instructor, I want to create a draft Lesson, so that I can work on incomplete scheduling details without reserving resources.
48. As an Instructor, I want scheduled Lessons to require at least one Lesson Participant, so that scheduled records represent real instructional commitments.
49. As an Instructor, I want each Lesson Participant to have a Participation Type, so that riding and groundwork are handled correctly.
50. As an Instructor, I want riding participants to require Horse Assignments before scheduling, so that scheduled riding lessons are complete.
51. As an Admin, I want each Lesson Participant to have a Lesson Credit amount before scheduling, so that balance warnings can be accurate.
52. As an Admin, I want mixed Participation Types in a Lesson, so that one participant can ride while another does groundwork.
53. As an Instructor, I want Activity Intensity required for each Lesson, so that horse restriction checks can run.
54. As an Instructor, I want to override Activity Intensity per lesson with a reason, so that a generic lesson type can still reflect the actual lesson.
55. As an Admin, I want capacity warnings on Lessons when optional capacity is exceeded, so that group lessons remain manageable.
56. As an Instructor, I want to schedule recurring Lessons as generated concrete occurrences, so that weekly lessons can be created efficiently.
57. As an Admin, I want recurring Lessons to preview conflicts and create only valid occurrences, so that bad dates are skipped deliberately.
58. As an Instructor, I want to edit individual recurring Lesson occurrences, so that exceptions can be handled without complex series editing.
59. As an Instructor, I want to bulk-cancel my own future Lessons, so that schedule changes can be handled efficiently.
60. As an Admin, I want instructor bulk cancellations visible in Operational Review, so that I can follow up on operational impact.
61. As an Instructor, I want to reschedule my own future scheduled Lessons, so that normal changes do not bottleneck on Admin.
62. As an Admin, I want rescheduling to preserve the original Lesson as rescheduled and create a linked replacement, so that history is not lost.
63. As an Instructor, I want replacement Lessons to copy participants and propose valid horse assignments, so that rescheduling is efficient but safe.
64. As an Instructor, I want no drag-and-drop rescheduling in MVP, so that rescheduling always goes through constraint checks and reason capture.
65. As an Instructor, I want to finalize participant outcomes independently, so that group lesson attendance can be resolved participant by participant.
66. As an Admin, I want a Lesson to become completed only after all participant outcomes are finalized, so that completion means the whole container is resolved.
67. As an Instructor, I want completed participant outcomes to deduct Lesson Credits by default, so that balances reflect attended instruction.
68. As an Instructor, I want No-Show outcomes to support deduct or do-not-deduct decisions, so that late cancellations and exceptions are handled fairly.
69. As an Admin, I want No-Show deduction decisions to be admin-correctable, so that billing-adjacent mistakes can be fixed.
70. As an Instructor, I want late cancellation handled as a No-Show reason, so that late cancellation and no-show deduction policy use one outcome path.
71. As an Admin, I want Cancelled Lessons to never deduct Lesson Credits, so that cancellation does not overlap with No-Show behavior.
72. As an Instructor, I want lesson-level and participant-level notes, so that overall lesson context and student-specific history are both captured.
73. As an Instructor, I want completed notes to be append-only, so that history is preserved while follow-up context can be added.
74. As an Admin, I want to redact finalized notes, so that sensitive or inappropriate text can be removed from app storage.
75. As an Admin, I want to create Lesson Packages, so that purchased or granted lesson credits are recorded.
76. As an Admin, I want Lesson Packages to belong to Students, so that balances are student-specific even when Guardians pay.
77. As an Admin, I want package amount and payment method stored as admin-only metadata, so that I can avoid a separate spreadsheet without building invoicing.
78. As an Instructor, I want to see actual Lesson Balance numbers but not payment metadata, so that I can schedule with operational clarity.
79. As an Admin, I want Lesson Balance calculated from an append-only Lesson Ledger, so that balance history is trustworthy.
80. As an Admin, I want Manual Ledger Adjustments with fixed reason codes and required notes, so that corrections are explicit.
81. As an Admin, I want negative balances allowed and visible, so that real operations are represented even when bookkeeping lags.
82. As an Admin, I want insufficient balance to warn both Admins and Instructors with reason capture, so that scheduling can proceed while exceptions are reviewable.
83. As an Admin, I want optional Lesson Package expiration dates to warn/review rather than automatically remove credits, so that expiration disputes are handled deliberately.
84. As an Admin, I want Practice Rides as a separate scheduling object, so that self practice reserves horse/student time without becoming a zero-credit Lesson.
85. As an Instructor, I want to create Practice Rides within my scheduling scope, so that approved self practice can be recorded without Admin bottleneck.
86. As an Admin, I want each Practice Ride limited to one student and one horse, so that suitability, workload, and conflict checks stay clear.
87. As an Admin, I want Practice Rides to require a supervising staff user, so that responsibility is recorded.
88. As an Instructor, I want Practice Ride supervision not to reserve instructor teaching time, so that accountability does not create false instructor conflicts.
89. As an Admin, I want Practice Rides to count toward horse workload and student overlap checks, so that safety and scheduling remain accurate.
90. As an Admin, I want Practice Rides excluded from Lesson Balance checks by default, so that non-lesson horse use does not affect credits.
91. As an Admin, I want Practice Rides to appear on admin, horse, student, and supervisor calendars, so that all operational views show horse use.
92. As an Admin, I want staff-created Practice Rides only, so that students and guardians do not interact with the system in MVP.
93. As an Admin, I want an Operational Review list, so that already-effective changes and conditions needing follow-up are visible.
94. As an Admin, I want objective balance issues to auto-resolve when fixed and judgment items to require manual resolution, so that review stays useful.
95. As an Admin, I want Operational Review admin-only, so that ownership of exceptions is clear.
96. As an Admin, I want a general audit log for operational state changes, so that I can answer who changed what and when.
97. As an Admin, I want narrow CSV import scripts for initial data setup, so that horses, students, guardians, staff, and starting balances can be loaded safely.
98. As an Admin, I want imports to be dry-run and create-only, so that setup data is validated without accidental overwrites.
99. As an Admin, I want imported starting balances to use Manual Ledger Adjustments, so that old package history is not reconstructed inaccurately.
100. As an Admin, I want admin-managed Locations, so that lessons and practice rides can show where they occur without location conflict rules.
101. As an Admin, I want the calendar to show Lessons, Practice Rides, and relevant constraints, so that scheduling context is visible.
102. As an Admin, I want farm timezone configurable in admin settings, so that calendar and day-based workload rules use the correct local day.
103. As a Maintainer, I want production readiness gates for backups, restores, tests, OAuth, emergency login, audit logging, and routing, so that the first deployment is safe.

## Implementation Decisions

- Build the MVP as a new Next.js frontend, Rust Axum backend, and PostgreSQL database.
- Deploy frontend, backend, and database as separate containers behind Traefik and Cloudflare Tunnel.
- Route the backend API under the same site origin as `/api/*` to avoid CORS and simplify secure cookie auth.
- Keep MinIO and file upload infrastructure out of MVP until file workflows are in scope.
- Backend owns authentication, session issuance, and authorization enforcement.
- Use Google OAuth for normal staff login and one local emergency admin login.
- Use server-side PostgreSQL-backed sessions with a secure HTTP-only session cookie.
- Pre-create staff users; unknown Google accounts are denied.
- Use one primary role per staff user in MVP: Admin or Instructor.
- Centralize authorization checks in backend permission helpers to preserve a migration path to multi-role RBAC.
- Keep students and guardians as non-login domain records in MVP.
- Use Guardian as the domain term and Parent/Guardian as a friendly UI label.
- Require Emergency Contact for every student and Guardian for minor students.
- Derive minor status from date of birth; show instructors age/minor indicator rather than full DOB by default.
- Require active students to have a main instructor.
- Main instructor and Admin can update authoritative Riding Level; other instructors can submit Riding Level Opinions.
- Seed stable Riding Levels and allow Admin to edit display names/descriptions, not identity/order.
- Use explicit allowed Riding Levels for Horse Suitability, plus student-specific approved/blocked overrides.
- Instructor suitability violations are hard blocks; Admin can override per lesson or create lasting approval.
- Missing Horse Suitability blocks instructors and warns Admins.
- Horse Status values include active, training, resting, limited_use, injured, unavailable, and retired.
- Training, resting, and limited_use horse statuses create warnings with saved overrides.
- Injured, unavailable, and retired horse statuses hard-block assignment.
- Horse Availability Constraints represent dated horse-specific block or warn periods.
- Horse Concerns are staff-reported observations; urgent concerns enter Operational Review and block instructors until Admin action.
- Horse Ownership remains metadata only in MVP, with owner/lessee names and admin-only contact details.
- Structured lease management is deferred; lease-specific constraints should be captured manually as notes or constraints in MVP.
- Instructor Availability Constraints are warning-only, but instructor double-booking is a hard block.
- Lessons have one instructor in MVP.
- Lessons can be draft, scheduled, rescheduled, cancelled, or completed.
- Draft Lessons do not reserve horses, instructors, or students.
- Scheduled Lessons require at least one participant, Participation Type for each participant, credit amount for each participant, and Horse Assignment for riding participants.
- Lesson Participants support riding and groundwork Participation Types.
- Participation Type affects horse assignment/workload rules, not credit amount.
- Lessons can mix Participation Types across participants.
- Activity Intensity is required for Lessons and Practice Rides.
- Lesson Type supplies default duration, Lesson Credit amount, Participation Type, capacity, and Activity Intensity.
- Lesson Type defaults are copied onto created lessons/participants; later type changes do not mutate existing records.
- Instructors can override Activity Intensity on their own Lessons with a reason; Admin can override any.
- Capacity is optional and warning-only; it counts all participants.
- Recurring Lesson creation generates concrete Lesson records and copies current defaults at generation time.
- Recurring Lesson creation previews conflicts and creates valid occurrences while skipping hard-conflicted ones.
- MVP supports individual occurrence edits, not whole-series editing.
- Rescheduling a Lesson preserves the original as rescheduled and creates a linked replacement.
- Rescheduled original participants get rescheduled participant outcomes.
- Replacement Lessons copy participants and propose prior horse assignments only after constraint checks.
- Whole-Lesson cancellation cancels unresolved participant outcomes and never deducts Lesson Credits.
- Participant outcomes are pending, completed, no_show, cancelled, or rescheduled.
- Participant outcomes can be finalized independently; the Lesson becomes completed only when all outcomes are finalized.
- Completed outcomes deduct Lesson Credits by default.
- No-Show outcomes support deduct_lesson or do_not_deduct with reason codes; late cancellation is a No-Show reason.
- Finalized participant outcomes are admin-correctable only, using compensating ledger entries.
- Lesson notes exist at lesson and participant levels.
- Finalized notes are append-only; Admin redaction irreversibly removes note body from app storage and records metadata.
- Lesson Package adds credits to a student-level Lesson Ledger.
- Deductions reduce the student's general Lesson Balance rather than a specific package.
- Package expiration warns/reviews but does not automatically remove credits.
- Lesson Ledger is the source of truth; balances are derived from append-only entries.
- Manual Ledger Adjustments are Admin-only, require fixed reason code and note, and never edit prior entries.
- Negative balances are allowed and create review visibility.
- Practice Ride is separate from Lesson, one student and one horse only, with scheduled/cancelled/completed statuses.
- Practice Ride requires a supervising staff user but does not reserve that user's instructor time.
- Practice Ride counts toward horse workload, horse conflicts, student conflicts, and Same-Day Student Activity Warnings.
- Practice Ride does not check or deduct Lesson Balance by default.
- Practice Ride rescheduling is a simple edit with audit logging rather than linked replacement history.
- Scheduling Constraint evaluation is backend-owned and exposed through a preview API used by dialogs and save flows.
- Constraint preview returns structured codes, severity, default messages, affected entity references, and required override metadata.
- Warning Overrides are separate records with warning-specific reason-code sets and optional notes.
- Editing relevant scheduled fields invalidates active overrides for the changed context and requires re-checking constraints.
- Operational Review includes negative balances, insufficient balance overrides, suitability admin overrides, missing suitability setup, urgent Horse Concerns, instructor bulk cancellations, horse workload overrides, and Same-Day Student Activity Warnings.
- Operational Review excludes routine instructor availability overrides, routine admin edits, normal Horse Concerns, and horse status warning overrides by default.
- Calendars show Lessons, Practice Rides, relevant constraints, and warning indicators, but Operational Review remains a separate admin dashboard.
- Calendar editing uses dialogs/forms, not drag-and-drop in MVP.
- Locations are Admin-managed reference data and optional on Lessons/Practice Rides; location conflict prevention is deferred.
- Initial setup import is a create-only command-line/admin script with dry-run mode.
- Initial import covers horses, students, guardians, emergency contacts, staff, and starting balances as Manual Ledger Adjustments.
- Historical lesson import and package reconstruction are deferred.
- Admin-editable operational settings include farm timezone and low-risk scheduling defaults.
- Security/deployment settings remain environment-only.

### Major Modules

- Authentication and session module: OAuth callback, emergency admin login, session storage, revocation, `/api/me`, and access denial for unknown users.
- Authorization module: centralized permission helpers for Admin/Instructor capabilities.
- Staff/user module: pre-created staff users, activation/deactivation, single-role assignment.
- Student records module: students, Guardians, Emergency Contacts, main instructor, Riding Level, Riding Level Opinions, notes, and visibility rules.
- Horse records module: profiles, Horse Status, Horse Suitability, restriction flags, notes, Horse Ownership, Horse Concerns, and Horse Availability Constraints.
- Lesson scheduling module: Lesson Type defaults, Lessons, Lesson Participants, Horse Assignments, recurring generation, cancellation, rescheduling, completion, notes, and participant outcomes.
- Practice Ride module: one-student/one-horse scheduling object with supervisor, status, constraints, workload, and calendar presence.
- Scheduling constraint engine: deep, isolated backend module that evaluates proposed Lesson and Practice Ride changes and returns hard blocks, warnings, and override requirements.
- Warning override module: reason sets, active context handling, invalidation, history, and review integration.
- Lesson ledger module: Lesson Packages, Lesson Credits, Lesson Ledger entries, Manual Ledger Adjustments, balance calculation, package expiration warnings, and negative balance handling.
- Operational review module: creation, auto-resolution, manual resolution, filtering, and links to affected entities.
- Calendar query module: read models for admin, horse, instructor, and student calendars.
- Audit log module: operational state change history with actor, action, entity, timestamp, and metadata.
- Admin settings module: farm timezone and operational defaults.
- Initial import module: dry-run create-only CSV import for setup-stage data.
- Production deployment module: Docker Compose, Traefik routing, environment configuration, backup/restore documentation, and launch checklist.

## Testing Decisions

- Tests should assert externally visible behavior: accepted/rejected scheduling operations, emitted warnings, created ledger entries, role permissions, review items, and audit records.
- Tests should not assert internal query ordering, private helper function calls, or frontend implementation details.
- The scheduling constraint engine should have focused unit tests because it is the deepest business-rule module.
- The Lesson lifecycle should have integration tests for draft, scheduled, cancelled, rescheduled, completed, and participant outcome flows.
- The Practice Ride module should have tests for horse conflicts, student conflicts, suitability checks, workload warnings, and no balance effects.
- The Lesson Ledger module should have tests for package credit additions, completed deductions, No-Show deduction choices, manual adjustments, negative balances, and package expiration review behavior.
- Authorization tests should cover Admin and Instructor permissions for lessons, practice rides, horse/student edits, suitability overrides, ledger adjustments, and Operational Review visibility.
- Authentication tests should cover pre-created OAuth users, unknown OAuth denial, emergency admin login, session creation, session revocation, and user deactivation.
- Operational Review tests should cover item creation, auto-resolution for balance issues, manual resolution for judgment items, and admin-only visibility.
- Calendar query tests should verify Lessons, Practice Rides, constraints, and warning indicators appear in the correct views.
- Import tests should cover dry-run validation, create-only duplicate failures, starting balance adjustments, and negative balance review creation.
- Production readiness requires automated tests for horse overlap hard blocks, instructor overlap hard blocks, student overlap hard blocks, Same-Day Student Activity Warnings, Horse Suitability, Horse Status warnings/blocks, Lesson Ledger deductions, No-Show handling, reschedule history, and Admin/Instructor authorization.
- There is no existing committed test framework in the current repo; the new stack should introduce appropriate Rust backend tests and frontend tests as part of implementation.

## Out of Scope

- Student and Guardian portal access.
- Student self-booking and lesson request approvals.
- External student or Guardian notifications.
- Full invoice creation, invoice numbers, partial payment workflows, accounting reports, payment processing, or receipts.
- Events, clinics as standalone event workflows, horse shows, chores, tasks, volunteer tracking, and partner organization access.
- File uploads, MinIO-backed document storage, photo galleries, waivers, vet files, and certificates.
- Structured horse history, including awards, competition records, veterinary history, and historical health records.
- Historical lesson import before go-live.
- Google Calendar synchronization.
- Drag-and-drop calendar rescheduling.
- Whole-series recurring lesson editing.
- Package-level Lesson Credit allocation and automatic expiration enforcement.
- Structured arena/location scheduling with conflict prevention.
- Structured horse lease management, including lease fees, lease date ranges, lessee records, self-practice time limits, and lease-specific scheduling constraints.
- Owner, lessee, student, guardian, volunteer, or partner login accounts.
- Multi-role RBAC beyond single Admin/Instructor role.
- Microservices.

## Further Notes

- The repo currently contains planning documents and domain docs, not an implementation.
- `CONTEXT.md` is the source of domain vocabulary and should remain glossary-only.
- ADRs currently record deferred MinIO, Next.js/Rust Axum/PostgreSQL, backend-owned auth, single-role MVP users, and Practice Ride as a separate scheduling object.
- `docs/future-phases.md` tracks intentionally deferred features.
- `docs/production-readiness.md` tracks production launch gates.
- The final rewritten product plan should be generated from this PRD and the resolved decisions rather than editing the older plan incrementally.
