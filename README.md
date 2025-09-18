# Hebrew Reading Trainer (words-he)

A small, static web app that helps practice Hebrew reading. It runs entirely in the browser using the Web Speech API, with no backend required.

## Quick Start

You only need a static file server to run the app locally (required for microphone permissions and the Web Speech API). Pick one of the options below.

### Option 1: Python built-in server (recommended)

```bash
# From repo root
python3 -m http.server 8080 --directory public
# Then open in your browser:
# http://localhost:8080
```

Alternative (from public directory):

```bash
cd public
python3 -m http.server 8080
# Then open in your browser:
# http://localhost:8080
```


### Option 2: Node.js (using `npx serve`)

```bash
# From repo root
npx serve public -l 8080
# Then open: http://localhost:8080
```

Notes:
- Use Chrome for best Web Speech API support (mic access + speech recognition).
- The site must be served over http(s). Opening `public/index.html` directly via file:// will not allow mic permissions.
- When prompted by the browser, allow microphone access.


## Modes and Debugging

### Debug mode
- Purpose: show the recognition feedback box and the "Test Hebrew Word" button for easier testing.
- Enable via URL: `?debug=on` (disable with `?debug=off`)
- Keyboard toggle: press `D` to toggle on/off without reloading
- Persistence: your choice is saved in `localStorage` under `hebrewTrainerDebug`
- URL sync: toggling with `D` updates the `debug` query param (no reload)

### Hebrew‑only mode
- Purpose: skip the English translation step. After a correct Hebrew reading, advance directly to the next Hebrew word.
- Enable via URL: `?hebrewOnly=on` or `?mode=hebrew`
- Disable via URL: `?hebrewOnly=off` (or remove the parameter)
- Note: this mode is read on page load. To change it, adjust the URL and reload the page.

### Examples
- Normal mode: `http://localhost:8080/`
- Debug only: `http://localhost:8080/?debug=on`
- Hebrew‑only: `http://localhost:8080/?hebrewOnly=on`
- Hebrew‑only + Debug: `http://localhost:8080/?hebrewOnly=on&debug=on`

## What’s in here

- `public/` – the static web app
  - `index.html` – main page
  - `styles.css` – UI styles
  - `js/` – app logic (audio, speech recognition, game flow, word list)
- `server/server.py` – a minimal sample HTTP server. Not required for normal use. If you want to use it, either:
  - run a static server as shown above, or
  - modify `DIRECTORY` in `server.py` to point to the `public` folder.

## Customize the word list

Edit `public/js/words.js` and adjust the words/levels as you like. Save and reload the page.

## BMAD

This repo is initialized with BMAD to help automate multi-agent tasks and documentation scaffolding.
- Version recorded in `.bmad-setup.json`
- BMAD core files live under `.bmad-core/` and related directories

You don’t need BMAD to run the app locally. It’s there to help with future development workflow if you want to use it.

## Troubleshooting

- Port already in use:
  - Try another port, e.g. `python3 -m http.server 8081 --directory public`
- Microphone not working:
  - Use Chrome and ensure you accessed the site via http(s) on localhost
  - Check browser mic permissions (lock icon in the address bar)
- Speech recognition accuracy:
  - Speak clearly and try a quieter environment
  - Adjust content in `public/js/words.js`

## Deployment and CI/CD (Vercel)

This repo is set up to deploy via Vercel using GitHub as the source of truth.

Environments
- Production: branch `main` → https://words-he.vercel.app
- Staging: branch `staging` → https://words-he-git-staging-zuriel-yahavs-projects.vercel.app
- PR Previews: every non-`main` branch and PR gets an automatic Preview URL

Vercel Project settings
- Framework Preset: Other
- Root Directory: public
- Build Command: (empty)
- Output Directory: (empty)
- Install Command: (empty)
- Git: Connected to GitHub repo `zyahav/words-he`
- Recommended: Add a Branch Alias under Project → Settings → Git: `staging` → branch `staging`
  - Result: a clean, stable URL like `https://words-he-staging.vercel.app` (once the alias is added in Vercel)


### Our CI/CD workflow (two-branch policy)
- Long‑lived branches: `main` (production) and `staging` (pre‑production)
- Short‑lived feature branches are used only for PR work and Vercel Preview URLs; delete them after merge
- Don’t commit directly to `main`; deploy to production via a PR/merge from `staging` after validation

#### Deployment flow (TL;DR)
1. From `main`, create a short‑lived feature branch and push (Vercel creates a Preview URL)
2. Open a PR from the feature branch into `staging`; merge when ready for broader testing
3. Validate on `staging`:
   - Staging Preview URL: the branch `staging` deployment in Vercel
   - Optional stable alias (recommended): `https://words-he-staging.vercel.app`
   - Hebrew Words STT page quick links:
     - Production: https://words-he.vercel.app/hebrew-words-stt.html?debug=on&debugHttp=https://mobile-logs.zurielyahav.com/log
     - Staging: https://words-he-git-staging-zuriel-yahavs-projects.vercel.app/hebrew-words-stt.html?debug=on&debugHttp=https://mobile-logs.zurielyahav.com/log
4. When `staging` looks good, open a PR `staging` → `main` (or merge) to deploy to production
5. Delete the feature branch (local and remote)

#### Staging and debugging notes
- Do NOT leave always‑on debug consoles in `main`/`staging`; use the built‑in debug flags instead
  - `?debug=on` to show live recognition logs/UI aids (toggle with key `D` locally)
  - `?debugHttp=https://mobile-logs.zurielyahav.com/log` to stream logs to the mobile log server
- If `staging` isn’t visible in Vercel “Active Branches”, push an empty commit to `staging` to trigger a redeploy (see below)

#### Rollbacks
- Production (`main`): `git revert <sha>` the offending commit(s) and push — Vercel redeploys automatically
- Staging: either revert the recent merge or push a corrective commit; avoid force‑push unless absolutely necessary


Create the staging branch (one-time)
```bash
git checkout main && git pull
git checkout -b staging
git push -u origin staging
```

Trigger a staging redeploy (no code changes)
```bash
git checkout staging
git commit --allow-empty -m "chore: trigger staging deployment"
git push
```

How PR Previews work
- Any push to a non-`main` branch triggers a Preview deployment with a unique URL
- Opening a GitHub PR also shows a Vercel bot comment with the Preview link
- Every new commit to the PR updates the Preview URL

Notes and tips
- This is a purely static site; no environment variables are required
- Large binary assets (e.g., many images) may benefit from Git LFS
- Optional: In GitHub, make Vercel’s “Preview Deployment — Ready” a required status check before merging

Troubleshooting
- Staging not visible in Vercel “Active Branches”: push an empty commit to `staging` (see above)
- Seeing outdated content: ensure Root Directory is `public`; you can also trigger a redeploy from the Vercel UI or push a no-op commit
- Mic/speech not working on your deploy: make sure you’re loading the site over http(s) and have granted microphone permissions in the browser



## Deployment and CI/CD (Vercel)

This repo deploys via Vercel with GitHub as source of truth.

Environments
- Production: branch `main` → https://words-he.vercel.app
- Staging: branch `staging` → will be aliased in Vercel to https://words-he-staging.vercel.app
- PR Previews: every non-`main` branch and PR gets an automatic Preview URL

Vercel Project settings
- Framework Preset: Other
- Root Directory: public
- Build Command: (empty)
- Output Directory: (empty)
- Install Command: (empty)
- Git: Connected to GitHub repo `zyahav/words-he`

### Our CI/CD workflow (two-branch policy)
- Long‑lived branches: `main` (production) and `staging` (pre‑production)
- Short‑lived feature branches are used only for PR work and Vercel Preview URLs; delete them after merge
- Don’t commit directly to `main`; deploy to production via a PR/merge from `staging` after validation

#### Deployment flow (TL;DR)
1. From `main`, create a short‑lived feature branch and push (Vercel creates a Preview URL)
2. Open a PR from the feature branch into `staging`; merge when ready for broader testing
3. Validate on `staging`:
   - Staging Preview URL: the branch `staging` deployment in Vercel
   - Stable alias (once configured): `https://words-he-staging.vercel.app`
   - Hebrew Words STT quick link: `/hebrew-words-stt.html?debug=on&debugHttp=https://mobile-logs.zurielyahav.com/log`
4. When `staging` looks good, open a PR `staging` → `main` to deploy to Production
5. Delete the feature branch (local and remote)

#### Hotfix procedure (exception path)
- If production needs an urgent fix:
  - Branch: `hotfix/<brief-name>` from `main`
  - PR: target `main` (require approval + checks)
  - After merge: production deploys automatically; then merge `main` → `staging` to keep them aligned

#### Staging sync policy (avoid drift)
- Keep `staging` either equal to `main`, or `main` + a very small number of features being validated
- After every production release (or weekly), merge `main` → `staging`
- If a feature blocks `staging`, revert it from `staging` and continue on the feature branch

#### Preview‑first testing policy
- Validate on the Vercel Preview URL of the feature branch before merging to `staging`
- Merge to `staging` only when preview looks good

#### Simplified path (trivial changes)
- For low‑risk trivial changes (docs, small styles), allow `feature` → `main` PR with preview validation and approval
- Default path for anything non‑trivial remains `feature` → `staging` → `main`

#### Staging and debugging notes
- Do NOT leave always‑on debug consoles in `main`/`staging`; use flags instead
  - `?debug=on` to show live recognition logs/UI aids
  - `?debugHttp=https://mobile-logs.zurielyahav.com/log` to stream logs to the mobile log server

#### Rollbacks
- Production (`main`): `git revert <sha>` the offending commit(s) and push — Vercel redeploys automatically
- Staging: either revert the recent merge or push a corrective commit; avoid force‑push unless absolutely necessary

#### Useful commands
Create the staging branch (one‑time)
```bash
git checkout main && git pull
git checkout -b staging
git push -u origin staging
```
Trigger a staging redeploy (no code changes)
```bash
git checkout staging
git commit --allow-empty -m "chore: trigger staging deployment"
git push
```
How PR Previews work
- Any push to a non-`main` branch triggers a Preview deployment with a unique URL
- Opening a GitHub PR also shows a Vercel bot comment with the Preview link
- Every new commit to the PR updates the Preview URL
