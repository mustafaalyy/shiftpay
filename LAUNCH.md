# ShiftPay HR Launch Guide

## 1. Supabase

1. Open your Supabase project.
2. Run the SQL migrations in `supabase/migrations`.
3. Enable Email/Password auth from Authentication > Providers.
4. To enable Google login, open Authentication > Providers > Google and add the Google Client ID and Client Secret.
5. Add the live Vercel domain to Authentication > URL Configuration:
   - Site URL: `https://YOUR-VERCEL-DOMAIN`
   - Redirect URLs: `https://YOUR-VERCEL-DOMAIN/*`

## 2. GitHub

Push the project files to the GitHub repository, but do not commit `.env.local`.

Important files for deployment:

- `package.json`
- `package-lock.json`
- `src/`
- `supabase/`
- `index.html`
- `tailwind.config.js`
- `postcss.config.js`
- `vercel.json`

## 3. Vercel

1. Open Vercel and choose Add New > Project.
2. Import the GitHub repository.
3. Framework Preset: Vite.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add these Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_ADMIN_EMAIL`
7. Deploy.

The included `vercel.json` handles React/Vite routing so refreshes and auth redirects do not return 404.

## 4. After Deploy

1. Open the Vercel live URL.
2. Test sign up, login, and Google login.
3. Open `/#site-admin` with the email set in `VITE_SITE_ADMIN_EMAIL`.
4. Update Supabase redirect URLs if you add a custom domain.
