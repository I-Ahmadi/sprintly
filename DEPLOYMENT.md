# Free deployment: Render + Supabase + Brevo

Sprintly is deployed as one Render web service. Express serves both the API and
the production Vite build, so the browser uses the same origin for `/api` and
the frontend.

## 1. Supabase PostgreSQL

1. Create a free Supabase project.
2. Open **Connect** and copy both shared-pooler connection strings:
   - **Transaction mode** on port `6543` becomes `DATABASE_URL` for normal app
     queries.
   - **Session mode** on port `5432` becomes `DIRECT_URL` for Prisma migrations.
3. Replace `[YOUR-PASSWORD]` in both URLs with the URL-encoded Supabase database
   password and keep both strings private.

Prisma migrations run automatically whenever the Render service starts. The
first start creates all Sprintly tables in the empty Supabase database.

## 2. Brevo transactional email

1. Verify a sender email or domain in Brevo.
2. Create a Brevo API key.
3. Keep the API key private. Add it only in Render's environment prompt.

Sprintly uses Brevo's HTTPS API rather than SMTP because Render Free blocks
outbound SMTP ports.

## 3. Render Blueprint

1. Push this repository and branch to GitHub.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Select the branch containing `render.yaml`.
4. Supply the prompted secret values:

   - `DATABASE_URL`: Supabase Transaction pooler connection string (port `6543`)
   - `DIRECT_URL`: Supabase Session pooler connection string (port `5432`)
   - `BREVO_API_KEY`: Brevo API key
   - `BREVO_SENDER_EMAIL`: verified Brevo sender address

Render generates the JWT secrets. The application automatically derives its
public URL from `RENDER_EXTERNAL_HOSTNAME`, so verification, reset, and invite
links point to the deployed site.

## 4. Verify the deployment

After the first deploy completes, check:

- `https://YOUR-SERVICE.onrender.com/api/health` returns
  `{"success":true,"status":"ok"}`.
- The site opens at `https://YOUR-SERVICE.onrender.com`.
- A new signup receives a Brevo verification email.
- Login succeeds after verification.

## Free-tier limitation

Render Free sleeps after inactivity and its local filesystem is ephemeral.
Database records remain in Supabase, but locally uploaded avatar files can be
lost after a restart. Users can still use external avatar URLs; persistent
uploads require moving avatar storage to Supabase Storage or another object
store.
