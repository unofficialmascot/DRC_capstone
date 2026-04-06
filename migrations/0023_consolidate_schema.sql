-- Migration: Consolidate redundant tables into parent JSONB/timestamp fields
-- This migration:
-- 1. Adds consolidation fields to scholars (supervisorChangeHistory)
-- 2. Adds consolidation fields to drcMeetings (agendaPoints, minutesGeneratedAt, minutesGeneratedBy)
-- 3. Backs up data from old tables into new JSON fields
-- 4. Drops unused/redundant tables

-- ============ PHASE 1: Add new columns ============

-- Add supervisor change history to scholars table
ALTER TABLE scholars 
ADD COLUMN IF NOT EXISTS supervisor_change_history JSONB DEFAULT '[]'::jsonb;

-- Add agenda points to drcMeetings table
ALTER TABLE drc_meetings 
ADD COLUMN IF NOT EXISTS agenda_points JSONB DEFAULT '[]'::jsonb;

-- Add minutes generation tracking to drcMeetings table
ALTER TABLE drc_meetings 
ADD COLUMN IF NOT EXISTS minutes_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS minutes_generated_by TEXT;

-- ============ PHASE 2: Backfill data from old tables ============

-- Backfill supervisorChangeHistory into scholars as JSON array
UPDATE scholars s
SET supervisor_change_history = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'applicationId', sch.application_id,
        'previousSupervisorId', sch.previous_supervisor_id,
        'newSupervisorId', sch.new_supervisor_id,
        'changedAt', to_iso8601(sch.changed_at)
      ) ORDER BY sch.changed_at
    ),
    '[]'::jsonb
  )
  FROM supervisor_change_history sch
  WHERE sch.scholar_id = s.scholar_id
)
WHERE EXISTS (
  SELECT 1 FROM supervisor_change_history sch 
  WHERE sch.scholar_id = s.scholar_id
);

-- Backfill agendaPoints into drcMeetings as JSON array
UPDATE drc_meetings m
SET agenda_points = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'point', ap.point,
        'createdAt', to_iso8601(ap.created_at)
      ) ORDER BY ap.id
    ),
    '[]'::jsonb
  )
  FROM drc_agenda_points ap
  WHERE ap.meeting_id = m.id
)
WHERE EXISTS (
  SELECT 1 FROM drc_agenda_points ap 
  WHERE ap.meeting_id = m.id
);

-- Backfill minutes generation tracking into drcMeetings
UPDATE drc_meetings m
SET 
  minutes_generated_at = mm.generated_at,
  minutes_generated_by = mm.generated_by
FROM drc_meeting_minutes mm
WHERE m.id = mm.meeting_id;

-- ============ PHASE 3: Drop old/unused tables ============

-- Drop supervisor change history table (now in scholars.supervisor_change_history)
DROP TABLE IF EXISTS supervisor_change_history CASCADE;

-- Drop agenda points table (now in drc_meetings.agenda_points)
DROP TABLE IF EXISTS drc_agenda_points CASCADE;

-- Drop meeting minutes table (now in drc_meetings.minutes_generated_at/by)
DROP TABLE IF EXISTS drc_meeting_minutes CASCADE;

-- Drop unused rac_members table
DROP TABLE IF EXISTS rac_members CASCADE;
