-- Migration: vehicle_master registration number as primary key
-- Date: 2026-06-12
-- Description: Replace integer surrogate key (vehicle_master_id) with
--              vehicle_no (registration number) as the natural primary key.
--              Also migrates live_values and fault_events FK references.
--
-- WARNING: This migration is IRREVERSIBLE. It drops vehicle_master_id columns
-- and all indexes that reference them. There is no down migration.
-- Take a full database backup before running this in production.
--
-- NOTE: This migration handles existing data by populating vehicle_no
-- in dependent tables via a JOIN before dropping the old FK columns.
-- If tables are truly empty, the UPDATE steps are no-ops but are safe to include.

BEGIN;

-- 0. Drop the view that references vehicle_master_id on fault_events
DROP VIEW IF EXISTS v_fault_events;

-- 1. Drop FK constraints on dependent tables
ALTER TABLE live_values  DROP CONSTRAINT IF EXISTS live_values_vehicle_master_id_fkey;
ALTER TABLE fault_events DROP CONSTRAINT IF EXISTS fault_events_vehicle_master_id_fkey;

-- 2. Drop all indexes referencing vehicle_master_id on live_values
DROP INDEX IF EXISTS idx_live_values_vehicle_time;
DROP INDEX IF EXISTS idx_live_values_faults;
DROP INDEX IF EXISTS idx_live_values_location;
DROP INDEX IF EXISTS live_values_vehicle_master_id_idx;

-- 3. Drop all indexes referencing vehicle_master_id on fault_events
DROP INDEX IF EXISTS idx_fault_events_vehicle_time;
DROP INDEX IF EXISTS idx_fault_events_open;
DROP INDEX IF EXISTS uq_fault_events_one_open;
DROP INDEX IF EXISTS fault_events_vehicle_master_id_fault_code_partial_idx;

-- 4. Add vehicle_no column to dependent tables (nullable first)
ALTER TABLE live_values  ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(20);
ALTER TABLE fault_events ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(20);

-- 5. Populate vehicle_no from vehicle_master via the old FK (handles existing data)
UPDATE live_values lv
SET vehicle_no = vm.vehicle_no
FROM vehicle_master vm
WHERE lv.vehicle_master_id = vm.vehicle_master_id;

UPDATE fault_events fe
SET vehicle_no = vm.vehicle_no
FROM vehicle_master vm
WHERE fe.vehicle_master_id = vm.vehicle_master_id;

-- 6. Drop old integer FK columns from dependent tables
ALTER TABLE live_values  DROP COLUMN IF EXISTS vehicle_master_id;
ALTER TABLE fault_events DROP COLUMN IF EXISTS vehicle_master_id;

-- 7. Rebuild vehicle_master: drop PK + old columns, promote vehicle_no
ALTER TABLE vehicle_master DROP CONSTRAINT IF EXISTS vehicle_master_pkey CASCADE;
ALTER TABLE vehicle_master DROP COLUMN IF EXISTS vehicle_master_id;
ALTER TABLE vehicle_master DROP COLUMN IF EXISTS vehicle_unique_id;
ALTER TABLE vehicle_master ALTER COLUMN vehicle_no SET NOT NULL;
ALTER TABLE vehicle_master ADD CONSTRAINT vehicle_master_pkey PRIMARY KEY (vehicle_no);

-- SAFETY: Before running NOT NULL constraints, verify no orphaned rows remain:
-- SELECT COUNT(*) FROM live_values  WHERE vehicle_no IS NULL;
-- SELECT COUNT(*) FROM fault_events WHERE vehicle_no IS NULL;
-- Both must return 0. If not, investigate orphaned FK data before proceeding.

-- 8. Make vehicle_no NOT NULL in dependent tables and add FKs
ALTER TABLE live_values ALTER COLUMN vehicle_no SET NOT NULL;
ALTER TABLE live_values ADD CONSTRAINT live_values_vehicle_no_fkey
  FOREIGN KEY (vehicle_no) REFERENCES vehicle_master(vehicle_no) ON DELETE CASCADE;

ALTER TABLE fault_events ALTER COLUMN vehicle_no SET NOT NULL;
ALTER TABLE fault_events ADD CONSTRAINT fault_events_vehicle_no_fkey
  FOREIGN KEY (vehicle_no) REFERENCES vehicle_master(vehicle_no) ON DELETE CASCADE;

-- 9. Recreate partial unique index on fault_events (required by ON CONFLICT clause in app)
CREATE UNIQUE INDEX IF NOT EXISTS fault_events_active_unique
  ON fault_events (vehicle_no, fault_code)
  WHERE deactivated_at IS NULL;

-- 10. Performance index on live_values
CREATE INDEX IF NOT EXISTS live_values_vehicle_no_time_idx
  ON live_values (vehicle_no, recorded_at DESC, id DESC);

-- 11. Recreate supporting indexes using vehicle_no
CREATE INDEX IF NOT EXISTS idx_fault_events_vehicle_time
  ON fault_events (vehicle_no, activated_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_values_faults
  ON live_values (vehicle_no, recorded_at DESC)
  WHERE faults IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_live_values_location
  ON live_values (vehicle_no, recorded_at DESC)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 12. Recreate view v_fault_events using vehicle_no
CREATE VIEW v_fault_events AS
  SELECT
    fault_event_id,
    vehicle_no,
    fault_code,
    activated_at,
    deactivated_at,
    speed_at_activation,
    soc_at_activation,
    speed_at_deactivation,
    soc_at_deactivation,
    live_value_id_start,
    live_value_id_end,
    created_at,
    updated_at,
    CASE
      WHEN deactivated_at IS NOT NULL
        THEN EXTRACT(epoch FROM (deactivated_at - activated_at))::integer
      ELSE NULL::integer
    END AS duration_seconds,
    (deactivated_at IS NULL) AS is_active
  FROM fault_events;

COMMIT;
