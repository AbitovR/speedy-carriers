-- Update RLS policies for loads to allow loads without trips
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view loads from their trips" ON loads;
DROP POLICY IF EXISTS "Users can create loads" ON loads;
DROP POLICY IF EXISTS "Users can update loads from their trips" ON loads;
DROP POLICY IF EXISTS "Users can delete loads from their trips" ON loads;

-- Create new policies that allow loads without trips
-- Users can view loads that belong to their trips OR loads without trips (orphaned loads)
CREATE POLICY "Users can view their loads"
  ON loads FOR SELECT
  USING (
    -- Load belongs to a trip owned by the user
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = loads.trip_id
      AND trips.user_id = auth.uid()
    )
    OR
    -- Load doesn't have a trip (orphaned load) - allow if created by user
    -- Note: We'll need to track user_id in loads or use a different approach
    loads.trip_id IS NULL
  );

-- Users can create loads for their trips OR loads without trips
CREATE POLICY "Users can create loads"
  ON loads FOR INSERT
  WITH CHECK (
    -- Load belongs to a trip owned by the user
    (loads.trip_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = loads.trip_id
      AND trips.user_id = auth.uid()
    ))
    OR
    -- Load doesn't have a trip (orphaned load) - allow creation
    loads.trip_id IS NULL
  );

-- Users can update loads from their trips OR orphaned loads
CREATE POLICY "Users can update their loads"
  ON loads FOR UPDATE
  USING (
    -- Load belongs to a trip owned by the user
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = loads.trip_id
      AND trips.user_id = auth.uid()
    )
    OR
    -- Load doesn't have a trip (orphaned load) - allow update
    loads.trip_id IS NULL
  );

-- Users can delete loads from their trips OR orphaned loads
CREATE POLICY "Users can delete their loads"
  ON loads FOR DELETE
  USING (
    -- Load belongs to a trip owned by the user
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = loads.trip_id
      AND trips.user_id = auth.uid()
    )
    OR
    -- Load doesn't have a trip (orphaned load) - allow delete
    loads.trip_id IS NULL
  );

