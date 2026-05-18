# Horse Farm Management System
## Project Planning Document

---

# 1. Project Overview

## Project Name
Horse Farm Management System

## Purpose

The Horse Farm Management System is a web-based application designed to help horse farms manage:

- Lesson scheduling
- Horse assignments
- Rider/student management
- Volunteer tracking
- Chore/task management
- Invoice tracking
- Calendar scheduling
- File and photo storage
- Special events and horse shows

The system is intended for real-world farm operations and will initially be deployed locally behind an existing Traefik and Cloudflare Tunnel infrastructure.

---

# 2. Project Goals

## Primary Goals

- Simplify lesson scheduling workflows
- Prevent horse scheduling conflicts
- Centralize horse and student records
- Improve communication between instructors, students, and parents
- Track volunteering and farm chores
- Maintain historical records and uploaded documents
- Provide scalable architecture for future expansion

## MVP Goals

The initial MVP will focus on:

### A. Admin Scheduling and Horse Assignment
- Instructor availability
- Lesson scheduling
- Horse assignment
- Conflict prevention

### B. Student Self-Booking
- Students request lessons
- Instructor approval workflow
- Email notifications

---

# 3. Technology Stack

## Frontend

### Next.js
Used for:
- Web frontend
- Routing
- Dashboard pages
- Calendar interfaces
- Authentication UI

### Shadcn/ui
Used for:
- Tables
- Forms
- Dialogs
- Cards
- Calendar components
- Alerts
- Role-based UI components

---

## Backend

### Rust
Main backend programming language.

Benefits:
- High performance
- Strong type safety
- Excellent concurrency
- Production reliability

### Axum
Rust web framework used for:
- REST APIs
- Routing
- Authentication
- Middleware
- Request handling

---

## Database

### PostgreSQL
Primary relational database.

Used for:
- Users
- Lessons
- Horses
- Scheduling
- Tasks
- Invoices
- Historical records

### SQLx
Rust database library used to interact with PostgreSQL.

Benefits:
- Compile-time SQL checking
- Async support
- Strong type safety

---

## File Storage

### MinIO
S3-compatible object storage.

Used for:
- Photo uploads
- Documents
- Certificates
- Medical records
- Event files

---

## Infrastructure

### Docker Compose
Container orchestration for local deployment.

### Traefik
Reverse proxy and routing.

### Cloudflare Tunnel
Secure external access without exposing ports directly.

---

# 4. User Roles and Permissions

## Roles

### Admin
Permissions:
- Full system access
- User management
- Invoice management
- Scheduling management
- Horse management
- Event management
- Permission control

---

### Instructor
Permissions:
- Manage availability
- Approve lesson requests
- Assign horses
- View student records
- Create schedules
- Manage lesson notes

---

### Student
Permissions:
- Request lessons
- View schedules
- View assigned horses
- Track volunteering hours
- Receive notifications

---

### Parent
Permissions:
- View child schedules
- Receive notifications
- Access invoices
- View lesson history

---

### Volunteer
Permissions:
- View assigned tasks
- Track volunteer hours
- View event schedules

---

### Third-Party Partner
Permissions:
- Limited event access
- Volunteer tracking access
- Restricted reporting access

---

# 5. Authentication System

## Requirements

- Google OAuth login
- Role-based authorization
- Session management
- Secure route protection
- Parent-child relationship support

## Future Enhancements

- Multi-factor authentication
- Invitation-based onboarding
- Partner organization login

---

# 6. Lesson Scheduling System

## Supported Lesson Types

- Private lessons
- Group lessons
- Camps
- Recurring lessons
- Clinics
- Training sessions
- Special events
- Horse shows

## Not Included

- Trail rides

---

## Scheduling Workflow

### Student Booking Flow

1. Student requests lesson
2. Instructor reviews request
3. Instructor approves/rejects/modifies
4. Horse assigned manually
5. Notifications sent

---

### Instructor Scheduling Flow

1. Instructor creates lesson slot
2. Students join/request
3. Instructor confirms
4. Horse assigned
5. Calendar updated

---

# 7. Scheduling Rules

## Hard Blocking Rules

The system must block:
- Same horse booked at the same time

---

## Warning Rules

The system should warn but allow:
- Horse workload concerns
- Student double booking
- Instructor overbooking
- Scheduling outside preferred hours

---

## Instructor Availability

Instructors can:
- Create available time blocks
- Define recurring schedules
- Set unavailable periods
- Define lesson limits

---

# 8. Horse Management System

## Horse Profile Fields

### Basic Information
- Name
- Breed
- Age
- Arrival date
- Owner

### Operational Information
- Availability
- Current status
- Workload limits
- Rider suitability
- Riding frequency

### Health Information
- Health history
- Veterinary records
- Restrictions
- Injury status

### Historical Information
- Award history
- Competition records
- Notes

---

## Horse Status Types

- Active
- Resting
- Injured
- Training
- Retired
- Unavailable

---

# 9. Student and Rider Management

## Student Information

### Basic Information
- Name
- Email
- Phone
- Date of birth

### Riding Information
- Riding level
- Lesson history
- Preferred horse
- Restrictions

### Emergency Information
- Emergency contact
- Parent/guardian relationship

### Historical Information
- Award history
- Accumulated lessons
- Volunteer hours

---

# 10. Volunteer Management

## Features

- Volunteer hour tracking
- Event participation tracking
- Partner organization tracking
- Volunteer scheduling
- Volunteer history

## Partner Support

Third-party organizations can:
- Track assigned volunteers
- View event schedules
- Access limited reports

---

# 11. Chore and Task Management System

## Task Types

### Daily Chores
Examples:
- Feeding
- Stall cleaning
- Water refill
- Turnout

### Weekly Chores
Examples:
- Deep cleaning
- Equipment checks
- Inventory review

### Project Tasks
Examples:
- Fence repair
- Barn maintenance
- Event preparation

### Waitlist Tasks
Examples:
- Lower priority improvements
- Deferred maintenance

---

## Task Features

- Assignment system
- Recurring schedules
- Due dates
- Priority levels
- Status tracking
- Completion history
- Related horse/event/project links

---

## Task Statuses

- Todo
- Assigned
- In Progress
- Completed
- Skipped

---

# 12. Calendar System

## Required Calendar Views

### Farm Calendar
Overall farm schedule.

### Instructor Calendar
Instructor-specific schedules.

### Horse Calendar
Horse usage and availability.

### Student Calendar
Student lessons and events.

### Event Calendar
Special events and horse shows.

---

## Future Integrations

### Google Calendar Sync
Potential features:
- Personal calendar sync
- Instructor sync
- Student sync
- Event sync

---

# 13. Invoice Tracking System

## Features

- Invoice creation
- Payment tracking
- Invoice status management
- Due date tracking
- Parent invoice visibility

## Invoice Statuses

- Paid
- Unpaid
- Partial
- Overdue

---

# 14. Notification System

## Notification Methods

### Email Notifications
Used for:
- Lesson approvals
- Rejections
- Schedule changes
- Event reminders
- Invoice notices
- Horse assignment updates

---

## Parent Notification Rules

If student is underage:
- Parent also receives notifications

---

# 15. File and Photo Upload System

## Supported Upload Types

### Horse Related
- Horse photos
- Veterinary records
- Award certificates

### Student Related
- Waivers
- Certifications
- Competition records

### Event Related
- Posters
- Photos
- Documents

### Task Related
- Maintenance photos
- Project documents

---

## File Metadata

- File name
- Upload date
- Uploaded by
- File type
- Related entity
- Visibility permissions

---

# 16. Database Design

## Core Tables

### User Management
- users
- roles
- user_roles

### Horse Management
- horses
- horse_health_records
- horse_awards
- horse_availability

### Student Management
- students
- parents
- student_awards

### Scheduling
- lessons
- lesson_requests
- lesson_participants
- horse_assignments
- instructor_availability

### Events
- special_events
- event_participants

### Tasks
- chores
- recurring_tasks
- task_assignments

### Volunteers
- volunteer_records
- partner_organizations

### Invoices
- invoices
- invoice_items

### Files
- uploaded_files

---

# 17. Backend Architecture

## Recommended Structure

```txt
backend/
  src/
    main.rs

    routes/
      auth.rs
      users.rs
      horses.rs
      lessons.rs
      scheduling.rs
      calendar.rs
      invoices.rs
      volunteers.rs
      tasks.rs
      uploads.rs

    handlers/
    services/
    repositories/
    models/

    db.rs
    config.rs
```

---

# 18. Frontend Structure

## Suggested Pages

```txt
/login

/dashboard

/calendar

/lessons
/lessons/requests

/horses
/horses/[id]

/students
/students/[id]

/volunteers

/tasks

/events

/invoices

/admin/users
/admin/settings
```

---

# 19. Infrastructure and Deployment

## Deployment Overview

```txt
Cloudflare Tunnel
        ↓
Traefik
        ↓
farm-frontend
farm-backend
farm-db
farm-storage
```

---

## Containers

### farm-frontend
Next.js frontend container.

### farm-backend
Rust Axum backend container.

### farm-db
PostgreSQL database container.

### farm-storage
MinIO storage container.

---

## Networking Recommendations

### Public Access
Expose:
- frontend
- optionally backend API

### Internal Only
Do NOT expose:
- PostgreSQL
- MinIO admin
- internal services

---

# 20. Security Considerations

## Required Security Features

- HTTPS through Cloudflare
- Role-based authorization
- Secure session handling
- File upload validation
- Rate limiting
- Secure password fallback
- Audit logging

---

# 21. Future Features

## Potential Enhancements

### Scheduling
- Automatic horse suggestions
- Smart workload balancing

### Communication
- Internal messaging
- Push notifications

### Reporting
- Financial reports
- Horse workload analytics
- Volunteer statistics

### AI Features
- Smart scheduling recommendations
- Horse workload prediction

### Mobile Support
- Responsive mobile web app
- Possible mobile application

---

# 22. Future Microservice Architecture

Potential future services:

- auth-service
- scheduling-service
- horse-service
- notification-service
- task-service
- file-service
- volunteer-service

Initial recommendation:
Use a modular monolith architecture first.

---

# 23. MVP Development Phases

## Phase 1 — Foundation
- Docker setup
- Database setup
- Backend initialization
- Frontend initialization
- Authentication

---

## Phase 2 — Core Management
- Users
- Roles
- Horses
- Students
- Parents

---

## Phase 3 — Scheduling MVP
- Instructor availability
- Lesson requests
- Approval workflow
- Horse assignment
- Conflict checking

---

## Phase 4 — Calendar
- Calendar views
- Event scheduling
- Horse schedules

---

## Phase 5 — Tasks and Volunteers
- Chore management
- Volunteer tracking
- Partner organizations

---

## Phase 6 — Invoices and Notifications
- Invoice tracking
- Email notifications

---

## Phase 7 — File Uploads
- MinIO integration
- Photo uploads
- File management

---

# 24. Final Recommendation

## Recommended Architecture

### Frontend
- Next.js
- shadcn/ui

### Backend
- Rust
- Axum
- SQLx

### Database
- PostgreSQL

### Storage
- MinIO

### Deployment
- Docker Compose
- Traefik
- Cloudflare Tunnel

---

## Development Recommendation

Start with:
- Modular monolith
- Single PostgreSQL database
- Single backend service

Do NOT start with microservices.

Focus first on:
1. Scheduling
2. Horse assignment
3. Calendar workflows

Then expand to:
- Volunteers
- Tasks
- File storage
- Analytics

---

Related documents:
- Security Plan: ./security-plan.md
- Database Design: ./db-design.md

# End of Document