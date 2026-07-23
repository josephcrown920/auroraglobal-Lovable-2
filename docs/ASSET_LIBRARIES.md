# Asset Libraries — Outfits & Scenes

Two libraries surfaced across Aurora (Admin + Canvas + Perform Anywhere):

- **User-private assets** (`user_assets`) — every signed-in user can upload their
  own outfit references, outfit sheets, avatars, and environments/scenes.
- **Admin preset packs** (`admin_asset_packs`) — curated outfit sheets and
  world/environment packs the admin ships to every user (read-only browse).

Both use categories: `outfit`, `scene`. Extend the enum if new categories are
added; keep it small.

## Run this SQL once in the external Supabase SQL editor

```sql
-- Categories enum
do $$ begin
  create type public.asset_category as enum ('outfit', 'scene');
exception when duplicate_object then null; end $$;

-- User-private assets (each user sees only their own)
create table if not exists public.user_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.asset_category not null,
  title text not null,
  image_url text not null,
  notes text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.user_assets to authenticated;
grant all on public.user_assets to service_role;

alter table public.user_assets enable row level security;

create policy "own user_assets select" on public.user_assets
  for select to authenticated using (auth.uid() = user_id);
create policy "own user_assets insert" on public.user_assets
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own user_assets update" on public.user_assets
  for update to authenticated using (auth.uid() = user_id);
create policy "own user_assets delete" on public.user_assets
  for delete to authenticated using (auth.uid() = user_id);

-- Admin preset packs (public read; admin write)
create table if not exists public.admin_asset_packs (
  id uuid primary key default gen_random_uuid(),
  category public.asset_category not null,
  title text not null,
  image_url text not null,
  tags text[] not null default '{}',
  notes text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

grant select on public.admin_asset_packs to authenticated, anon;
grant all on public.admin_asset_packs to service_role;

alter table public.admin_asset_packs enable row level security;

create policy "published packs are public" on public.admin_asset_packs
  for select to authenticated, anon using (is_published);
create policy "admins manage packs" on public.admin_asset_packs
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_asset_packs_cat_idx
  on public.admin_asset_packs (category, sort_order);
create index if not exists user_assets_owner_cat_idx
  on public.user_assets (user_id, category, created_at desc);
```

## Surfaces

- **Admin**: `/admin/assets` — upload / manage `admin_asset_packs`.
- **Canvas & Perform Anywhere**: `<AssetLibraryPicker category="outfit" />`
  and `<AssetLibraryPicker category="scene" />` render both libraries with
  tabs (My library / Aurora presets).

Storage: reuse the existing user studio bucket; write files under
`<uid>/library/<category>/<id>.<ext>` so `assertOwnStudioUpload` continues to
pass when the URL is later fed into identity-locked generators.
