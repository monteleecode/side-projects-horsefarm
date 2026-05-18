# Database Design

## 1. Overview
PostgreSQL schema for horse farm management system.

## 2. Entity Relationship Overview
Main domains:
- users / roles
- horses
- students / parents
- lessons
- scheduling
- invoices
- chores/tasks
- volunteers
- files/uploads
- events

## 3. Core Tables

### users
- id
- email
- display_name
- google_id
- phone
- status
- created_at
- updated_at

### roles
- id
- name

### user_roles
- user_id
- role_id

### horses
- id
- name
- owner_id
- breed
- birth_date
- arrival_date
- status
- notes

### lessons
- id
- lesson_type
- instructor_id
- start_time
- end_time
- status
- created_by

### lesson_requests
- id
- student_id
- instructor_id
- requested_start_time
- requested_end_time
- status
- note

### horse_assignments
- id
- lesson_id
- horse_id
- assigned_by

### invoices
- id
- student_id
- parent_id
- amount
- status
- due_date

Related documents:
- Product Plan: ./product-plan.md
- Security Plan: ./security-plan.md