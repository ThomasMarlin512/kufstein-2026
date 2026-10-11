# Editable Kufstein text

`text-editor.js` applies plain-text overrides from `trip_text_content` to explicit
`data-edit-key` targets. Existing HTML is the fallback until an override is saved.
Keep existing keys stable when moving or inserting paragraphs; never renumber them.
Activity keys are shared between index.html and abstimmung.html/app.js.

The toolbar is visible only to the existing group administrator. Server-side
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
