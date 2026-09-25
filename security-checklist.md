# Railway Directory Security Checklist

## Required before production

1. Run `supabase-security-migration.sql` in the Supabase SQL editor.
2. Create administrator accounts in Supabase Authentication.
3. Insert those users into `public.user_roles` with `role = 'admin'`.
4. Verify that a normal authenticated user has **no** row in `user_roles` and cannot insert/update/delete sections or stations.
5. Verify an admin can perform the normal application operations.
6. Do not put a Supabase service-role key in Vite environment variables.
7. Do not expose Google Drive files with an `anyone` permission unless that individual document is intentionally public.
8. Keep the Drive root folder private and share it only with the intended Google account(s).
9. Set a strong password policy and enable MFA for administrator accounts in Supabase Auth.
10. Disable public email/password sign-up if accounts are created only by administrators.
11. Configure rate limits / CAPTCHA according to your Supabase Auth deployment and threat model.
12. Serve the production app over HTTPS only.
13. Configure HTTP security headers at the hosting layer (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, and frame protections).
14. Back up the Supabase database and test restoration before relying on it operationally.
15. Review `audit_log` regularly or expose an admin-only audit screen later.

## Important architecture note

The current browser-to-Google-Drive upload uses an OAuth access token in the browser. The token is short-lived and the app uses the narrow `drive.file` scope, but this is still less isolated than a server-side upload service.

For high-sensitivity documents, move Drive upload to a trusted backend/Supabase Edge Function. The backend should authorize the Supabase user from their JWT, validate the file, upload it to Drive, and return only the resulting file identifier/URL. Never put a Google client secret or service-account private key in the React app.

## Public vs internal directory

The SQL migration keeps directory rows publicly readable so the existing public-view behavior continues to work. If station/section data itself is internal, change the SELECT policies from `anon, authenticated` to `authenticated` and require login before loading the directory.

## Document URLs

The app now accepts only `http:` and `https:` URLs. This blocks dangerous schemes such as `javascript:` and `data:` from becoming clickable links.

## Upload limits

The browser upload path allows PDF, PNG and JPEG files up to 25 MB. For high-security environments, add server-side file-type verification and malware scanning before storing documents.
