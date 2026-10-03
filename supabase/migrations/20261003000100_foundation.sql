-- Milestone 1: core catalog and identity structure. Business access is deny-by-default.
-- Authentication policies and transactions are subsequent, additive migrations.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('administrator','program','finance','checkin','communications')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.conferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0),
  theme text not null default '',
  event_date date not null,
  timezone text not null default 'America/Vancouver',
  currency text not null default 'CAD' check (currency = 'CAD'),
  status text not null default 'draft' check (status in ('draft','open','closed','archived')),
  selection_mode text not null default 'planning' check (selection_mode in ('open','planning','reserved')),
  capacity integer not null check (capacity > 0),
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, slug),
  check (registration_closes_at >= registration_opens_at)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  capacity integer not null check (capacity > 0),
  unique (conference_id, id),
  unique (conference_id, name)
);

create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  label text not null check (length(trim(label)) > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  unique (conference_id, id)
);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  category text not null check (category in ('member','nonmember','student')),
  attendance text not null check (attendance in ('inperson','online')),
  amount_cents integer not null check (amount_cents >= 0),
  active boolean not null default true,
  unique (conference_id, category, attendance),
  unique (conference_id, id)
);

create table public.presenters (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  bio text not null default '',
  publication_consent_at timestamptz,
  unique (conference_id, id)
);

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  presenter_id uuid,
  room_id uuid,
  time_block_id uuid,
  format text not null check (format in ('inperson','online','hybrid')),
  capacity integer not null check (capacity > 0),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','withdrawn')),
  unique (conference_id, id),
  foreign key (conference_id, presenter_id) references public.presenters(conference_id, id) on delete restrict,
  foreign key (conference_id, room_id) references public.rooms(conference_id, id) on delete restrict,
  foreign key (conference_id, time_block_id) references public.time_blocks(conference_id, id) on delete restrict
);

-- Private operational marker: never exposed through the API.
create table private.installation (
  singleton boolean primary key default true check (singleton),
  schema_version integer not null check (schema_version = 1),
  installed_at timestamptz not null default now()
);
insert into private.installation (schema_version) values (1);

-- Cover every initial table, including identity skeletons, until milestone 2 adds policies.
do $$
declare relation text;
begin
  foreach relation in array array['organizations','profiles','organization_memberships','conferences','rooms','time_blocks','ticket_types','presenters','workshops'] loop
    execute format('alter table public.%I enable row level security', relation);
    execute format('alter table public.%I force row level security', relation);
    execute format('revoke all on public.%I from public, anon, authenticated', relation);
  end loop;
end $$;
revoke all on all tables in schema private from public, anon, authenticated;

create function public.backend_health()
returns jsonb
language sql stable security invoker
set search_path = ''
as $$ select jsonb_build_object('service', 'cuebc', 'schema_version', 1); $$;
revoke all on function public.backend_health() from public;
grant execute on function public.backend_health() to anon, authenticated, service_role;

create index conferences_organization_idx on public.conferences(organization_id);
create index memberships_user_idx on public.organization_memberships(user_id);
create index workshops_presenter_idx on public.workshops(conference_id, presenter_id);
create index workshops_room_idx on public.workshops(conference_id, room_id);
create index workshops_block_idx on public.workshops(conference_id, time_block_id);

comment on function public.backend_health() is 'Public compatibility probe; returns no identities or conference records.';
comment on table public.workshops is 'Foundation only. Publication/version rules and seat allocation will be added before live writes.';
commit;
