# MELA MARKET — SECURE DATABASE-SIDE ADMINISTRATOR ACCESS SETUP

This guide details the procedure for granting and enforcing administrator access for **Mela Market**.

---

## 1. Security Architecture Summary

- **Zero Public Exposure:** There are no buttons, links, menus, or footer items anywhere on the public website for the Admin Dashboard.
- **Direct Access URL:** Administrators must navigate directly to `/admin` in the browser.
- **Database Authorization Required:** Access to `/admin` is verified on the database level via Supabase Authentication and `public.profiles.role = 'admin'`.
- **Automatic Denial & Redirect:** Any ordinary user account (or non-admin visitor) navigating to `/admin` is blocked with a `403 Forbidden: Access Denied` response and redirected to the home page.
- **No Self-Promotion:** Public registration creates standard `user` accounts only. Ordinary users cannot promote their account to `admin` through the app or client-side queries.

---

## 2. Steps to Grant Administrator Access in Supabase

Run the following SQL commands in your **Supabase Dashboard > SQL Editor**:

```sql
-- 1. Grant the 'admin' role to your specifically authorized email:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'mikiaelebrhane21@gmail.com';

-- 2. Verify that the update succeeded:
SELECT id, name, email, role, created_at 
FROM public.profiles 
WHERE email = 'mikiaelebrhane21@gmail.com';
```

*(Note: If your account was registered in Supabase Auth but the profile record was not created yet, register your account through the normal website sign-up first, then run the SQL statement above).*

---

## 3. How to Sign In to the Admin Portal

1. Enter `/admin` directly in your browser's address bar (e.g., `https://[your-app-url]/admin`).
2. If not already signed in, enter your authorized email (`mikiaelebrhane21@gmail.com`) and password.
3. The system authenticates with Supabase, confirms that `public.profiles.role === 'admin'`, and opens the full **Admin Dashboard**.
4. To return to the public marketplace, click **"Go to Storefront"** or **"Sign Out"**.
