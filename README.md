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

## Admin login (Supabase Auth)

Admin access uses real Supabase Auth (email/password) instead of the old
client-side PIN. This matters for more than UX: the old PIN lived entirely
in the browser, so anyone who opened dev tools could read your Supabase
anon key and write to the database directly, bypassing the PIN completely.
Real auth lets you close that hole at the database level with Row Level
Security — the PIN alone never could.

**1. Create your admin account(s)**

You are not meant to expose public sign-up for this. Create accounts
yourself:
- Supabase Dashboard → **Authentication → Users → Add user** → set an email
  and password directly (instant, good for internal/admin accounts), or
- **Add user → Send invite email** if you'd rather the person set their own
  password.

**2. Lock down writes with Row Level Security**

This is the step that actually makes admin login meaningful — without it,
your anon key can still write to the database even after you add login,
because by default a fresh Supabase table has no RLS restricting the anon
role at all. Run this in the Supabase SQL editor:

```sql
-- Turn on RLS (do this for both tables)
alter table sections enable row level security;
alter table stations enable row level security;

-- Public (anon key) can still read everything — this keeps "Public View Mode" working
create policy "Public read access" on sections
  for select using (true);
create policy "Public read access" on stations
  for select using (true);

-- Only signed-in users can write
create policy "Authenticated write access" on sections
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update access" on sections
  for update using (auth.role() = 'authenticated');
create policy "Authenticated delete access" on sections
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated write access" on stations
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update access" on stations
  for update using (auth.role() = 'authenticated');
create policy "Authenticated delete access" on stations
  for delete using (auth.role() = 'authenticated');
```

After this, even someone who copies your anon key straight out of the
browser can only read data — every insert/update/delete is rejected by the
database itself unless they have a valid Supabase Auth session, which is
exactly what "Admin Login" now grants.

**3. That's it on the app side** — `useAdmin.js` already handles session
persistence (it survives page refresh) and `AdminAuthModal.jsx` handles the
email/password form. No further config needed beyond your existing
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Setting up direct Google Drive upload (optional)

The Admin "Add/Edit Station" form has an **Upload** button next to each
document's URL field. Click it, pick a PDF, and it uploads straight into
`(your root folder)/(STATION CODE)/filename.pdf` in Drive, sets link sharing
to "anyone with the link can view," and fills in the URL automatically. This
needs two things configured — without them, the button is disabled but
manual URL entry still works exactly as before.

It uses the **`drive.file`** OAuth scope, which only grants access to files
the app itself creates — never your whole Drive. That makes it a
**non-sensitive scope** in Google's classification, so it does **not**
require Google's app verification process or an annual CASA security
assessment, even once you're live for real users.

**1. Create a Google Cloud project & OAuth client**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → create
     (or pick) a project.
   - APIs & Services → Library → enable the **Google Drive API**.
   - APIs & Services → OAuth consent screen → choose **External** (or
     **Internal** if everyone using this app is in your Google Workspace
     org) → add the `.../auth/drive.file` scope → set publishing status to
     **In production** (safe to do since `drive.file` doesn't need
     verification — this just avoids the 7-day test-token expiry).
   - APIs & Services → Credentials → Create Credentials → **OAuth client ID**
     → Application type: **Web application** → add your app's URL(s) (e.g.
     `http://localhost:5173` for dev, your real domain for production) under
     **Authorized JavaScript origins**. Copy the generated Client ID.

**2. Create (or pick) a root Drive folder**
   - In Drive, create a folder to hold all uploaded station documents (e.g.
     "eDMS Station Documents").
   - Open it, copy the folder ID from the URL:
     `drive.google.com/drive/folders/`**`THIS_PART_IS_THE_ID`**.
   - Share that folder with whichever Google account(s) will be logging in
     as admin to upload files (Editor access).

**3. Add both values to `.env`**
   ```
   VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   VITE_GDRIVE_ROOT_FOLDER_ID=...
   ```

The first time an admin clicks Upload, Google will show a one-time consent
popup asking to authorize this app's access to files it creates. After that,
uploads happen silently in the background for that browser session.

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
