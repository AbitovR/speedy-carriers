-- Make trip_id nullable in loads table so orders can exist without a trip
ALTER TABLE loads 
  ALTER COLUMN trip_id DROP NOT NULL;

-- Add index for loads without trips (orphaned loads)
CREATE INDEX IF NOT EXISTS idx_loads_trip_id_null ON loads(trip_id) WHERE trip_id IS NULL;

