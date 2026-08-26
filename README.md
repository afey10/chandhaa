# Tha. Veymandoo Police Station — Vehicles & Vessels Dhaftharu

A secure, internal web application for Tha. Veymandoo Police Station to maintain a digital registry
of registered **vehicles** and **vessels**, including owner details, category management, expiry
tracking (annual fee, insurance, roadworthiness), role-based staff access, and a full audit log.

The database lives in your **Supabase** project:

- Organization: **Veymandoo Police**
- Project: **Veymandoo Police Vehicles and Vessels Dhaftharu**
- Project URL: `https://ntjpcyojyzekicimfpdk.supabase.co`

---

## 1. Technology Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend   | Node.js + Express + TypeScript |
| Database  | **Supabase (Postgres)** — accessed via `@supabase/supabase-js` |
| Auth      | JWT stored in an httpOnly cookie + bcrypt password hashing (staff accounts are stored in the `users` table — this is separate from Supabase Auth) |
| Uploads   | `multer`, with file-type/size validation, stored on the server's disk |

Every form submission on the site — adding a vehicle, adding a vessel, creating a category, creating
a staff account, changing a password, etc. — is written straight to this Supabase project through the
Express API. Nothing is stored locally; the Supabase database is the single source of truth.

---

## 2. What's already set up in Supabase

The following was created for you directly in the **Veymandoo Police Vehicles and Vessels Dhaftharu**
project:

- Tables: `users`, `vehicle_categories`, `vessel_categories`, `vehicles`, `vessels`, `documents`,
  `audit_log`, `settings` — with foreign keys, unique constraints (e.g. registration numbers), and
  indexes on the columns used for search/sort.
- **Row Level Security (RLS) is enabled on every table with no policies attached.** This means the
  public `anon` key has **zero** access to the data. Only requests made with the project's
  `service_role` secret key (used exclusively by our backend, never the browser) can read or write.
  This is the secure default for an app like this, where the browser only ever talks to our own
  Express API — never directly to Supabase.
- Seed data: the 7 default vehicle categories, the 7 default vessel categories, and two demo staff
  accounts (see §5).

You can inspect all of this any time in the Supabase dashboard for that project (Table Editor,
Authentication is unused, and SQL Editor for the migration history).

---

## 3. Requirements

- Node.js 18 or later
- npm 9 or later
- Your Supabase project's **service_role** secret key (see §4 — this one manual step is required
  because Supabase never exposes that key through the API for security reasons)

---

## 4. One manual step: get your service_role key

1. Open the [Supabase dashboard](https://supabase.com/dashboard), go to the
   **Veymandoo Police Vehicles and Vessels Dhaftharu** project.
2. Go to **Project Settings → API**.
3. Under **Project API keys**, copy the **`service_role`** secret (not `anon`).
4. Copy the env file and paste it in:

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` and set:

```
SUPABASE_URL=https://ntjpcyojyzekicimfpdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste the service_role secret here>
```

**Never commit this key or send it to the browser.** It bypasses Row Level Security by design, so it
must stay only in `server/.env` on the machine running the backend.

---

## 5. Demo Staff Accounts

Two accounts already exist in the `users` table so you can sign in immediately:

| Role | Service Number | Password |
|---|---|---|
| Administrator | `V1001` | `Admin@123` |
| Staff (can add + edit) | `V1002` | `Staff@123` |

Change these passwords (or deactivate/delete the accounts) from **Settings** once you've created
real accounts for your station's staff — see §11.

---

## 6. Installation

From the project root:

```bash
npm run install:all
```

This installs dependencies for both `server/` and `client/`.

---

## 7. Running in Development

In two terminals, from the project root:

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # App on http://localhost:5173
```

Open http://localhost:5173 and sign in with one of the demo accounts above. Add a vehicle or vessel
through the form, then check the Supabase Table Editor for that project — the row will be there.

---

## 8. Environment Variables (full reference)

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `4000` |
| `JWT_SECRET` | Secret used to sign session tokens — **change this in production** | (placeholder — must change) |
| `JWT_EXPIRES_IN` | Session length | `8h` |
| `SUPABASE_URL` | Your Supabase project URL | `https://ntjpcyojyzekicimfpdk.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role secret key (see §4) | — you must set this |
| `UPLOAD_DIR` | Directory for uploaded photos/documents (local disk) | `./uploads` |
| `MAX_UPLOAD_MB` | Maximum upload size in MB | `5` |
| `EXPIRY_WARNING_DAYS` | Days before expiry a record is flagged "Expiring Soon" | `30` |

---

## 9. Deploying (Render or Railway — single service)

The server is set up to serve the built frontend itself in production, so you only need **one**
web service (not a separate static site + API). Both platforms follow the same pattern; pick
whichever you prefer.

**Build command:**
```
npm install && npm run build
```
**Start command:**
```
npm start
```

### Render

1. [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo
   (`afey10/veymandoo-police-chandhaa`).
2. Environment: **Node**. Build command / start command as above.
3. Under **Environment Variables**, add:
   - `SUPABASE_URL` = `https://ntjpcyojyzekicimfpdk.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase dashboard → this project → Project Settings → API)
   - `JWT_SECRET` = a long random string
   - `NODE_ENV` = `production`
4. Deploy. Render gives you a URL like `https://veymandoo-dhaftharu.onrender.com` — open it, the
   whole app (frontend + API) is served from there.

### Railway

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → select
   `afey10/veymandoo-police-chandhaa`.
2. Railway auto-detects Node. Confirm build/start commands match the ones above under
   **Settings → Deploy**.
3. Under **Variables**, add the same four variables as the Render list above.
4. Deploy, then **Settings → Networking → Generate Domain** to get a public URL.

### A note on uploaded files

Both platforms' default disks are **ephemeral** — files written to `server/uploads/` (vehicle/vessel
photos, documents, profile pictures) can be wiped on redeploy or restart unless you attach a
persistent volume (Render: "Disks" on the service; Railway: "Volumes"). For a small single-station
deployment this is usually fine to add later; just be aware plain uploads won't survive a redeploy
until you do. If this becomes a problem, the cleanest long-term fix is switching file storage to
**Supabase Storage** (a bucket in the same project) instead of local disk — ask if you'd like that
built in.

---

## 10. Production Build (manual / local)

```bash
npm run build:server   # compiles server/src -> server/dist
npm run build:client   # builds client/src -> client/dist (static files)
```

Run the compiled server with:

```bash
cd server
NODE_ENV=production node dist/server.js
```

In production:
- Set a long, random `JWT_SECRET`.
- Set `CLIENT_ORIGIN` to your real domain (used for CORS).
- Serve the app over HTTPS so the auth cookie's `secure` flag is honoured.
- Keep `SUPABASE_SERVICE_ROLE_KEY` out of any client bundle or public repo.

---

## 11. Creating the First Administrator (if starting fresh)

If you ever need another administrator beyond the seeded `V1001` account, the easiest way is
directly in the Supabase SQL Editor for this project:

```sql
insert into users (service_number, full_name, password_hash, role, can_add_records, can_edit_records)
values (
  'V1000',
  'System Administrator',
  crypt('ChangeMe@123', gen_salt('bf', 12)),
  'admin', true, true
);
```

(`crypt()`/`gen_salt()` come from the `pgcrypto` extension, already enabled on this project, and
produce a real bcrypt hash compatible with the Node backend.) Sign in and change this password
immediately from the Profile page — or better, use **Settings → Add Staff Account** from inside the
app once you have one working administrator login.

---

## 12. Roles, Permissions & Staff Accounts

- **Administrator** — full access: add/edit/delete vehicles and vessels, manage categories, manage
  staff accounts and permissions, reset passwords, view the audit log.
- **Staff** — can always view, search and filter vehicles/vessels. Whether a staff member can also
  *add* or *edit* records is controlled per-account by an administrator in **Settings**.

New staff accounts, permission changes, and password resets are all done from **Settings** inside
the app (admin only) — no direct database access needed for day-to-day use.

---

## 13. Backup & Restore

Supabase takes automatic backups on paid plans; on the free tier, back up manually via the SQL
Editor or `pg_dump` using your database connection string (Project Settings → Database). Since
photos/documents are stored on the server's local disk (`server/uploads/`), back that directory up
separately alongside the database.

---

## 14. Project Structure

```
veymandoo-dhaftharu/
├── server/
│   └── src/
│       ├── controllers/     # request handlers (auth, vehicles, vessels, categories, users, audit)
│       ├── routes/          # Express route definitions
│       ├── middleware/      # auth, role checks, uploads, error handling, rate limiting
│       ├── db/               # supabase.ts - the Supabase client (service_role key)
│       ├── utils/            # expiry-status logic, audit logging, validation schemas
│       └── types/            # shared TypeScript types
└── client/
    └── src/
        ├── pages/
        │   ├── vehicles/     # Vehicle dashboard, list, form, details
        │   └── vessels/      # Vessel dashboard, list, form, details
        ├── layouts/          # AppLayout (sidebar + header)
        ├── components/       # StatusBadge, StatCard, ConfirmDialog, Toast, ProtectedRoute…
        ├── context/          # AuthContext
        ├── api/              # Axios client
        └── types/            # shared TypeScript types
```

---

## 15. Security Notes

- Passwords are hashed with **bcrypt** (12 rounds) — never stored in plain text.
- Auth uses a signed **JWT in an httpOnly cookie**, so it isn't accessible to page JavaScript.
- **Row Level Security is enabled with no policies** on every table, so the Supabase `anon` key has
  no access at all — only the backend's `service_role` key can reach the data, and that key never
  leaves the server.
- Every write endpoint (`POST`/`PUT`/`DELETE`) is behind `requireAuth` and, where relevant,
  `requireRole('admin')` or the per-user add/edit permission flags — enforced server-side.
- All inputs are validated server-side with **Zod**, independent of the frontend form validation.
- File uploads are restricted by extension **and** MIME type, size-limited, and renamed to random
  filenames on disk (no executable files are ever accepted).
- Login attempts are rate-limited per IP, and accounts lock temporarily after 5 failed attempts.
- Every add/edit/delete action, login, and logout is written to the `audit_log` table in Supabase.
- Logging out clears the auth cookie; protected routes re-check auth on every navigation, so the
  browser back button cannot reveal protected pages after logout.

---

## 16. What Was Tested

Login/logout, auth protection on all routes, vehicle & vessel CRUD against the live Supabase
database, search, filters (category, status), sorting, pagination, expiry status calculation
(valid/expiring soon/critical/expired), category management, add/edit permission enforcement,
delete restricted to administrators, profile picture upload, password change, admin user creation &
permission toggles, password reset, audit log filtering, file upload validation, and responsive
layout down to mobile widths.
