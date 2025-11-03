# 🌌 Life OS

Your all-in-one life management platform with a beautiful galaxy-themed interface. Organize tasks, track progress, and reward yourself with magical energy dust.

## ✨ Features

- ✅ **Task Management** - Create, edit, delete, and track tasks
- 🎯 **Priority System** - Low, medium, high priority tasks
- 📊 **Status Workflow** - Not Started → In Motion → Focusing → Done
- ✨ **Dust/Reservoir System** - Earn magical dust by completing tasks
- 📈 **Stats Dashboard** - Track your productivity
- 💾 **Data Persistence** - LocalStorage or Supabase
- 🔐 **User Authentication** - Secure multi-user support
- 🌌 **Galaxy Theme** - Beautiful, modern, ADHD-friendly design

## 🚀 Quick Start

### Local Development (No Auth Required)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:5173
   ```

Your data saves to localStorage automatically!

---

### Full Setup with Authentication (15 minutes)

See **[STEP_BY_STEP_DEPLOYMENT.md](./STEP_BY_STEP_DEPLOYMENT.md)** for complete instructions.

**Quick version:**
1. Create Supabase account & project
2. Run `supabase/schema.sql` in Supabase SQL Editor
3. Create `.env.local` with your Supabase keys
4. Test locally: `npm run dev`
5. Deploy to Vercel (free)

---

## 📖 Documentation

- **[STEP_BY_STEP_DEPLOYMENT.md](./STEP_BY_STEP_DEPLOYMENT.md)** - Complete deployment guide
- **[QUICK_CHECKLIST.md](./QUICK_CHECKLIST.md)** - 15-minute deployment checklist
- **[HOSTING_GUIDE.md](./HOSTING_GUIDE.md)** - Hosting options & details
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment platforms
- **[FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md)** - Future features & roadmap

---

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Framer Motion** - Animations
- **Vite** - Build tool
- **Supabase** - Backend, auth, database (optional)
- **LocalStorage** - Local data persistence (fallback)

---

## 📁 Project Structure

```
Life/
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication components
│   │   ├── TaskItem.jsx
│   │   ├── TaskList.jsx
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   └── AuthContext.jsx
│   ├── hooks/           # Custom hooks
│   │   └── useLocalStorage.js
│   ├── lib/             # Library configurations
│   │   └── supabase.js
│   ├── utils/           # Utility functions
│   │   └── migration.js
│   ├── App.jsx          # Main app component
│   └── App.css          # Styles
├── supabase/
│   └── schema.sql       # Database schema
├── .env.local           # Environment variables (create this)
└── package.json
```

---

## 🔧 Environment Variables

Create `.env.local` (not committed to Git):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Without these:** App works in localStorage mode (no auth)

---

## 🎨 Customization

The app uses CSS variables for theming. Edit `src/App.css` to customize:
- Colors (galaxy theme palette)
- Animations
- Layout
- Typography

---

## 📦 Build for Production

```bash
npm run build
```

Output in `dist/` folder - ready to deploy!

---

## 🌐 Deployment

### Vercel (Recommended - Free)
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy automatically!

### Netlify (Alternative)
1. Push to GitHub
2. Import to Netlify
3. Configure build: `npm run build`
4. Add environment variables

### GitHub Pages
1. Install `gh-pages`: `npm install --save-dev gh-pages`
2. Add deploy script to `package.json`
3. Run: `npm run deploy`

---

## 🤝 Contributing

This is a personal project, but suggestions welcome!

## 📄 License

MIT License - Feel free to use for your own projects!

---

## 💡 Tips

- **First time?** Use localStorage mode first (no setup needed)
- **Want multi-device sync?** Set up Supabase (15 min)
- **Deploying?** Vercel is fastest and easiest
- **Custom domain?** Free with Vercel

---

**Built with ❤️ and ✨ magic**
