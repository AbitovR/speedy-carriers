-- Add payment status fields to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('paid_in_full', 'payment_on_hold')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'check', 'zelle')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hold_reason TEXT DEFAULT NULL;

-- Create index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_trips_payment_status ON trips(payment_status);


