# Tha. Veymandoo Police Station — Vehicles & Vessels Dhaftharu

A secure, mobile-responsive registry of vehicles and vessels for Tha. Veymandoo Police Station.

**Architecture: static frontend + Supabase as the backend.**

- **Frontend**: React + TypeScript + Vite + Tailwind CSS, built as a static site and deployed to
  **GitHub Pages**.
- **Backend**: There is no separate server. **Supabase Postgres functions (RPC) are the backend.**
  The browser calls these functions directly using the public `anon` key. Every table has Row
  Level Security enabled with **no policies**, so that key alone grants zero direct table access —
  the only way in is through the RPC functions below, each of which validates a session token and
  the caller's role/permissions before touching any data.
- **Auth**: custom (service number + password, bcrypt-hashed), not Supabase Auth. `login()` returns
  a session token stored in the browser and passed to every subsequent call.
- **File storage**: Supabase Storage (a public `uploads` bucket) for vehicle/vessel photos,
  profile pictures, and documents.

Project: **Veymandoo Police Vehicles and Vessels Dhaftharu** — `https://ntjpcyojyzekicimfpdk.supabase.co`

---

## 1. How the security model works (read this first)

Because the frontend is static and public, there is no server to hide secrets or logic behind.
Instead:

- **RLS deny-all** on every table (`users`, `vehicles`, `vessels`, `vehicle_categories`,
  `vessel_categories`, `documents`, `audit_log`, `sessions`, `settings`). No `anon` or
  `authenticated` policies exist, so `SELECT`/`INSERT`/`UPDATE`/`DELETE` directly against any table
  is refused outright.
- **All real work happens in `SECURITY DEFINER` Postgres functions** (e.g. `login`, `list_vehicles`,
  `create_vehicle`, `delete_vessel`, `list_users`, ...). These run with elevated privilege
  internally but only do what their code allows — each one calls `check_session(p_token)` first
  (raises an error if the token is missing/expired/inactive), and write functions additionally call
  `require_add_permission`, `require_edit_permission`, or `require_admin` before touching a row.
- **Sessions live in Postgres**, in a `sessions` table (`token uuid`, `user_id`, `expires_at`).
  `login()` creates a row and returns the token; the frontend stores it in `localStorage` and sends
  it as `p_token` on every call; `logout()` deletes the row.
- **Passwords** are bcrypt-hashed via Postgres's `pgcrypto` extension (`crypt()`/`gen_salt('bf', 12)`)
  — the same algorithm as the original Node backend used, just executed in the database instead.

**Tradeoffs versus the earlier Express-backed version, to be transparent about:**
- The session token sits in `localStorage`, not an httpOnly cookie, so it's readable by any script
  running on the page (i.e. less resilient to a hypothetical XSS bug than before).
- File uploads go straight from the browser to Supabase Storage. The `uploads` bucket allows any
  request bearing the (public) anon key to `INSERT` new objects — there's no way to gate that on
  "is this a logged-in staff member" without a server in between. Reads are public too, matching
  `<img src>` usage across the app. For an internal single-station tool this is a reasonable
  tradeoff; if that ever changes, moving uploads back behind a small server (or a Supabase Edge
  Function) would close this gap.

---

## 2. Demo Staff Accounts

| Role | Service Number | Password |
|---|---|---|
| Administrator | `V1001` | `Admin@123` |
| Staff (can add + edit) | `V1002` | `Staff@123` |

Change these (or create your own and deactivate these) from **Settings** once you're set up.

---

## 3. Local Development

```bash
cp client/.env.example client/.env.local   # already filled in with this project's URL/anon key
npm run install:all
npm run dev
```

Open `http://localhost:5173` and sign in with a demo account above.

`client/.env.example` contains:
```
VITE_SUPABASE_URL=https://ntjpcyojyzekicimfpdk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_BH_jlzOsTQ68HI3oS61FXQ_YZZmW_zk
```
Both are safe to expose publicly (that's the point of the anon/publishable key) — they're already
baked into the repo for convenience.

---

## 4. Deploying to GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys automatically on
every push to `main`. One-time setup:

1. In your repo: **Settings → Pages → Build and deployment → Source** → select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `VITE_SUPABASE_URL` = `https://ntjpcyojyzekicimfpdk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_BH_jlzOsTQ68HI3oS61FXQ_YZZmW_zk`
3. Push to `main`. Check the **Actions** tab for build progress. Once it succeeds, the app is live
   at `https://<your-username>.github.io/<repo-name>/`.

The app uses `HashRouter` (URLs look like `.../#/dashboard`) specifically because GitHub Pages
can't do server-side rewrites for client-side routing — this avoids needing a `404.html` trick.

**If your repo name isn't `chandhaa`**, update the `base` path in `client/vite.config.ts`:
```ts
base: command === "build" ? "/your-repo-name/" : "/",
```

---

## 5. Roles & Permissions

- **Administrator** — full access: add/edit/delete vehicles and vessels, manage categories, manage
  staff accounts and permissions, reset passwords, view the audit log.
- **Staff** — can always view, search and filter. Add/edit is granted per-account by an admin in
  **Settings**. Delete is admin-only.

---

## 6. Mobile Responsiveness & PWA

- Sidebar collapses to a slide-in drawer below `lg`.
- Vehicle/Vessel list and dashboard tables switch to a stacked card layout below `sm`; the same
  data, touch-friendly.
- Settings' user table does the same.
- Forms are single-column on mobile, two-column from `sm` up.
- **Installable as a PWA**: has a web app manifest, generated icons (including maskable variants
  for Android's adaptive icon shape), and a service worker that precaches the app shell (JS/CSS/
  HTML/icons) for fast repeat loads. On Android/desktop Chrome, a small "Install Dhaftharu" prompt
  appears automatically when the browser judges it installable; on iOS Safari, use Share → Add to
  Home Screen (Apple doesn't expose the `beforeinstallprompt` event, so there's no in-app button
  there — this is an iOS platform limitation, not something the app can work around).
- **Important**: Supabase requests are explicitly excluded from the service worker's cache
  (`NetworkOnly` for `*.supabase.co`) — this app always needs live data, and a stale cached vehicle
  or vessel record would be actively wrong in a police registry. Only static app files are
  precached; the app itself won't function meaningfully offline (you'll see the shell, not data),
  which is the correct tradeoff here.

---

## 7. Database Objects Reference

**Tables**: `users`, `vehicle_categories`, `vessel_categories`, `vehicles`, `vessels`, `documents`,
`audit_log`, `sessions`, `settings` — all RLS-enabled, no policies.

**RPC functions** (all `SECURITY DEFINER`, all take a `p_token` except `login`):
- Auth: `login`, `logout`, `get_me`, `get_profile`, `change_password`, `update_profile_picture`
- Vehicles: `get_vehicle_dashboard`, `get_vehicles_expiring`, `list_vehicles`, `get_vehicle`,
  `create_vehicle`, `update_vehicle`, `delete_vehicle`
- Vessels: same set, `*_vessel*`
- Categories: `list_vehicle_categories`, `create_vehicle_category`, `delete_vehicle_category`,
  and vessel equivalents
- Admin: `list_users`, `create_user`, `admin_reset_password`, `update_user_permissions`
- Audit: `list_audit_log`

**Storage**: public bucket `uploads`, with `anon` allowed to `INSERT` and `SELECT` only (no
update/delete) — see §1 for the reasoning.

To inspect or modify any of this, use the Supabase dashboard's SQL Editor for the
"Veymandoo Police Vehicles and Vessels Dhaftharu" project, or ask for changes here and they can be
applied as a new migration.

---

## 8. Project Structure

```
veymandoo-dhaftharu/
├── .github/workflows/deploy.yml   # builds + deploys to GitHub Pages on push to main
├── client/
│   └── src/
│       ├── api/
│       │   ├── supabaseClient.ts  # Supabase client (anon key)
│       │   └── rpc.ts             # every RPC call, session token handling, file uploads
│       ├── pages/
│       │   ├── vehicles/          # Vehicle dashboard, list, form, details
│       │   └── vessels/           # Vessel dashboard, list, form, details
│       ├── layouts/                # AppLayout (sidebar + header)
│       ├── components/             # StatusBadge, StatCard, ConfirmDialog, Toast, ProtectedRoute…
│       ├── context/                 # AuthContext
│       └── types/
```
