# Supabase CLI Setup Guide

This guide walks you through setting up your Supabase database using the CLI.

## Prerequisites

✅ Supabase CLI is already installed
✅ Your Supabase project is created (aqasfdwjzbxcfyirdgrx)
✅ Environment variables are configured in .env.local

## Step 1: Get Your Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Give it a name: `CLI Access`
4. Copy the token (you'll only see it once!)

## Step 2: Login to Supabase CLI

Run this command with your token:

```bash
supabase login --token YOUR_ACCESS_TOKEN_HERE
```

## Step 3: Link Your Project

```bash
supabase link --project-ref aqasfdwjzbxcfyirdgrx
```

You'll be prompted to enter your database password. This is the password you created when you first set up your Supabase project.

## Step 4: Push the Database Migration

This will create all tables, indexes, RLS policies, and triggers:

```bash
supabase db push
```

This will execute the migration file at: `supabase/migrations/20241124_initial_schema.sql`

You should see output like:
```
Applying migration 20241124_initial_schema.sql...
Finished supabase db push.
```

## Step 5: Verify Tables Were Created

Check that all tables are created:

```bash
supabase db diff --schema public
```

This should show no differences (meaning your local schema matches the remote).

## Step 6: Create Storage Bucket

Unfortunately, storage buckets can't be created via migration SQL. You'll need to do this via the web UI:

1. Go to https://supabase.com/dashboard/project/aqasfdwjzbxcfyirdgrx/storage/buckets
2. Click **Create a new bucket**
3. Name: `trip-files`
4. Make it **Public**
5. Click **Create bucket**
6. Go to **Policies** tab
7. Add these two policies:

**Upload Policy:**
- Policy name: `Users can upload trip files`
- Target roles: `authenticated`
- Policy command: `INSERT`
- USING expression: `true`

**Read Policy:**
- Policy name: `Users can view trip files`
- Target roles: `authenticated`
- Policy command: `SELECT`
- USING expression: `true`

## Step 7: Create Your User Account

1. Go to https://supabase.com/dashboard/project/aqasfdwjzbxcfyirdgrx/auth/users
2. Click **Add user** → **Create new user**
3. Enter your email and password
4. ✅ Check **Auto Confirm User**
5. Click **Create user**

## Step 8: Test Your Setup

Start the dev server (if not already running):

```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. You should be redirected to /login
3. Login with the email/password you created in Step 7
4. You should see the dashboard (empty at first)

## Alternative: Web UI Setup (No CLI)

If you prefer not to use the CLI, you can set everything up via the Supabase web interface:

### Create Tables via SQL Editor:

1. Go to https://supabase.com/dashboard/project/aqasfdwjzbxcfyirdgrx/sql/new
2. Copy the entire contents of `supabase/migrations/20241124_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click **Run**

Then follow Steps 6-8 above for storage bucket and user creation.

## Troubleshooting

### "Access token not provided"
Make sure you ran `supabase login --token YOUR_TOKEN` first.

### "Database password incorrect"
When linking the project, you need the database password from when you created the Supabase project (not your account password).

### "Migration already applied"
If you've already run the migration via the web UI, you can skip Step 4.

### Can't login to the app
- Verify you created a user in Step 7
- Make sure "Auto Confirm User" was checked
- Check that your .env.local file has the correct credentials

## Next Steps

Once setup is complete:
1. Add your first driver
2. Upload a trip file
3. Generate payment statements
4. Enjoy! 🎉
