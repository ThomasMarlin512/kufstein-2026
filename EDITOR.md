# Editable Kufstein text

`text-editor.js` applies plain-text overrides from `trip_text_content` to explicit
`data-edit-key` targets. Existing HTML is the fallback until an override is saved.
Keep existing keys stable when moving or inserting paragraphs; never renumber them.
Activity keys are shared between index.html and abstimmung.html/app.js.

A small pencil at the top right of each text field is visible only to the existing
group administrator after enabling Bearbeiten beside the settings gear in the upper navigation. Start in reading mode with
no pencils or editor padding. Fertig returns to reading mode; saved
text overrides remain visible in both modes. Keep this mode local to the page,
reset it when permission is lost, and preserve it across activity rerenders.
Its touch target is 44 × 44 pixels. Server-side
`group_private.is_admin()` is authoritative; never authorize by a display name.
The public RPC checks revisions to reject stale edits. Direct table mutations
are not granted to browser roles. Published content can be read by all visitors.

The editor accepts plain text, **bold**, line breaks and [label](https://url)
links or local #anchors. Render with DOM text nodes, never user-provided HTML.
Null restores the deployed original; an empty string clears the text.

Auth, votes, member management and shared event templates stay independent.
For UI checks: save/cancel, failed-save draft retention, reset, unsafe link/HTML
handling, dynamic card rerendering. Test admin/non-admin/anon permissions and
optimistic revision conflicts inside a rolled-back database transaction.

Activity removal: the administrator returned by get_group_member_directory can
remove a built-in Kufstein activity from the voting cards. trip_activity_removals
stores the removal, enforced by admin-only INSERT RLS; removed cards cannot
receive votes. Keep the static itinerary, reservations and editable text keys
intact, and state that clearly before removal. This legacy trip has no
member-created activity records; shared trips use group_program_items and allow
creator/admin deletion with cascading votes and links. Test only rolled-back
fixtures, never remove real activities for verification.

Use the in-page activity-delete-dialog for removal confirmation, not window.confirm.
Keep failures visible in that dialog and success feedback beside the activity
cards. Use two wide columns on desktop and one on phones via trip-navigation.css.
Do not use fixed subgrid row spans for activity content: admin controls change
the number of children and would overlap or be clipped.

Show the authorized activity-delete button only while Bearbeiten is active.
Fertig hides it again. Preserve the confirmation dialog and admin-only policy.

Structured activity editor (prepared; deployment pending): activity-editor.js adds
title, link, description, trip-day selection and Von/Bis with optional next-day
ending. It uses trip_activity_details and save_kufstein_activity, with admin-only
server checks and revision conflicts. Keep legacy activity IDs and votes; never
silently update the fixed itinerary or reservations. Render new activity text
escaped. Normal view has no activity-edit or delete controls. In edit mode a
single Aktivität bearbeiten control owns time and description; old text pencils
remain for costs and other text. Preserve drafts on validation/save errors.

Deployment depends on the shared repository migration
20261011212043_activity_fields_and_trip_day_selection.sql. Automatic approval review
blocked its production application; explicit user approval is still required.
Do not deploy this UI until that migration and its rolled-back SQL fixtures pass.
