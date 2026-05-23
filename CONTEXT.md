# Horse Farm Management

This context describes the operational language for managing a horse farm's staff scheduling, rider lessons, horse usage, and lesson balances.

## Language

**Admin**:
The staff user accountable for the farm's operational records and scheduling authority.
_Avoid_: Owner account, manager account

**Instructor**:
A staff user who teaches lessons and manages their own assigned schedule.
_Avoid_: Trainer when referring to a lesson teacher

**Student**:
A rider whose lessons, horse assignments, history, and lesson balance are tracked.
_Avoid_: Customer, client, account

**Rider**:
The role a student has when mounted or assigned to ride in a lesson.
_Avoid_: Student when referring specifically to mounted activity

**Guardian**:
An adult contact responsible for a minor student.
_Avoid_: Parent when the adult may not be a parent

**Emergency Contact**:
A person staff may contact if a student has an urgent safety or health issue.
_Avoid_: Guardian when the person is only an emergency contact

**Lesson**:
A scheduled instructional activity with a time range, status, instructor, and one or more participants.
_Avoid_: Appointment, booking, session

**Lesson Type**:
A named category of lesson that supplies default scheduling and lesson credit values.
_Avoid_: Category when referring to lesson defaults

**Activity Intensity**:
The riding or groundwork demand level of a scheduled horse activity used for suitability and restriction checks.
_Avoid_: Discipline marker

**Lesson Participant**:
A student attached to a lesson.
_Avoid_: Attendee, booking

**Participation Type**:
The role a lesson participant has in a lesson, either riding or groundwork for the MVP.
_Avoid_: Participant status

**Horse Assignment**:
The pairing of a lesson participant with the horse they ride for that lesson.
_Avoid_: Horse booking

**Riding Level**:
A manually assigned description of a student's riding capability, owned by the main instructor for scheduling purposes.
_Avoid_: Skill score, rank

**Riding Level Opinion**:
An instructor's non-authoritative note about whether a student's riding level should change.
_Avoid_: Riding level when the value is not authoritative

**Horse Suitability**:
The manually managed rule describing which riding levels or specific students may ride a horse.
_Avoid_: Compatibility, matching

**Horse Status**:
The current operational state of a horse that influences whether it can be assigned to riding work.
_Avoid_: Availability when referring to the horse's broad state

**Horse Ownership**:
Admin-managed metadata describing whether a horse is farm-owned, privately owned, leased, or unknown.
_Avoid_: Owner account

**Limited Use**:
A horse status meaning the horse may be assigned to riding work only with staff acknowledgement.
_Avoid_: Retired when the horse can still be assigned

**Warning Override**:
An explicit staff acknowledgement that scheduling should proceed despite a non-blocking rule warning.
_Avoid_: Exception, bypass

**Scheduling Constraint**:
A rule or dated condition that blocks or warns scheduling.
_Avoid_: Validation when referring to farm scheduling rules

**Same-Day Student Activity Warning**:
A scheduling warning that a student already has another lesson or practice ride on the same day.
_Avoid_: Same-day lesson warning

**Operational Review**:
A staff-facing list of already-effective changes or conditions that may require admin attention.
_Avoid_: Approval queue, pending review

**Lesson Package**:
A purchased or granted set of lessons for a specific student.
_Avoid_: Subscription, invoice, account credit

**Lesson Balance**:
The current count of available lessons for a student after package additions and lesson deductions.
_Avoid_: Credit balance, invoice balance

**Lesson Ledger**:
The append-only history of lesson credit additions, deductions, and corrections for a student.
_Avoid_: Balance field, transaction log

**Lesson Credit**:
The unit deducted from a student's lesson balance for a lesson participant.
_Avoid_: Token, point

**Manual Ledger Adjustment**:
An admin-created lesson ledger entry that corrects or changes a student's lesson balance outside normal package purchase or lesson outcome flows.
_Avoid_: Direct balance edit

**No-Show**:
A lesson participant outcome where the student did not attend and staff decide whether the lesson balance is deducted.
_Avoid_: Cancellation

**Cancelled Lesson**:
A lesson that will not happen and does not deduct from a student's lesson balance.
_Avoid_: No-show, late cancellation

**Rescheduled Lesson**:
A replacement lesson linked to an earlier lesson that did not occur at its original time.
_Avoid_: Edited lesson, moved lesson

**Practice Ride**:
A scheduled non-lesson horse use by a student that reserves a horse but does not deduct lesson credits by default.
_Avoid_: Self lesson, free lesson

**Location**:
An admin-managed place where a lesson or practice ride may occur.
_Avoid_: Arena when the place may be broader than an arena

**Horse Availability Constraint**:
A dated time range that blocks or warns horse assignment.
_Avoid_: Time off, blackout, unavailability period

**Horse Concern**:
A staff-reported observation about a horse that may require admin attention.
_Avoid_: Issue flag, health ticket

**Instructor Availability Constraint**:
A dated time range that describes when an instructor is preferred or not preferred for scheduling.
_Avoid_: Shift, time off, availability block

## Relationships

- A **Lesson** has one or more **Lesson Participants**.
- A **Lesson** has exactly one **Lesson Type**.
- A **Lesson Type** supplies a default **Activity Intensity**.
- A **Lesson Participant** has exactly one **Participation Type**.
- A **Lesson Participant** may have one **Horse Assignment** when the student is a **Rider**.
- **Horse Suitability** may be based on **Riding Level** or student-specific approval.
- **Horse Status** and **Horse Suitability** both influence whether a **Horse Assignment** is allowed.
- **Horse Ownership** does not create a login account or scheduling rule by itself.
- A **Scheduling Constraint** may create a hard block or a warning that requires a **Warning Override**.
- A **Same-Day Student Activity Warning** can be created by either a **Lesson** or a **Practice Ride**.
- A **Student** may have one or more **Guardians**.
- A **Student** has one authoritative **Riding Level** and may have many **Riding Level Opinions**.
- A **Student** has at least one **Emergency Contact**.
- A **Student** owns their **Lesson Packages** and **Lesson Balance**.
- A **Lesson Balance** is calculated from the **Lesson Ledger**.
- A **Lesson Participant** may deduct one or more **Lesson Credits** from a **Student's** **Lesson Balance**.
- A **Manual Ledger Adjustment** changes the **Lesson Ledger** without editing prior ledger entries.
- A **No-Show** belongs to a **Lesson Participant**.
- A **Cancelled Lesson** does not deduct from a **Student's** **Lesson Balance**.
- A **Rescheduled Lesson** is linked to the earlier **Lesson** it replaces.
- A **Practice Ride** reserves a horse without creating a **Lesson Participant**.
- A **Practice Ride** has an **Activity Intensity**.
- A **Lesson** or **Practice Ride** may have one **Location**.
- A **Horse Availability Constraint** belongs to exactly one horse.
- A **Horse Concern** does not change horse availability by itself.
- An **Instructor Availability Constraint** belongs to exactly one instructor.

## Example dialogue

> **Dev:** "If a **Student** has another **Lesson** on the same day, should we block the schedule?"
> **Domain expert:** "No, create a **Warning Override** when staff approve it, but still block overlapping lessons."

## Flagged ambiguities

- "Parent" may exclude other responsible adults; resolved canonical term: **Guardian**.
- "Booking" can mean a lesson request, a confirmed lesson, or a horse assignment; use **Lesson**, **Lesson Participant**, or **Horse Assignment** explicitly.
- "Cancellation" and **No-Show** are different outcomes; a **No-Show** may still deduct from the **Lesson Balance**.
- "Review" does not imply approval; use **Operational Review** only for already-effective changes that may need admin attention.

## Staff UI

  The staff-facing UI uses a fixed left sidebar and a right-side working area.

  **Sidebar**:
  A fixed navigation panel that groups the app by domain subject.
  _Avoid_: Top navigation when the screen is intended for dense operational work.

  **Subject**:
  A top-level sidebar group such as **Schedule**, **Students**, **Horses**, **Lessons**, **Review**, or
  **Admin**.
  _Avoid_: Task-first labels when the work is primarily record-oriented.

  **Subitem**:
  A nested item revealed under an expanded subject in the sidebar.
  _Avoid_: Deep menu nesting beyond one level.

  **Attention Count**:
  A compact sidebar count showing how many records in a subject need staff attention.
  _Avoid_: A raw total when the operational question is what needs work now.

  **Search and Filter Row**:
  The sticky control row above a list that contains immediate search and chips for the current subject.
  _Avoid_: Hiding common filters in a drawer for primary workflows.

  **List Row**:
  A selectable record row that shows the name plus compact metadata and state.
  _Avoid_: Overly tall preview cards that repeat the full record before selection.

  **Summary Strip**:
  The top header for a selected record. It shows the record type, name, key state, and the most common actions.
  _Avoid_: Turning the header into a full toolbar.

  **Compact Sticky Header**:
  The condensed form of the summary strip that stays visible while scrolling the record. It keeps the avatar,
  name, and the single most important status signal.
  _Avoid_: Repeating the full badge set in the compact state.

  **Detail Stack**:
  The vertical set of cards below the summary strip that shows the selected record's sections in a fixed order.
  _Avoid_: Splitting the record into multiple competing columns.

  **Section Card**:
  A self-contained card for one record section such as **Status**, **Contacts**, **Guardians**, **Riding
  level**, **Notes**, or **Audit trail**.
  _Avoid_: Plain dividers when the page needs clearer hierarchy.

  **Inline Section Edit**:
  A section-level edit mode that replaces the section's view state in place and uses explicit **Save** and
  **Cancel** actions.
  _Avoid_: Switching the whole record into edit mode at once.

  **Empty State**:
  A section state that explains the absence of data and offers a clear primary action.
  _Avoid_: Hiding empty sections entirely.

  **Record Anchor**:
  An in-page jump target for a section inside the selected record.
  _Avoid_: Putting every section in the URL.

  **Load More**:
  A visible control at the bottom of a list that fetches additional rows.
  _Avoid_: Endless automatic loading when staff need a clear breakpoint.

  **Calendar View**:
  The default scheduling view. It opens to today, uses 30-minute slots, and is the first schedule mode staff
  see.
  _Avoid_: Opening the schedule on a list by default.

  **Week View**:
  The secondary schedule view that shows the current calendar week starting on Monday.
  _Avoid_: A rolling seven-day window.

  ### Staff UI relationships

  - The left sidebar stays fixed while the right-side content scrolls independently.
  - Only one top-level sidebar subject is open at a time.
  - Selecting another subject collapses the previous one automatically.
  - The sidebar resets to **Schedule** on reload for every role.
  - Unauthorized sidebar items are hidden completely.
  - The right side keeps one selected record visible at a time.
  - The list appears before the detail stack on the same page.
  - The record URL updates to a path such as `/students/mia-grant`.
  - The record page keeps a single URL for the record itself while allowing in-page section jumps.
  - The sticky summary strip is compact while scrolling and shows only the most important status signal plus the
  most common actions.
  - The list search and filter row stays sticky above the list.
  - Search matches names plus key metadata and updates immediately as the user types.
  - Filter chips are single-select, show counts, and stay compact.
  - The schedule view defaults to calendar, with a day-first workflow and a switch to week view.