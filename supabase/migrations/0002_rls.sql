-- ============================================================================
-- Royalty Studio — 0002 Row Level Security
-- Public visitors can read published content and submit inquiries/chat.
-- Only authenticated admins (public.is_admin()) can manage content and read
-- private data (inquiries, conversations, visitor contact details).
-- ============================================================================

alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.photos        enable row level security;
alter table public.services      enable row level security;
alter table public.testimonials  enable row level security;
alter table public.inquiries     enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.site_settings enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (is_active or public.is_admin());

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- photos
-- ---------------------------------------------------------------------------
drop policy if exists "photos_public_read" on public.photos;
create policy "photos_public_read" on public.photos
  for select using (is_published or public.is_admin());

drop policy if exists "photos_admin_write" on public.photos;
create policy "photos_admin_write" on public.photos
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select using (is_active or public.is_admin());

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials
  for select using (is_published or public.is_admin());

drop policy if exists "testimonials_admin_write" on public.testimonials;
create policy "testimonials_admin_write" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- inquiries  (public may submit; only admins may read/manage)
-- ---------------------------------------------------------------------------
drop policy if exists "inquiries_public_insert" on public.inquiries;
create policy "inquiries_public_insert" on public.inquiries
  for insert with check (status = 'new');

drop policy if exists "inquiries_admin_read" on public.inquiries;
create policy "inquiries_admin_read" on public.inquiries
  for select using (public.is_admin());

drop policy if exists "inquiries_admin_update" on public.inquiries;
create policy "inquiries_admin_update" on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inquiries_admin_delete" on public.inquiries;
create policy "inquiries_admin_delete" on public.inquiries
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- conversations  (visitor owns their own row via visitor_id = auth.uid())
--   Visitors authenticate anonymously (supabase.auth.signInAnonymously).
-- ---------------------------------------------------------------------------
drop policy if exists "conversations_owner_insert" on public.conversations;
create policy "conversations_owner_insert" on public.conversations
  for insert with check (auth.uid() = visitor_id);

drop policy if exists "conversations_owner_select" on public.conversations;
create policy "conversations_owner_select" on public.conversations
  for select using (auth.uid() = visitor_id or public.is_admin());

drop policy if exists "conversations_owner_update" on public.conversations;
create policy "conversations_owner_update" on public.conversations
  for update using (auth.uid() = visitor_id or public.is_admin())
  with check (auth.uid() = visitor_id or public.is_admin());

drop policy if exists "conversations_admin_delete" on public.conversations;
create policy "conversations_admin_delete" on public.conversations
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- messages  (scoped to a conversation the caller owns, or admin)
-- ---------------------------------------------------------------------------
drop policy if exists "messages_participant_select" on public.messages;
create policy "messages_participant_select" on public.messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.visitor_id = auth.uid()
    )
  );

-- Visitors may only insert client messages into their own conversation.
drop policy if exists "messages_client_insert" on public.messages;
create policy "messages_client_insert" on public.messages
  for insert with check (
    sender_type = 'client'
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.visitor_id = auth.uid()
    )
  );

-- Admins may insert admin messages into any conversation.
drop policy if exists "messages_admin_insert" on public.messages;
create policy "messages_admin_insert" on public.messages
  for insert with check (public.is_admin() and sender_type = 'admin');

drop policy if exists "messages_admin_manage" on public.messages;
create policy "messages_admin_manage" on public.messages
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "messages_admin_delete" on public.messages;
create policy "messages_admin_delete" on public.messages
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_settings  (public read of the single row; only admins update)
-- ---------------------------------------------------------------------------
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "settings_admin_update" on public.site_settings;
create policy "settings_admin_update" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_admin_insert" on public.site_settings;
create policy "settings_admin_insert" on public.site_settings
  for insert with check (public.is_admin());
