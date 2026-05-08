# CheckSure

## Project Overview
Mobile clock-in/clock-out app for employees. Built with React + Firebase + LINE LIFF.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Auth**: LINE LIFF + Firebase Custom Auth
- **Database**: Cloud Firestore (named database: `db-checksure`)
- **Backend**: Firebase Cloud Functions v2 (Gen 2), Node 20
- **Region**: `asia-southeast1`
- **Hosting**: Firebase Hosting (`checksure-50842.web.app`)

## Project Structure
```
src/                    # React frontend
  screens/              # Full-page views
  components/ui/        # Shared UI components
  contexts/             # AppContext (auth, state)
  hooks/                # useNow, useGeolocation, etc.
  services/firebase.ts  # Firebase SDK + Firestore helpers
  tokens.ts             # Design tokens, themes, i18n copy
functions/src/          # Cloud Functions
  handlers/             # HTTP & Firestore triggers
  services/             # External API clients (LINE, Notion)
  admin/                # Admin REST API (Express)
  middleware/            # Auth, error handling
```

## Branch Strategy
```
main        ← production (protected, PR only)
staging     ← pre-production (protected, PR only)
develop     ← integration (default branch, PRs target here)
feat/*      ← feature branches (from develop)
fix/*       ← bug fixes (from develop)
chore/*     ← config/deps/CI (from develop)
```

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + production build
- `npm run lint` — ESLint
- `npm run docker:up` — Start emulators + dev server
- `npm run docker:down` — Stop containers

## Firebase
- **Project ID**: `checksure-50842`
- **Firestore database**: `db-checksure` (not default)
- **Emulator project**: `demo-ezpeople`

## Key Conventions
- Bilingual: Thai (`th`) and English (`en`) via `tokens.ts` COPY object
- Inline styles (no CSS-in-JS library)
- Lazy-loaded screens via `React.lazy()`
- TabBar is rendered in `App.tsx`, separated from screen content
- `position: fixed` layout for LIFF webview compatibility


Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
