# ⚡ Quick Deployment Checklist

## 15-Minute Deployment Path

### ✅ Supabase Setup (5 min)
```
□ Create account at supabase.com
□ Create new project → Name: "life-os"
□ Save database password!
□ Copy Project URL and anon key
□ Run schema.sql in SQL Editor
```

### ✅ Local Setup (3 min)
```
□ Run: npm install
□ Create .env.local file
□ Paste your Supabase keys
□ Run: npm run dev
□ Test: Sign up + create task
```

### ✅ GitHub Push (2 min)
```
□ Create new repo on GitHub
□ git init
□ git add .
□ git commit -m "Initial commit"
□ git remote add origin [your-repo-url]
□ git push -u origin main
```

### ✅ Vercel Deploy (5 min)
```
□ Go to vercel.com → Sign up with GitHub
□ Import your repository
□ Add environment variables:
   • VITE_SUPABASE_URL
   • VITE_SUPABASE_ANON_KEY
□ Click Deploy
□ Wait 2 minutes
□ Get your live URL! 🎉
```

## 🔑 Key Files You Need

1. **`.env.local`** (create this!)
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

2. **`supabase/schema.sql`** (run in Supabase SQL Editor)

## 🌐 Your Live URLs Will Be:

- **Vercel:** `https://your-project.vercel.app`
- **Supabase Dashboard:** `https://app.supabase.com/project/your-project`

## ⏱️ Time Breakdown

- Supabase setup: 5 minutes
- Local testing: 3 minutes  
- GitHub push: 2 minutes
- Vercel deploy: 5 minutes
- **Total: ~15 minutes** ⚡

---

**Detailed instructions:** See `STEP_BY_STEP_DEPLOYMENT.md`

