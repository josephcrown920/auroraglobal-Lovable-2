
-- ============ Roles ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ============ Shared timestamp trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ Profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free',
  credits integer NOT NULL DEFAULT 5,
  lifetime_credits_purchased integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND credits IS NOT DISTINCT FROM (SELECT p.credits FROM public.profiles p WHERE p.user_id = auth.uid())
    AND plan IS NOT DISTINCT FROM (SELECT p.plan FROM public.profiles p WHERE p.user_id = auth.uid())
    AND lifetime_credits_purchased IS NOT DISTINCT FROM (SELECT p.lifetime_credits_purchased FROM public.profiles p WHERE p.user_id = auth.uid())
  );
CREATE POLICY "profiles admin read" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    5
  )
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Generations ============
CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  mode text NOT NULL DEFAULT 'performance',
  model text,
  status text NOT NULL DEFAULT 'pending',
  input_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  audio_url text,
  result_image_url text,
  result_video_url text,
  motion_video_url text,
  error text,
  credits_cost integer NOT NULL DEFAULT 1,
  is_favorite boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,
  share_token text UNIQUE,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generations self select" ON public.generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "generations self insert" ON public.generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generations self update" ON public.generations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generations self delete" ON public.generations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "generations public share read" ON public.generations
  FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "generations admin read" ON public.generations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX generations_user_created_idx ON public.generations (user_id, created_at DESC);
CREATE INDEX generations_share_token_idx ON public.generations (share_token) WHERE share_token IS NOT NULL;

-- ============ Gift cards ============
CREATE TABLE public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  credits integer NOT NULL CHECK (credits > 0),
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  design text NOT NULL DEFAULT 'aurora',
  note text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_cards TO authenticated;
GRANT ALL ON public.gift_cards TO service_role;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_cards admin all" ON public.gift_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gift_cards redeemer read own" ON public.gift_cards
  FOR SELECT TO authenticated USING (redeemed_by = auth.uid());

-- ============ Affiliates ============
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  commission_pct integer NOT NULL DEFAULT 20,
  total_earned_usd numeric NOT NULL DEFAULT 0,
  payout_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates self read" ON public.affiliates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "affiliates self insert" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "affiliates self update" ON public.affiliates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND commission_pct IS NOT DISTINCT FROM (SELECT a.commission_pct FROM public.affiliates a WHERE a.user_id = auth.uid())
    AND total_earned_usd IS NOT DISTINCT FROM (SELECT a.total_earned_usd FROM public.affiliates a WHERE a.user_id = auth.uid())
    AND code IS NOT DISTINCT FROM (SELECT a.code FROM public.affiliates a WHERE a.user_id = auth.uid())
  );
CREATE POLICY "affiliates admin read" ON public.affiliates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.affiliate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  amount_usd numeric DEFAULT 0,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.affiliate_events TO authenticated;
GRANT INSERT ON public.affiliate_events TO anon;
GRANT ALL ON public.affiliate_events TO service_role;
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate_events insert clicks" ON public.affiliate_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    kind = 'click'
    AND (amount_usd IS NULL OR amount_usd = 0)
    AND (user_id IS NULL OR user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.affiliates a WHERE a.code = affiliate_events.code)
  );
CREATE POLICY "affiliate_events owner read" ON public.affiliate_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.code = affiliate_events.code AND a.user_id = auth.uid()));
CREATE POLICY "affiliate_events admin read" ON public.affiliate_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ User webhooks ============
CREATE TABLE public.user_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text,
  event text NOT NULL DEFAULT '*',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_webhooks TO authenticated;
GRANT ALL ON public.user_webhooks TO service_role;
ALTER TABLE public.user_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_webhooks self all" ON public.user_webhooks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX user_webhooks_user_idx ON public.user_webhooks (user_id, active);
CREATE TRIGGER user_webhooks_touch BEFORE UPDATE ON public.user_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Bootstrap first admin ============
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_admin_count int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT count(*) INTO existing_admin_count FROM public.user_roles WHERE role = 'admin';
  IF existing_admin_count > 0 THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
