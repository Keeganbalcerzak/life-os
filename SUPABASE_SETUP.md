# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Sign in
3. Click "New Project"
4. Fill in:
   - Project name: "Life OS"
   - Database password: (save this!)
   - Region: Choose closest to you
5. Wait 2-3 minutes for setup

## Step 2: Get API Keys

1. Go to Project Settings (gear icon)
2. Click "API" in sidebar
3. Copy these values:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - anon/public key (safe for client-side)
   - service_role key (keep secret, server-side only)

## Step 3: Run Database Migrations

1. In Supabase dashboard, go to SQL Editor
2. Run the schema SQL (I'll provide this)
3. Enable Row Level Security
4. Create policies

## Step 4: Configure Authentication

1. Go to Authentication → Settings
2. Enable email provider
3. Configure email templates (optional)
4. Add OAuth providers if desired (Google, GitHub, etc.)

## Step 5: Environment Variables

Create `.env.local` file:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Never commit `.env.local` to Git!**

