# Supabase Setup Guide

This guide will walk you through setting up your Supabase database for the Speedy Carriers application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Speedy Carriers
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under Project URL)
   - **anon public** key (under Project API keys)
3. Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the SQL

## Step 4: Create Storage Bucket for Trip Files

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Fill in:
   - **Name**: `trip-files`
   - **Public bucket**: Check this box (so files can be accessed)
4. Click "Create bucket"

### Configure Storage Policies

1. Click on the `trip-files` bucket
2. Go to "Policies" tab
3. Click "New Policy"
4. Create the following policies:

**Allow authenticated users to upload:**
- Policy name: `Users can upload trip files`
- Policy definition:
```sql
(bucket_id = 'trip-files' AND auth.role() = 'authenticated')
```
- Allowed operations: INSERT

**Allow authenticated users to read:**
- Policy name: `Users can view their trip files`
- Policy definition:
```sql
(bucket_id = 'trip-files' AND auth.role() = 'authenticated')
```
- Allowed operations: SELECT

## Step 5: Create Your User Account

1. In Supabase dashboard, go to **Authentication** > **Users**
2. Click "Add user" > "Create new user"
3. Fill in:
   - **Email**: your email address
   - **Password**: create a secure password
   - **Auto Confirm User**: Check this box
4. Click "Create user"

## Step 6: Configure Environment Variables

1. Create a `.env.local` file in your project root if you haven't already:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the values with your actual Supabase URL and anon key from Step 2

## Step 7: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. You should be redirected to the login page
4. Log in with the email and password you created in Step 5
5. You should be redirected to the dashboard

## Step 8: Deploy to Vercel

1. Push your code to GitHub (if not already)
2. Go to [https://vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

## Troubleshooting

### Can't log in
- Make sure you created a user in Step 5
- Check that "Auto Confirm User" was checked
- Verify your environment variables are correct

### Upload fails
- Make sure you created the `trip-files` bucket in Step 4
- Check that the bucket is set to public
- Verify the storage policies are configured correctly

### Database errors
- Make sure all SQL from Step 3 was executed successfully
- Check that Row Level Security policies are enabled
- Verify your user_id matches the authenticated user

## Next Steps

1. Add your first driver
2. Upload a trip file
3. Generate statements
4. Enjoy your new driver management system!

## Support

For issues or questions, check the documentation or contact support.
