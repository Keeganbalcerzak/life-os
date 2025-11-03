# Life OS - Hosting & Authentication Guide

## 🚀 Quick Setup Options

### Option 1: Supabase (Recommended) ⭐
**Why:** Free tier, PostgreSQL database, built-in auth, real-time sync, easy deployment

**Features:**
- Email/password authentication
- OAuth (Google, GitHub, etc.)
- PostgreSQL database
- Real-time subscriptions
- Row-level security
- Storage for attachments
- Edge functions

**Cost:** Free tier (2 projects, 500MB database, 2GB bandwidth)

**Setup Time:** 1-2 hours

---

### Option 2: Firebase
**Why:** Google-backed, mature, great free tier

**Features:**
- Email/password auth
- OAuth providers
- Firestore database
- Real-time database
- Cloud storage
- Cloud functions

**Cost:** Free tier (generous limits)

**Setup Time:** 1-2 hours

---

### Option 3: Custom Backend
**Why:** Full control, custom logic

**Tech Stack:**
- Backend: Node.js + Express / Python + FastAPI
- Database: PostgreSQL / MongoDB
- Auth: NextAuth.js / Passport.js / JWT
- Hosting: Railway / Render / Fly.io / AWS

**Cost:** $5-20/month

**Setup Time:** 1-2 days

---

## 📋 Implementation Steps

### Phase 1: Choose Platform → Supabase (Recommended)

1. **Sign up at supabase.com**
2. **Create new project**
3. **Get API keys** (Project Settings → API)

### Phase 2: Update Code for Multi-User

1. **Install Supabase client**
2. **Add authentication UI**
3. **Migrate localStorage → Supabase database**
4. **Add user context**
5. **Implement row-level security**

### Phase 3: Deploy

1. **Deploy frontend** (Vercel/Netlify - free)
2. **Configure environment variables**
3. **Set up custom domain** (optional)

---

## 🔧 Technical Implementation

### Database Schema

```sql
-- Users table (managed by Supabase Auth)
-- profiles table (extends user data)

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  due_date TIMESTAMP,
  tags TEXT[],
  project_id UUID
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User settings (reservoir level, preferences)
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  reservoir_level INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'dark',
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row-Level Security (RLS) Policies

```sql
-- Users can only see their own tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🌐 Deployment Platforms

### Frontend Hosting (Free Options)

1. **Vercel** ⭐ (Recommended)
   - Auto-deploy from GitHub
   - Free SSL, CDN
   - Preview deployments
   - Analytics

2. **Netlify**
   - Auto-deploy from GitHub
   - Free SSL, CDN
   - Form handling
   - Functions

3. **GitHub Pages**
   - Free for public repos
   - Static site hosting
   - Custom domains

### Backend Hosting (if custom backend)

1. **Railway** ($5/month)
   - Easy deployment
   - PostgreSQL included
   - Auto-scaling

2. **Render** (Free tier available)
   - Auto-deploy from Git
   - Free PostgreSQL
   - SSL included

3. **Fly.io** (Free tier)
   - Global edge deployment
   - PostgreSQL
   - Fast cold starts

---

## 🔐 Authentication Flow

### User Journey

1. **Landing Page** → Login/Sign Up
2. **Sign Up** → Email verification (optional)
3. **Login** → Dashboard with user data
4. **Auto-login** → Check session on app load
5. **Logout** → Clear session, redirect to landing

### Security Features

- Email verification (optional but recommended)
- Password reset
- Session management
- Secure token storage
- HTTPS only
- CORS configuration

---

## 📦 Migration from localStorage

### Strategy

1. **Existing Users** (localStorage data)
   - On first login, prompt to import
   - Migrate tasks to database
   - Clear localStorage after migration

2. **New Users**
   - Start fresh with database
   - No localStorage needed

3. **Offline Support**
   - Cache in IndexedDB (not localStorage)
   - Sync when online
   - Conflict resolution

---

## 🎯 Next Steps

1. **Set up Supabase project**
2. **Create database schema**
3. **Add authentication UI**
4. **Migrate data layer**
5. **Deploy to Vercel**

Would you like me to start implementing the Supabase integration?

