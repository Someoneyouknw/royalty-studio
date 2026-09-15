-- ============================================================================
-- Royalty Studio — 0001 schema
-- Tables, enums, indexes, foreign keys, constraints, triggers and helpers.
-- Run this first, then 0002_rls.sql and 0003_storage.sql, then seed.sql.
-- ============================================================================

-- gen_random_uuid() is available by default on Supabase. citext for emails.
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.price_type as enum ('fixed', 'starting_from', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.inquiry_status as enum ('new', 'contacted', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.conversation_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sender_type as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       citext,
  role        public.user_role not null default 'admin',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Authorization helper. SECURITY DEFINER so RLS policies can call it without
-- recursively evaluating profiles' own policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  );
$$;

-- Automatically create a profile row when a new auth user is created.
-- NOTE: new users are given the 'admin' role — this suits the single-studio
-- use case where you create accounts manually from the Supabase dashboard.
-- KEEP PUBLIC EMAIL SIGN-UPS DISABLED in Auth settings, or anyone could
-- self-register as an admin. See the README "Security notes".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  cover_image_url text,
  display_order   integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint categories_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists idx_categories_active_order
  on public.categories (is_active, display_order);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.categories (id) on delete set null,
  title         text,
  description   text,
  image_url     text not null,
  thumbnail_url text,
  alt_text      text,
  storage_path  text not null,
  width         integer,
  height        integer,
  file_size     integer,
  is_featured   boolean not null default false,
  is_published  boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_photos_category on public.photos (category_id);
create index if not exists idx_photos_published on public.photos (is_published);
create index if not exists idx_photos_featured on public.photos (is_featured) where is_featured;
create index if not exists idx_photos_order on public.photos (display_order, created_at desc);

drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at
  before update on public.photos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  description   text,
  image_url     text,
  price         numeric(12,2),
  price_type    public.price_type not null default 'starting_from',
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint services_title_not_blank check (length(btrim(title)) > 0),
  constraint services_price_nonneg check (price is null or price >= 0)
);

create index if not exists idx_services_active_order
  on public.services (is_active, display_order);

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  client_name   text not null,
  client_role   text,
  testimonial   text not null,
  image_url     text,
  rating        smallint,
  is_featured   boolean not null default false,
  is_published  boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint testimonials_rating_range check (rating is null or (rating between 1 and 5))
);

create index if not exists idx_testimonials_published_order
  on public.testimonials (is_published, display_order);

-- ---------------------------------------------------------------------------
-- inquiries  (booking / contact requests)
-- ---------------------------------------------------------------------------
create table if not exists public.inquiries (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            citext,
  phone            text,
  service_id       uuid references public.services (id) on delete set null,
  preferred_date   text,
  preferred_time   text,
  location         text,
  number_of_people integer,
  message          text,
  status           public.inquiry_status not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint inquiries_contact_present check (email is not null or phone is not null)
);

create index if not exists idx_inquiries_status on public.inquiries (status);
create index if not exists idx_inquiries_created on public.inquiries (created_at desc);

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversations + messages  (client / admin realtime chat)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  -- The anonymous auth user (supabase.auth.signInAnonymously) that owns this
  -- conversation. RLS scopes visitor access to their own rows via this id.
  visitor_id      uuid,
  visitor_name    text not null,
  visitor_email   citext,
  visitor_phone   text,
  status          public.conversation_status not null default 'open',
  last_message_at timestamptz,
  admin_unread    integer not null default 0,
  client_unread   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_conversations_status on public.conversations (status);
create index if not exists idx_conversations_recent on public.conversations (last_message_at desc nulls last);

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_type     public.sender_type not null,
  sender_id       uuid,
  message         text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  constraint messages_not_blank check (length(btrim(message)) > 0)
);

create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

-- Keep conversation summary counters + timestamps in sync on new messages.
create or replace function public.bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now(),
      admin_unread = case when new.sender_type = 'client' then admin_unread + 1 else admin_unread end,
      client_unread = case when new.sender_type = 'admin' then client_unread + 1 else client_unread end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation on public.messages;
create trigger trg_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_on_message();

-- ---------------------------------------------------------------------------
-- site_settings  (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                        integer primary key default 1,
  studio_name               text not null default 'Royalty Studio',
  tagline                   text,
  logo_url                  text,
  favicon_url               text,
  phone                     text,
  whatsapp                  text,
  whatsapp_default_message  text,
  email                     citext,
  address                   text,
  map_embed_url             text,
  opening_hours             text,
  instagram_url             text,
  facebook_url              text,
  tiktok_url                text,
  youtube_url               text,
  x_url                     text,
  hero_image_url            text,
  hero_title                text,
  hero_subtitle             text,
  hero_labels               text,
  about_image_url           text,
  about_text                text,
  seo_title                 text,
  seo_description           text,
  og_image_url              text,
  updated_at                timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Enable realtime for chat tables (safe to run repeatedly).
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;
