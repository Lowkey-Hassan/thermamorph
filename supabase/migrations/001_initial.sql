-- ============================================================
-- ThermaMorph - Initial Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── audits ────────────────────────────────────────────────────
create table if not exists audits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  name          text not null,
  building_type text not null,
  build_year    integer not null,
  floor_area    numeric not null,
  location      text not null,
  hvac_type     text not null,
  status        text not null default 'draft'
                  check (status in ('draft','uploading','analyzing','complete','error')),
  error_message text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table audits enable row level security;

create policy "Users can manage own audits"
  on audits for all using (auth.uid() = user_id);

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger audits_updated_at
  before update on audits
  for each row execute procedure set_updated_at();

create index audits_user_id_idx on audits(user_id);
create index audits_status_idx on audits(status);

-- ── audit_uploads ─────────────────────────────────────────────
create table if not exists audit_uploads (
  id           uuid primary key default gen_random_uuid(),
  audit_id     uuid references audits(id) on delete cascade not null,
  storage_path text not null,
  file_name    text not null,
  file_size    integer,
  mime_type    text,
  zone         text default 'other'
                 check (zone in ('windows','doors','walls','vents','roof','exterior','other')),
  created_at   timestamptz default now()
);

alter table audit_uploads enable row level security;

create policy "Users can manage own audit uploads"
  on audit_uploads for all
  using (
    audit_id in (select id from audits where user_id = auth.uid())
  );

create index audit_uploads_audit_id_idx on audit_uploads(audit_id);

-- ── analysis_results ──────────────────────────────────────────
create table if not exists analysis_results (
  id                    uuid primary key default gen_random_uuid(),
  audit_id              uuid references audits(id) on delete cascade not null unique,
  carbon_score          integer not null check (carbon_score between 0 and 100),
  annual_co2_kg         numeric not null,
  annual_energy_kwh     numeric not null,
  estimated_annual_cost numeric not null,
  potential_savings_pct numeric not null,
  contractor_brief      text,
  model_used            text,
  raw_response          jsonb,
  created_at            timestamptz default now()
);

alter table analysis_results enable row level security;

create policy "Users can view own analysis results"
  on analysis_results for all
  using (
    audit_id in (select id from audits where user_id = auth.uid())
  );

-- ── problem_areas ─────────────────────────────────────────────
create table if not exists problem_areas (
  id                    uuid primary key default gen_random_uuid(),
  audit_id              uuid references audits(id) on delete cascade not null,
  title                 text not null,
  description           text not null,
  severity              text not null check (severity in ('low','medium','high','critical')),
  estimated_loss_kwh    numeric,
  fix_cost_min          numeric,
  fix_cost_max          numeric,
  location              text,
  sort_order            integer default 0,
  created_at            timestamptz default now()
);

alter table problem_areas enable row level security;

create policy "Users can view own problem areas"
  on problem_areas for all
  using (
    audit_id in (select id from audits where user_id = auth.uid())
  );

create index problem_areas_audit_id_idx on problem_areas(audit_id);

-- ── roadmap_items ─────────────────────────────────────────────
create table if not exists roadmap_items (
  id            uuid primary key default gen_random_uuid(),
  audit_id      uuid references audits(id) on delete cascade not null,
  title         text not null,
  description   text not null,
  effort        text not null check (effort in ('quick','medium','major')),
  roi_months    integer,
  cost_min      numeric,
  cost_max      numeric,
  co2_saving_kg numeric,
  priority      integer default 0,
  created_at    timestamptz default now()
);

alter table roadmap_items enable row level security;

create policy "Users can view own roadmap items"
  on roadmap_items for all
  using (
    audit_id in (select id from audits where user_id = auth.uid())
  );

create index roadmap_items_audit_id_idx on roadmap_items(audit_id);

-- ── energy_breakdown ──────────────────────────────────────────
create table if not exists energy_breakdown (
  id           uuid primary key default gen_random_uuid(),
  audit_id     uuid references audits(id) on delete cascade not null,
  category     text not null,
  kwh_per_year numeric not null,
  percentage   numeric not null,
  created_at   timestamptz default now()
);

alter table energy_breakdown enable row level security;

create policy "Users can view own energy breakdown"
  on energy_breakdown for all
  using (
    audit_id in (select id from audits where user_id = auth.uid())
  );

create index energy_breakdown_audit_id_idx on energy_breakdown(audit_id);

-- ── Storage bucket ────────────────────────────────────────────
-- Run this in Supabase Dashboard > Storage > New Bucket
-- Name: building-photos, Private: true
-- Or uncomment below if using CLI:
-- insert into storage.buckets (id, name, public) values ('building-photos', 'building-photos', false);

-- Storage RLS: allow authenticated users to manage their own files
-- File paths follow pattern: {user_id}/{audit_id}/{filename}

create policy "Users can upload their own building photos"
  on storage.objects for insert
  with check (
    bucket_id = 'building-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own building photos"
  on storage.objects for select
  using (
    bucket_id = 'building-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own building photos"
  on storage.objects for delete
  using (
    bucket_id = 'building-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
