# Backups and recovery — zivarukah.com

## What is backed up, and how

The free Supabase plan has **no automatic backups**, so the repository runs
its own: `.github/workflows/database-backup.yml`.

- **When:** every day at 02:17 (Ghana time), and on demand with
  GitHub → Actions → **Database backup** → **Run workflow**.
- **What:** everything in the database (`public` schema: projects, outreach,
  adverts, inbox messages, books, book orders, page text, settings, audit log
  — structure *and* rows) plus admin logins and file records (`auth.users`,
  `auth.identities`, `auth.mfa_factors`, `storage.buckets`, `storage.objects`).
- **Not included:** the photo/video **files** themselves (only their records).
  Keep original photos on your phone/Google Photos. Code is safe in GitHub.
- **Where:** as an encrypted file attached to each workflow run
  (Actions → a run → *Artifacts* → `zivarukah-db-backup`), kept 30 days.
- **Encryption:** AES-256 with your `BACKUP_PASSPHRASE`. The repository is
  public, so **never** upload an unencrypted dump. Keep the passphrase
  somewhere safe *outside* GitHub (e.g. written down, or a password manager)
  — without it the backups can't be opened.

## One-time setup (from a phone)

1. **Database connection string** — Supabase → project `arukah-platform` →
   **Connect** (top of the page) → **Session pooler** → copy the URI. It looks
   like `postgresql://postgres.<project>:[YOUR-PASSWORD]@aws-…pooler.supabase.com:5432/postgres`.
   Replace `[YOUR-PASSWORD]` with the database password. If you don't know it:
   Settings → Database → **Reset database password** (the website doesn't use
   this password, so resetting it is safe).
2. **GitHub** → `ARUKAH-TECH/Arukah-platform` → **Settings** → **Secrets and
   variables** → **Actions** → **New repository secret**:
   - Name `SUPABASE_DB_URL`, value: the full URI from step 1.
   - Name `BACKUP_PASSPHRASE`, value: a long passphrase (16+ characters) you
     make up and keep safe.
3. **Actions** → **Database backup** → **Run workflow** → check it finishes
   green and has an artifact.

## Restoring (needs a computer)

1. Download the artifact from the run you want, and unzip it to get
   `zivarukah-backup-YYYY-MM-DD.tar.gz.gpg`.
2. Decrypt and unpack:
   ```bash
   gpg --decrypt zivarukah-backup-YYYY-MM-DD.tar.gz.gpg > backup.tar.gz
   tar -xzf backup.tar.gz
   ```
3. **Into a new, empty Supabase project** (safest — never restore over a
   live database you haven't backed up):
   ```bash
   psql "$NEW_DB_URL" -f zivarukah-backup-YYYY-MM-DD/auth-and-storage-data.sql
   psql "$NEW_DB_URL" -f zivarukah-backup-YYYY-MM-DD/public.sql
   ```
   (Logins first, because `public` tables refer to `auth.users`.)
4. In Vercel, point `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   at the new project and redeploy. Re-upload photos if the old project is
   gone (file records exist; the files must be put back in the same buckets).

**Test a restore once** into a throwaway Supabase project, so you know the
steps work before you need them.

## Other recovery

- **Lost admin login:** two-factor recovery is via Supabase → Authentication
  → Users (remove the factor, then sign in and enrol again).
- **A bad change went live:** Vercel → Deployments → previous deployment →
  **Promote to Production** (instant roll-back), then fix on a branch.
