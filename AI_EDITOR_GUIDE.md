# AI Editor Operating Guide

Welcome! Before you start editing Life OS, please follow these guardrails so every AI contributor works from the same playbook.

## Prep Work
- Read `README.md` to understand the project goals, setup, and coding conventions.
- Read `FEATURES_ROADMAP.md` so you know which features are complete, in-flight, or pending.

## Updating the Roadmap
- When you fully deliver a roadmap item, update its line in `FEATURES_ROADMAP.md` with a ✅ checkmark.
- Only mark items as complete after the feature is implemented, tested, and merged (or otherwise shipped).
- If progress is partial, leave the roadmap line as-is; use your summary or commit message to note what remains.

## Communication
- Reference roadmap IDs (for example, `1.1.2.1`) in your summaries so others can trace the work.
- Mention any roadmap updates you made, plus follow-up work that still needs attention.

## Coding Consistency
- Follow the formatting, commenting, and architectural conventions spelled out in `README.md`.
- When uncertain about naming or structure, look at existing patterns in the repository before inventing new ones.

## Deployment & Web Build
- **CRITICAL**: After making any changes, ALWAYS commit and push to GitHub so Vercel can auto-deploy
- Run `git add .`, `git commit -m "description"`, and `git push origin main` after every change
- The local dev version (`npm run dev`) is NOT the same as the deployed website
- Changes must be pushed to GitHub for Vercel to build and deploy them
- Check Vercel dashboard after pushing to ensure deployment succeeded

## UI/UX Consistency
- **NO plain black and white text boxes or dropdowns** - All inputs must match the galaxy theme
- Use existing component classes: `secondary-button`, `project-select`, `tag-pref-field`, etc.
- All form inputs should have:
  - Dark backgrounds (`rgba(10, 8, 26, 0.92)` or similar)
  - Colored borders (`rgba(82, 82, 105, 0.45)` or similar)
  - Theme-appropriate colors (blues, purples, not plain black/white)
  - Proper contrast with the dark background
- Text should be light colored (`#f7f6ff`, `rgba(228, 225, 255, 0.9)`, etc.)
- When adding new components, check `App.css` for existing patterns first
- Responsive layouts: Use CSS Grid or Flexbox with proper wrapping
- Tag lists should stack properly and be responsive to container width

Thanks for keeping the documentation and roadmap accurate for the next editor!
