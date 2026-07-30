-- ============================================================
-- Relay — Database Schema (Supabase / Postgres)
-- Fixes applied vs. original draft:
--   1. classes.class / classes.section missing comma  -> fixed
--   2. added google_connections (Composio account link)
--   3. added relay_packs.status + expires_at
--   4. added teacher_profiles.default_continuation_preference
--   5. added updated_at triggers on classes / relay_packs
--   6. added RLS policies (substitute access is via service-role
--      API routes only — never expose relay_packs to anon directly)
-- ============================================================

-- ---------- Teachers ----------
create table teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- ---------- Google Classroom connection (via Composio) ----------
create table google_connections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references teachers(id) on delete cascade,
  composio_connected_account_id text not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'error')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

-- ---------- Classes (Google Classroom mapping) ----------
create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  google_course_id text unique not null,
  class text not null,
  section text not null,
  is_active boolean not null default true,
  classroom_routines jsonb not null default '{}'::jsonb,
  student_support_profiles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_classes_teacher on classes(teacher_id);

-- ---------- Teacher Classroom Profile ----------
create table teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references teachers(id) on delete cascade,
  default_continuation_preference text,
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Absences ----------
create table absences (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  absence_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint unique_teacher_absence_date unique (teacher_id, absence_date)
);
create index idx_absences_teacher_date on absences(teacher_id, absence_date);

-- ---------- Relay Packs ----------
create table relay_packs (
  id uuid primary key default gen_random_uuid(),
  absence_id uuid not null references absences(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  secure_token text unique not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent')),
  relay_pack_json jsonb not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_absence_class unique (absence_id, class_id)
);
create index idx_relay_packs_token on relay_packs(secure_token);

-- ---------- Handovers ----------
create table handovers (
  id uuid primary key default gen_random_uuid(),
  relay_pack_id uuid not null references relay_packs(id) on delete cascade,
  audio_url text,
  transcript text,
  structured_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Triggers
-- ============================================================

-- 1. Auto-provision a teachers row on first Supabase auth sign-in
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.teachers (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_teacher();

-- 2. updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger classes_set_updated_at
  before update on classes
  for each row execute function public.set_updated_at();

create trigger relay_packs_set_updated_at
  before update on relay_packs
  for each row execute function public.set_updated_at();

create trigger teacher_profiles_set_updated_at
  before update on teacher_profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- Teacher-facing tables: locked to auth.uid() = teacher_id.
-- relay_packs / handovers: RLS enabled but NO anon policy —
-- substitute access always goes through a server route using
-- the service-role key, which bypasses RLS by design. This
-- keeps secure_token lookups out of the client entirely.
-- ============================================================

alter table teachers enable row level security;
alter table google_connections enable row level security;
alter table classes enable row level security;
alter table teacher_profiles enable row level security;
alter table absences enable row level security;
alter table relay_packs enable row level security;
alter table handovers enable row level security;

create policy "teachers can read own row" on teachers
  for select using (auth.uid() = id);
create policy "teachers can update own row" on teachers
  for update using (auth.uid() = id);

create policy "teachers manage own connection" on google_connections
  for all using (auth.uid() = teacher_id);

create policy "teachers manage own classes" on classes
  for all using (auth.uid() = teacher_id);

create policy "teachers manage own profile" on teacher_profiles
  for all using (auth.uid() = teacher_id);

create policy "teachers manage own absences" on absences
  for all using (auth.uid() = teacher_id);

create policy "teachers manage own relay packs" on relay_packs
  for all using (
    exists (
      select 1 from absences
      where absences.id = relay_packs.absence_id
      and absences.teacher_id = auth.uid()
    )
  );

create policy "teachers read own handovers" on handovers
  for select using (
    exists (
      select 1 from relay_packs
      join absences on absences.id = relay_packs.absence_id
      where relay_packs.id = handovers.relay_pack_id
      and absences.teacher_id = auth.uid()
    )
  );
-- Note: handover INSERT is done by the substitute-facing API route
-- using the service-role key (substitutes are never authenticated),
-- so no insert policy is defined here on purpose.
