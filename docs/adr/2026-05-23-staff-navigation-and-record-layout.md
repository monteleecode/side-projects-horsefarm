# Staff Navigation and Record Layout

  Status: Accepted

  ## Context

  The staff app needs to support dense operational work around students, horses, lessons, review queues, and
  scheduling. The layout must keep navigation obvious, records readable, and editing constrained to the parts of
  the record that a role can actually change.

  The design session also established a clear set of terms for the staff UI so the documentation and
  implementation can stay aligned:

  - `Schedule` is the shared default subject for every role.
  - `Students`, `Horses`, `Lessons`, `Review`, and `Admin` are the top-level domain subjects.
  - Staff need one level of nesting only.
  - The selected record should be readable as a single stacked detail view rather than a split master-detail
  workspace.

  ## Decision

  ### Navigation

  - Use a fixed left sidebar.
  - Group navigation by domain subject.
  - Keep one nested level under each top-level subject.
  - Allow only one top-level subject to stay open at a time.
  - Collapse the currently open subject automatically when the user selects another one.
  - Reset the sidebar to `Schedule` on reload for every role.
  - Hide unauthorized subjects completely.
  - Show compact counts on the top-level subjects only.
  - Make those counts represent records needing attention rather than raw totals.
  - Use icon plus text in the sidebar, with minimal outline icons.
  - On small screens, collapse the sidebar into a left drawer that keeps the same nested structure.

  ### Record Layout

  - Show one primary record at a time.
  - Render the selected record details below the list on the same page.
  - Start the right side with a summary strip.
  - Make the summary strip sticky and compact when scrolling.
  - Keep the avatar/photo in the compact header, but shrink it.
  - Reduce the compact header to the single most important status badge and the most common actions.
  - Keep the record type label in the expanded header, but omit it from the compact header.
  - Keep quick actions icon-plus-text and right-aligned in the summary strip.
  - Limit the summary strip to the three most common safe actions.
  - Use in-page section anchors for long records, but keep the record URL at the record level.

  ### List Behavior

  - Put search and filters above the list.
  - Keep the search and filter row sticky.
  - Search immediately as the user types.
  - Search across names plus key metadata.
  - Use single-select filter chips with counts.
  - Sort the list by importance, with `needs review` always first.
  - Keep list rows compact and two-line.
  - Show avatars/photos in the list rows when available.
  - Use a visible `Load more` button at the bottom of the list.
  - Keep the selected row highlight distinct from the sidebar active state.
  - Move focus to the selected record details after selection, but keep the previous record visible until the
  new one is ready.

  ### Detail Stack

  - Use full-width section cards in a single column.
  - Keep a fixed canonical section order.
  - Use subtle background tint to make the important sections slightly more prominent.
  - Keep section headers text-only.
  - Show a compact status summary in section headers only where it adds value.
  - Place edit controls in the right side of the section header.
  - Keep edit controls visible for authorized users.
  - Edit each section in place with explicit `Save` and `Cancel`.
  - Keep other sections unchanged while one section enters edit mode.
  - Show empty sections as empty states with a short explanation and a primary action.
  - Keep the audit trail inline as the bottom section, with admin-only visibility.
  - Keep notes visible to instructors in reduced form.

  ### Schedule

  - Default Schedule to calendar view.
  - Keep a toggle to list view.
  - Open the calendar to today.
  - Allow a switch to week view.
  - Use the current calendar week, starting on Monday, for week view.
  - Use 30-minute time slots.
  - Render warnings inline on event cards.

  ### Responsiveness and Width

  - Keep the sidebar fixed width.
  - Let the right content scroll independently.
  - Keep the content region aligned to the left of its available space with a readable maximum width.
  - Use a light background with white cards and muted accents.
  - Keep section expand/collapse motion subtle.

  ## Consequences

  - The app reads as a focused staff tool instead of a general-purpose dashboard.
  - Navigation stays stable while users inspect long records.
  - Editing is scoped to the section that changed, which keeps permissions and auditing easier to reason about.
  - The schedule and record screens share the same visual language: calm, dense, and operational.