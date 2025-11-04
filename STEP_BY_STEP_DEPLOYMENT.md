# 🚀 Step-by-Step: Get Life OS Online

## 📋 Prerequisites Checklist
- [ ] Node.js installed (v18+) - Check: `node --version`
- [ ] npm installed - Check: `npm --version`
- [ ] Git installed - Check: `git --version`
- [ ] GitHub account (free)
- [ ] Email address

---

## 🎯 Part 1: Set Up Supabase (Database & Auth)

### Step 1: Create Supabase Account
1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with:
   - GitHub (recommended - fastest)
   - OR Email + Password
4. Verify your email if needed

### Step 2: Create New Project
1. In Supabase dashboard, click **"+ New Project"**
2. Fill in:
   - **Name:** `life-os` (or any name you like)
   - **Database Password:** 
     - Create a STRONG password (save it in password manager!) KDawg1341!!!!!!!
     - Must be at least 8 characters
     - Example: `MySecurePass123!@#`
   - **Region:** Choose closest to you (affects speed)
     - US East, US West, EU West, etc.
   - **Pricing Plan:** Free (select this)
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for setup to complete

### Step 3: Get Your API Keys
1. Once project is ready, click **⚙️ Settings** (gear icon, bottom left)
2. Click **"API"** in the left sidebar
3. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. **Copy both** - you'll need them in Step 5!

### Step 4: Set Up Database Schema
1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"+ New query"**
3. Open the file: `supabase/schema.sql` in your project
4. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **"Run"** (green button, bottom right)
7. Wait for success message: ✅ "Success. No rows returned"

**You should see:** Tables created (profiles, tasks, projects, user_settings)

---

## 🎯 Part 2: Configure Your Local Project

### Step 5: Install Dependencies
Open terminal in your project folder and run:
```bash
npm install
```

This installs:
- React dependencies
- Framer Motion (animations)
- Supabase client library

### Step 6: Create Environment File
1. In your project root (`C:\Users\keega\Desktop\Life`), create a new file named:
   ```
   .env.local
   ```
   
   ⚠️ **Important:** The file name starts with a dot!

2. Open `.env.local` in a text editor

3. Paste this (replace with YOUR values from Step 3):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Replace:
   - `your-project-id` with your actual project URL
   - The long `eyJ...` string with your actual anon key

5. **Save the file**

### Step 7: Test Locally
1. In terminal, run:
   ```bash
   npm run dev
   ```

2. Wait for: `Local: http://localhost:5173`

3. Open browser to: **http://localhost:5173**

4. You should see:
   - ✅ Login/Sign Up screen (if Supabase is configured)
   - OR your app (if localStorage mode)

5. **Test sign up:**
   - Click "Create account"
   - Enter email (use real email for verification)
   - Enter password (6+ characters)
   - Click "Create Account"
   - Check email for verification link (if enabled)
   - Sign in and test creating tasks

6. **Verify it works:**
   - Create a task
   - Refresh page
   - Task should still be there! 🎉

---

## 🎯 Part 3: Deploy to the Web (Vercel)

### Step 8: Push Code to GitHub
1. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Repository name: `life-os` (or your choice)
   - Make it **Public** or **Private** (your choice)
   - **Don't** initialize with README (you already have files)
   - Click **"Create repository"**

2. **Push Your Code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Life OS"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/life-os.git
   git push -u origin main
   ```
   
   Replace `YOUR-USERNAME` with your GitHub username!

### Step 9: Deploy to Vercel
1. Go to **https://vercel.com**
2. Click **"Sign Up"** → Sign up with GitHub (easiest)
3. Click **"Add New..."** → **"Project"**
4. **Import your GitHub repository:**
   - Find your `life-os` repo
   - Click **"Import"**

5. **Configure Project:**
   - Framework Preset: **Vite** (auto-detected)
   - Root Directory: **`./`** (default)
   - Build Command: **`npm run build`** (auto-filled)
   - Output Directory: **`dist`** (auto-filled)

6. **Add Environment Variables:**
   - Click **"Environment Variables"**
   - Add these **TWO** variables:
   
     **Variable 1:**
     - Name: `VITE_SUPABASE_URL`
     - Value: `https://your-project-id.supabase.co` (from Step 3)
   
     **Variable 2:**
     - Name: `VITE_SUPABASE_ANON_KEY`
     - Value: `eyJ...` (your anon key from Step 3)
   
   - Click **"Save"** for each

7. **Deploy!**
   - Click **"Deploy"**
   - ⏳ Wait 2-3 minutes for build

8. **Get Your Live URL!**
   - Vercel gives you a URL like: `life-os.vercel.app`
   - Click it to see your live site! 🚀

---

## 🎯 Part 4: Configure Supabase for Production

### Step 10: Update Supabase Redirect URLs
1. Go back to **Supabase Dashboard**
2. Click **⚙️ Settings** → **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   - `https://your-vercel-url.vercel.app/**`
   - `https://your-vercel-url.vercel.app`
   - (Replace with your actual Vercel URL)
4. Click **"Save"**

### Step 11: (Optional) Add Custom Domain
1. In **Vercel Dashboard** → Your Project → **"Settings"** → **"Domains"**
2. Enter your domain (e.g., `lifeos.example.com`)
3. Follow DNS instructions
4. Update Supabase redirect URLs with your custom domain

---

## ✅ Verification Checklist

### Before Deploying:
- [ ] Supabase project created
- [ ] Database schema run successfully
- [ ] `.env.local` file created with correct keys
- [ ] `npm install` completed
- [ ] Local test works (`npm run dev`)
- [ ] Can sign up and create tasks locally
- [ ] Code pushed to GitHub

### After Deploying:
- [ ] Vercel deployment successful
- [ ] Environment variables added in Vercel
- [ ] Live site loads
- [ ] Can sign up on live site
- [ ] Tasks persist on refresh
- [ ] Supabase redirect URLs configured

---

## 🐛 Troubleshooting

### "Supabase credentials not found"
- ✅ Check `.env.local` exists
- ✅ Check variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Restart dev server after creating `.env.local`
- ✅ In Vercel: Check environment variables are set

### "Invalid API key"
- ✅ Double-check you copied the **anon public** key (not service_role)
- ✅ Make sure there are no extra spaces
- ✅ Key should start with `eyJ`

### "Table doesn't exist"
- ✅ Go to Supabase → SQL Editor
- ✅ Re-run `supabase/schema.sql`
- ✅ Check for error messages

### "Can't sign up"
- ✅ Check Supabase → Authentication → Settings
- ✅ Email provider should be enabled
- ✅ Check email spam folder for verification

### "Tasks not saving"
- ✅ Check browser console for errors (F12)
- ✅ Verify Supabase project is active
- ✅ Check Supabase → Database → Tables to see if data is there

### Build fails on Vercel
- ✅ Check build logs in Vercel
- ✅ Make sure all dependencies are in `package.json`
- ✅ Check for TypeScript/ESLint errors
- ✅ Verify environment variables are set

---

## 🎉 You're Live!

Once deployed, you'll have:
- ✅ **Free hosted website** (Vercel)
- ✅ **Free database** (Supabase free tier)
- ✅ **User authentication**
- ✅ **Data syncing across devices**
- ✅ **HTTPS/SSL** (automatic)
- ✅ **Custom domain** (optional)

## 📱 Share Your Site

Your Life OS is now accessible at:
- **Vercel URL:** `https://your-project.vercel.app`
- **Or custom domain:** `https://yourdomain.com`

Share it with friends, family, or use it yourself across all devices!

---

## 🔄 Updates & Deployments

**Every time you push to GitHub:**
- Vercel automatically rebuilds and deploys
- Your site updates in ~2 minutes
- Preview deployments created for every branch/PR

**No manual deployment needed!** 🎊

