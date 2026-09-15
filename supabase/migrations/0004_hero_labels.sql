-- ============================================================================
-- Royalty Studio — 0004
-- Adds the editable hero "labels" list (top-left of the homepage hero).
-- Safe to run on an existing database that already has 0001–0003 applied.
-- Fresh installs already get this column from 0001_schema.sql.
-- ============================================================================

alter table public.site_settings
  add column if not exists hero_labels text;
