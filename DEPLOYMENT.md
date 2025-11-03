# Life OS - Deployment Guide

## 🚀 Quick Start: Deploy to Production

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up (free)
   - Create new project

2. **Get API Keys**
   - Project Settings → API
   - Copy `Project URL` and `anon public` key

3. **Run Database Schema**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste contents of `supabase/schema.sql`
   - Click "Run"

4. **Configure Authentication**
   - Authentication → Settings
   - Enable "Email" provider
   - Configure email templates (optional)

### Step 3: Configure Environment Variables

Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ Important:** Add `.env.local` to `.gitignore` (never commit secrets!)

### Step 4: Test Locally

```bash
npm run dev
```

Visit http://localhost:5173 and test:
- Sign up flow
- Login flow
- Task creation
- Data persistence

### Step 5: Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Sign up/login
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - In Vercel project settings
   - Go to "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Redeploy

4. **Deploy!**
   - Vercel auto-deploys on every push
   - Get your live URL instantly

### Step 6: Optional - Custom Domain

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## 🎯 Alternative Deployment Options

### Netlify

1. Push code to GitHub
2. Go to https://netlify.com
3. Import repository
4. Add environment variables
5. Deploy

### GitHub Pages

1. Update `vite.config.js`:
   ```js
   export default {
     base: '/your-repo-name/'
   }
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

---

## 🔒 Security Checklist

- [ ] Environment variables set (never in code)
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] CORS configured in Supabase
- [ ] Email verification enabled (optional but recommended)
- [ ] Strong password requirements
- [ ] Rate limiting on auth endpoints

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)
- Automatic page views
- Performance metrics
- Real-time data

### Supabase Dashboard
- Monitor database usage
- Check auth logs
- View API usage

---

## 🔄 CI/CD Setup

Vercel automatically:
- Deploys on every push to main
- Creates preview deployments for PRs
- Runs builds automatically

No additional setup needed!

---

## 🐛 Troubleshooting

### "Supabase not configured" error
- Check `.env.local` exists
- Verify variable names are correct
- Restart dev server after adding env vars

### Build fails
- Check all dependencies installed
- Verify Node version (18+)
- Check for TypeScript errors

### Auth not working
- Verify Supabase project is active
- Check API keys are correct
- Verify email provider is enabled
- Check browser console for errors

---

## 🎉 You're Live!

Once deployed, your Life OS will be:
- ✅ Accessible from anywhere
- ✅ Synced across devices
- ✅ Secured with authentication
- ✅ Backed up in Supabase

Share your URL and start managing your life! 🚀

