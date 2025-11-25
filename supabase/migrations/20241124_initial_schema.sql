-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  driver_type TEXT NOT NULL CHECK (driver_type IN ('company_driver', 'owner_operator')),
  email TEXT,
  phone TEXT,
  license_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  trip_date DATE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  total_loads INTEGER NOT NULL,
  total_invoice NUMERIC(10,2) NOT NULL,
  total_broker_fees NUMERIC(10,2) NOT NULL,
  driver_earnings NUMERIC(10,2) NOT NULL,
  company_earnings NUMERIC(10,2) NOT NULL,
  expenses_total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loads table
CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  load_id TEXT NOT NULL,
  customer TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  broker_fee NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_loads_trip_id ON loads(trip_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for drivers
CREATE POLICY "Users can view their own drivers"
  ON drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create drivers"
  ON drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drivers"
  ON drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drivers"
  ON drivers FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for trips
CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS Policies for loads
CREATE POLICY "Users can view loads from their trips"
  ON loads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = loads.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can create loads"
  ON loads FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = loads.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update loads from their trips"
  ON loads FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = loads.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete loads from their trips"
  ON loads FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = loads.trip_id AND trips.user_id = auth.uid()
  ));

-- Create RLS Policies for expenses
CREATE POLICY "Users can view expenses from their trips"
  ON expenses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update expenses from their trips"
  ON expenses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete expenses from their trips"
  ON expenses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM trips WHERE trips.id = expenses.trip_id AND trips.user_id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
