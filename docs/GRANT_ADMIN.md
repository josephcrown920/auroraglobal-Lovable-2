# Grant admin to owner emails

Since this project points at an external Supabase (not Lovable Cloud), run
this once in your Supabase SQL editor to make
`outthemudrecordsltd@gmail.com` and `josephcrown920@gmail.com` admins.
Idempotent — safe to re-run.

```sql
-- 1. Backfill existing users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('outthemudrecordsltd@gmail.com', 'josephcrown920@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Auto-promote on future signup (only after email is verified,
--    so nobody can hijack admin via a spoofed address).
CREATE OR REPLACE FUNCTION public.grant_admin_for_owner_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) IN ('outthemudrecordsltd@gmail.com', 'josephcrown920@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_owner_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_owner_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_owner_emails();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_owner_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_owner_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_owner_emails();
```
