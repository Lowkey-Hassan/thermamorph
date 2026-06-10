-- Migration 002: Add hvac_install_year to audits
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

alter table audits
  add column if not exists hvac_install_year integer;

comment on column audits.hvac_install_year is
  'Year the current HVAC system was installed (may differ from build_year if system was later replaced)';
