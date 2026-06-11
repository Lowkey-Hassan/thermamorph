-- Migration 003: Allow 'hvac' as an audit_uploads.zone value
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
--
-- The audit form now asks users to upload a photo of their HVAC/AC unit
-- (in addition to windows, doors, walls, vents, exterior) so the analysis
-- engine has direct visual evidence of the heating/cooling system.

alter table audit_uploads
  drop constraint if exists audit_uploads_zone_check;

alter table audit_uploads
  add constraint audit_uploads_zone_check
  check (zone in ('windows','doors','walls','vents','roof','exterior','hvac','other'));
