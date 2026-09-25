# Railway Section & Station Directory — React

A React (Vite) port of the original single-file vanilla HTML/Supabase app. Same
data model, same features, same Tailwind visual design — just broken into
components with real state management instead of `innerHTML` string-building.

## Sidebar owns section actions now

Since the sidebar already lists every section, the section header that used
to sit at the top of each station table in the center (with its own
collapse toggle, Rename, Delete, and Add Station buttons) has been removed
— it was duplicating what the sidebar already does. Each section table in
the center now shows only a plain, non-interactive label (name + station
count) for context.

All of that header's old admin actions now live directly on each section's
row in the sidebar (visible when signed in as admin): a **+** to add a
station to that section, a **pencil** to rename it, and a **trash icon** to
delete it. Sections are no longer individually collapsible in the center —
navigating via the sidebar (or "All Sections" at the top) already controls
what's shown, so a second collapse mechanism in the center was redundant.
"Expand All" / "Collapse All" in the toolbar now only affect station rows.

## Layout: full-width, GitHub-style

The app no longer sits in a centered box — it now uses the full browser
width with a persistent structure:

- **Top bar** (`TopNav.jsx`) — full-bleed dark header with branding, global
  search, and the admin login button. Sticky at the very top.
- **Toolbar** (`Toolbar.jsx`) — full-bleed strip just below it with sync
  status, stats, and the Refresh / Expand All / Collapse All / Add Section /
  Add Station actions. Sticky just under the top bar.
- **Sidebar** (`Sidebar.jsx`) — a left-hand nav tree (Division → Section),
  replacing the old horizontal division/section pill bars. Each division is
  collapsible; clicking a division or a specific section filters the main
  content the same way the old pills did. On mobile it becomes a slide-in
  drawer (hamburger icon in the top bar toggles it).
- **Main content** — fills the remaining width to the right of the sidebar,
  same `SectionCard`/`StationRow` components as before, just no longer
  width-constrained.

`Header.jsx`, `DivisionTabsBar.jsx`, and `SectionPillsBar.jsx` were removed
— their responsibilities are now split across `TopNav`, `Toolbar`, and
`Sidebar` above.

## Divisions (Division → Section → Station hierarchy)

Sections can now belong to a **Division** (e.g. "JBP Division", "BPL
Division", "Kota Division") — a level above sections, matching how your
office is actually organized.

**If you already have a `sections` table in Supabase, run this migration
first** — without it, saving a section will fail because the `division`
column doesn't exist yet:

```sql
alter table sections add column division text;
```

What this adds to the app:
- A **division filter bar** above the section pills — "All Divisions" plus
  one tab per division in use, each showing how many sections belong to it.
- When "All Divisions" is selected, sections are grouped under a division
  heading so the hierarchy reads clearly; picking a specific division
  narrows the section pills below it to just that division's sections.
- The **Add/Edit Section form** has a Division field with autocomplete
  suggestions (the three presets above, plus any custom division already in
  use) — same free-text-with-suggestions pattern as document categories, so
  you're not locked into exactly three divisions if your office structure
  changes.
- Sections with no division set show up under **"Unassigned"** rather than
  being hidden or erroring — existing sections created before this feature
  will land there until you edit them to set a division.

## Fixed: document dates changing on unrelated edits

Previously, saving the Edit Station form stamped **every** document's
"Updated" date with today's date, even if you only touched one document (or
just fixed a typo in the station name). Now a document's `last_updated`
date only changes when that specific document's **version or URL** actually
changed — editing something else leaves its original date untouched.

## Document categories

Each document now has a `category` field (e.g. "Plans" for SIP/ESP/RSP,
"Sanctions" for sanction letters), in addition to its existing label,
version, and history:

- **Expanded station rows** show a tab bar above the document grid — "All",
  plus one tab per category actually used on that station, each with a
  count. Tabs only appear when a station has more than one category; a
  station with everything in one bucket just shows the grid.
- **The Add/Edit Station form** has a Category field next to each
  document's name and version, with autocomplete suggestions drawn from
  the built-in presets (`Plans`, `Sanctions`, `Estimates`, `Inspection
  Reports`, `Correspondence`, `Other`) plus any custom category already
  used elsewhere in the directory — so categories stay consistent across
  stations without being a fixed, hardcoded list.
- Existing documents saved before this feature default to category
  `"General"` (handled in `normalizeDoc`) — no data migration needed.

## Row collapse behavior

Station rows are **collapsed by default**, showing just name, code, and a
document count. Clicking a row expands it into a grid of document cards
(type, version, last-updated, open + history actions) — this replaces the
old inline pill row with a "+N More" overflow button and its modal, since
the row itself now shows everything on demand. `Expand All` / `Collapse All`
in the header now toggle both section collapse *and* every station row's
open state together.

## What changed vs. the vanilla version

- **State**: `sectionsData`, `isAdmin`, modal visibility, search, and section
  collapse are now React state (`useState`) instead of globals mutated by
  `renderSections()`. The UI re-renders declaratively instead of being
  rebuilt from scratch on every change.
- **Data layer**: all Supabase calls live in `src/hooks/useRailwayData.js`
  (fetch, save/delete section, save/delete/move station, publish revision).
  Components never touch Supabase directly.
- **Components**: one file per UI piece (`TopNav`, `Toolbar`, `Sidebar`,
  `SectionCard`, `StationRow`, `DocBadge`, `Toast`, and one file per modal
  under `components/modals/`).
- **Credentials**: Supabase URL/key now come from environment variables
  (`.env`) instead of being hardcoded in the script — see below.
- **Admin auth**: uses real Supabase Auth (email/password) instead of a
  client-side PIN — see the "Admin login" section below, which also covers
  the Row Level Security policies needed to make it an actual permission
  boundary rather than just a nicer-looking gate.

## Project structure

```
src/
  App.jsx                     — top-level state & layout
  supabaseClient.js           — Supabase client (env-driven)
  hooks/
    useRailwayData.js         — fetch + all CRUD operations
    useAdmin.js                — admin login/logout, persisted to localStorage
  components/
    TopNav.jsx
    Toolbar.jsx
    Sidebar.jsx
    SectionCard.jsx
    StationRow.jsx
    DocBadge.jsx
    Toast.jsx
    modals/
      AdminAuthModal.jsx
      ConfirmModal.jsx
      SectionModal.jsx
      StationModal.jsx
      VersionHistoryModal.jsx
  utils/
    normalize.js               — normalizeDoc(), getBadgeStyle()
    googleDrive.js              — direct-to-Drive upload via GIS + drive.file scope
```

## Admin login and database authorization

The application now separates **authentication** from **authorization**. A valid
Supabase login is not enough to become an administrator. The database assigns
each user a role in `public.user_roles` (`admin`, `editor`, or `viewer`), and
Supabase Row Level Security (RLS) enforces those roles. The React UI is only a
convenience layer; an attacker who bypasses the UI still cannot write to the
database without an appropriate role.

Run `supabase-security-migration.sql` in the Supabase SQL Editor. Then create
your administrator in **Authentication → Users** and assign the role with the
SQL statement at the bottom of that migration. There is deliberately no public
client policy allowing users to create or change their own roles.

The default security model is:

- `viewer`: read only
- `editor`: insert/update directory records
- `admin`: insert/update/delete directory records and read the audit log
- directory rows remain publicly readable to preserve the existing public-view
  mode; change the SELECT policies if the directory itself is confidential

Every section/station INSERT, UPDATE and DELETE is protected by RLS. Changes
are also written automatically to `audit_log`.

### Google Drive security

The browser upload uses Google's narrow `drive.file` scope, but uploaded files
are **not** made public by the application. The old `anyone` link-sharing step
has been removed. Keep the Drive root folder private and grant access only to
the intended administrator Google account(s).

For highly sensitive documents, the recommended next step is moving the Drive
upload operation to a trusted Supabase Edge Function so that the browser never
handles the long-lived credentials of a server-side Drive integration. Never
place a Google client secret or service-account private key in a `VITE_*`
environment variable.

The upload UI also enforces a 25 MB browser-side limit and allows PDF, PNG and
JPEG files. The application accepts only HTTP/HTTPS document URLs and rejects
dangerous schemes such as `javascript:`. For high-security deployments, add
server-side file validation and malware scanning.

### Production security checklist

See `security-checklist.md` for the deployment checklist, including MFA,
HTTPS, security headers, rate limiting, backups, and testing the RLS policies
with both admin and non-admin accounts.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your real Supabase project URL
   and anon key:
   ```bash
   cp .env.example .env
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

Your `sections` and `stations` tables should match the shape the original
app expected — `stations.docs` is a JSON column holding an array of
`{ id, label, url, version, last_updated, history }` objects, and
`stations.display_order` controls row ordering within a section.

## Notes on going further

- **Reordering sections**: only station reordering was implemented in the
  original app (`moveStation`); section order still comes from `created_at`.
  If you want drag-to-reorder for sections too, add a `display_order` column
  on `sections` and mirror the `moveStation` pattern.
- **Optimistic UI**: every save/delete currently re-fetches the whole dataset
  from Supabase afterward (matching the original's behavior). For a snappier
  feel at scale, consider updating local state optimistically and rolling
  back on error instead.
- **Realtime**: since you're already on Supabase, `supabase.channel(...)` can
  push live updates to every open tab instead of relying on manual "Refresh".


## Admin User Management

The application includes an Admin-only **User Management** screen. It supports:

- Creating Viewer and Editor users
- Changing a user's role between Viewer, Editor and Admin
- Enabling/disabling users
- Viewing account and last-sign-in information
- Preventing an administrator from disabling their own account
- Preventing the last administrator from being demoted

### Deploy the Edge Function

The browser must never receive the Supabase service-role key. User creation, status changes and role changes are therefore performed by the Supabase Edge Function at:

```text
supabase/functions/user-management/index.ts
```

From the Supabase CLI, link the project and deploy:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy user-management
supabase secrets set APP_ORIGIN=https://YOUR-PRODUCTION-DOMAIN.example
```

For local development, omit `APP_ORIGIN` or set it to the local application origin. Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function environment.

After deployment, sign in as the existing administrator and use **Users** in the top navigation.

### Important password note

The current Admin User Management screen creates accounts with a temporary password chosen by the administrator. Give that temporary password to the user through a secure channel and have the user change it after first sign-in. A future improvement can switch this to Supabase email invitations if SMTP is configured.
