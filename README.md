# 🌌 Life OS
3 The app can run completely offline with local storage, or sync securely across devices through Supabase authentication and Postgres.

---

## ☄️ Where We Are Right Now

- **Foundation (0.1.x)** is complete: rich task CRUD, multi-status workflow (Not Started → Started → Focusing → Done), dust rewards, animated reservoir, statistics dashboard, completed-task archive, and local persistence.  
- **Phase 1 – Task Organization (1.1.x)** is in motion:
  - Tags are fully live (1.1.1.2–1.1.1.9 checked): color-coded chips, multiple tags per task, filtering, stats, automation, and hierarchies.  
  - A dedicated **Tag Settings** page lets you craft palettes, icons, parents, and automations without cluttering the main board.  
  - **Milestone priority** tasks now grant 50 dust and glow appropriately.  
  - **Project/Workspace infrastructure (1.1.2)** is scaffolding: Supabase schema supports nested projects, dust goals, milestones, and metadata. UI components (`ProjectFilter`, `ProjectSummary`, `ProjectDashboard`) are being built out next, with local fallbacks and Supabase syncing hooks already wired.
- **Design language** is intentionally cosmic: pitch-black void, subtle starfield, animated particle drift, gemstone buttons, and immersive motion via Framer Motion.

See the living roadmap in [`FEATURES_ROADMAP.md`](./FEATURES_ROADMAP.md) for granular numbering (e.g., 1.1.1.4 Tag filtering and grouping).

---

## 🪐 Core Systems & Experience

### Task Flow
- Status buttons cycle through the mission arc; task cards pulse and glow depending on state.  
- Tasks capture title, description, priority, tags, and project assignment (UI for project selection is landing with the new dashboard).  
- Inline editing keeps focus on the current card, while destructive actions are animated to feel intentional.  
- Tag-based automations (configured in Tag Settings) can auto-assign priority or status when certain tags are applied.

### Dust Economy & Reservoir
- Completing tasks triggers `TaskDustTransformation` particles flying toward the `RewardReservoir`.  
- Dust rewards scale by priority (`low` 5 → `milestone` 50).  
- The orb fills from the bottom with a blue-yellow liquid blend; hitting 100 shows a celebratory modal and calls `onFull`, allowing manual reward resets.

### Tags Nebula
- Tags can carry color, icon, parent, and automation.  
- `TagFilter` enables chip-based filtering and optional grouping in the task list; selections respect tag hierarchies.  
- `TagStats` surfaces top tags, completion rates, and quick context inside Mission Control.  
- `TagSettings` (in `src/pages/TagSettings.jsx`) hosts the dedicated UI for curating tags without overwhelming the main board.

### Projects & Workspaces (1.1.2 Track)
- Supabase schema now includes nested projects, dust goals, metadata, and milestone scaffolding.  
- Local storage mirrors `projects`, `projectMeta`, and future `projectTemplates` for offline continuity.  
- `ProjectFilter` (new component) introduces tree-aware project chips, progress indicators, and group toggles.  
- `ProjectSummary` previews project health, dust goals, phases, and dependencies (UI shipping alongside the dashboard).  
- Upcoming work: full CRUD Project Dashboard, Supabase syncing, per-project dust goals, and health indicators to close roadmap 1.1.2.2–1.1.2.9.

### Mission Control & Insights
- Stats section highlights active task counts, completion rate, energy, and focus queue.  
- Insights panel summarizes status distribution, reservoir charge, focus queue, and tag analytics.  
- Completed tasks live in a separate modal page for archive browsing.

### Authentication & Persistence
- `AuthContext` checks whether Supabase environment variables are present.  
- Without credentials, Life OS runs in local-only mode (no auth prompts).  
- With Supabase configured, users can sign up/sign in/out and sync tasks, projects, and user preferences (including tag styles).  
- `migrateLocalStorageToSupabase` offers a one-time import prompt so long-time local users can upgrade without losing history.

### Visual & Interaction Design
- `App.css` drives the galaxy theme using CSS custom properties; backgrounds are pitch black with white star specks, per the latest design request.  
- Button hovers, modal entrances, and reservoir animations leverage Framer Motion.  
- Haptic-friendly touches (vibration API checks) are sprinkled in `AddTaskForm` and status changes for extra dopamine hits.

---

## 🧠 Architecture Snapshot

```
Life/
├── src/
│   ├── App.jsx           # Main shell, orchestrates contexts, filters, and layout
│   ├── App.css           # Galaxy theme, layout, bespoke component styling
│   ├── components/
│   │   ├── AddTaskForm.jsx       # Smart tag suggestions, priority creation flow, project selector
│   │   ├── TaskList.jsx / TaskItem.jsx  # Animated task cards, status transitions, tag chips
│   │   ├── RewardReservoir.jsx   # Orb animation & fill logic
│   │   ├── MagicalDust.jsx       # Particle burst on completion
│   │   ├── TagFilter.jsx / TagStats.jsx / TagPreferences.jsx
│   │   ├── ProjectFilter.jsx / ProjectSummary.jsx (new scaffolding)
│   │   └── Auth/                 # Login/signup UI and flows
│   ├── pages/
│   │   └── TagSettings.jsx       # Dedicated tag management screen
│   ├── contexts/
│   │   └── AuthContext.jsx       # Supabase-aware auth provider
│   ├── hooks/
│   │   └── useLocalStorage.js    # Serialization + Date revival helper
│   ├── lib/
│   │   └── supabase.js           # Lazy client creation + mock fallback
│   └── utils/
│       └── migration.js          # Local → Supabase data migration helper
├── supabase/
│   └── schema.sql                # Postgres schema with RLS, triggers, project metadata
├── public/                       # Static assets
└── docs (various guides):
    ├── FEATURES_ROADMAP.md
    ├── STEP_BY_STEP_DEPLOYMENT.md
    ├── HOSTING_GUIDE.md
    ├── DEPLOYMENT.md
    ├── QUICK_START.md / QUICK_CHECKLIST.md
    └── INSTALL_GIT.md, etc.
```

---

## 🚀 Getting Started

### Local Development (No Auth Required)
1. Install dependencies  
   ```bash
   npm install
   ```
2. Start the dev server  
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:5173` – everything persists automatically to `localStorage`.

### Enable Supabase Sync & Auth
1. Provision a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.  
2. Create `.env.local` (ignored by Git) with:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```
3. Restart `npm run dev`. You’ll see the auth screen. Sign up/log in to start syncing.  
4. On first login, if local data exists, the app prompts to migrate tasks/reservoir levels to Supabase.

Need deeper context? See:
- [`STEP_BY_STEP_DEPLOYMENT.md`](./STEP_BY_STEP_DEPLOYMENT.md) – full Supabase + Vercel walkthrough
- [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) – environment variables & policies explained
- [`HOSTING_GUIDE.md`](./HOSTING_GUIDE.md) – deployment comparisons
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) – summary of hosting targets

---

## 🎨 Customization

- **Theme:** Edit CSS variables in `src/App.css` to tune colors, gradients, and typography.  
- **Particles & Stars:** `background-particles` in `App.jsx` defines star density, drift speed, and color (currently white to match the pitch-black request).  
- **Reservoir Feel:** Adjust `.reservoir-liquid*` classes to tweak hue, opacity, and wave easing.  
- **Tag Chips:** Styles live under `.tag-chip` in `App.css`; tag-specific palettes are injected via `TagPreferences`.

---

## 📦 Building & Deployment

- Production build:
  ```bash
  npm run build
  ```
  Output lands in `dist/`.

- Vercel (recommended):
  1. Push to GitHub  
  2. Import repo in Vercel  
  3. Set Supabase environment variables (if syncing)  
  4. Deploy – Vercel auto-detects Vite (`npm run build`)

- Netlify / Render / GitHub Pages alternatives are documented in `HOSTING_GUIDE.md` and `DEPLOYMENT.md`.

---

## 🛰️ History & Roadmap

- **Origins:** Started as a personal “Life OS” board with magical dust rewards and a galaxy theme (0.1.x line).  
- **Tag Renaissance:** 1.1.1 delivered a full tag nebula—color codes, automations, stats, dedicated settings page, and hierarchical chips.  
- **Milestone Tasks:** Added `milestone` priority worth 50 dust to celebrate larger wins.  
- **Project Era:** Database and UI groundwork for 1.1.2.x is underway to support project dashboards, nested workspaces, milestones, dependencies, templates, and project-specific dust goals.  
- **Beyond:** Future phases (see roadmap) cover scheduling, analytics, AI-powered insights, Pomodoro, rituals, and more cosmic features.

Keep the roadmap synced: when you finish a numbered milestone in code, check it off in [`FEATURES_ROADMAP.md`](./FEATURES_ROADMAP.md) to keep the story coherent.

---

## 🤝 Contributing & Next Steps

- This is a personal productivity playground, but ideas/issues are always welcome.  
- Open tasks (near-term):
  1. Complete Project Dashboard UI + CRUD (`src/pages/ProjectDashboard.jsx` placeholder).  
  2. Wire Supabase persistence for project metadata, templates, phases, and dependencies.  
  3. Expand Mission Control with project health indicators (1.1.2.9).  
  4. Continue polishing particle colors & task hover glows to stay on-theme.

---

MIT Licensed. Built with ❤️, caffeine, and plenty of ✨. Go earn that dust. 
