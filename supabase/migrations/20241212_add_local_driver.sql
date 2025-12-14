-- Add 'local_driver' to the driver_type CHECK constraint
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_driver_type_check;
ALTER TABLE drivers ADD CONSTRAINT drivers_driver_type_check 
  CHECK (driver_type IN ('company_driver', 'owner_operator', 'local_driver'));

-- Add optional fields to trips table for local driver orders
ALTER TABLE trips 
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS is_local_driver_order BOOLEAN DEFAULT FALSE;

-- Make file_name and file_url nullable for local driver orders (they don't upload files)
ALTER TABLE trips 
  ALTER COLUMN file_name DROP NOT NULL,
  ALTER COLUMN file_url DROP NOT NULL;


