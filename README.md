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

Branching and deployment flow
1) Create a feature branch from `main`
2) Open a PR into `staging` (recommended)
3) Verify on:
   - The PR Preview URL (auto-created by Vercel)
   - The `staging` branch Preview URL (persistent staging)
4) When ready, merge `staging` → `main` to deploy to Production

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



## LLM Team Development Workflow (Summary)

- Never commit directly to main
- Create a feature branch from main for each change
- Open a PR into staging; validate on the PR Preview link and on the staging URL
- After approval, merge staging → main to deploy to Production
- Keep PRs focused and small; include a short test plan in the description
- Use debug mode only when testing; do not ship debug query params in shared links

Useful links
- Staging: https://words-he-git-staging-zuriel-yahavs-projects.vercel.app
- Production: https://words-he.vercel.app

---

## Mobile Debug System (Real-time mobile logs)

Purpose
- Stream mobile console logs, errors, and touch events from the device to your Mac terminal while testing
- Works alongside Eruda (in-page mobile console) for on-device inspection

Activation (client-side)
- Enabled only in debug mode (same as Eruda)
- Load order is already wired in public/index.html; when debug is on, it loads:
  - Eruda from CDN
  - public/mobile-console-interceptor.js

Query params
- debug=on | off — enables debug mode (Eruda + interceptor)
- debugHttp=http://HOST:3001/log — HTTP endpoint for streaming logs
- debugWs=wss://HOST:3001 — optional WSS endpoint if you have a public WebSocket log server

Local Wi‑Fi workflow (no external dependencies)
1) Terminal A — start the log server (Python):
   ```bash
   python3 scripts/mobile_log_server.py 3001
   # Health: http://localhost:3001/health
   ```
2) Terminal B — serve the app locally:
   ```bash
   cd public && python3 -m http.server 5500
   ```
3) On your phone (same Wi‑Fi network), open:
   - http://[MAC_IP]:5500/?debug=on&debugHttp=http://[MAC_IP]:3001/log
   - Tip: find your Mac IP with: ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'

Vercel + public WSS workflow (optional)
- Use your public WSS server to avoid mixed-content issues on HTTPS pages
- Example: https://<preview-or-staging>/?debug=on&debugWs=wss://mobile-logs.zurielyahav.com

What gets captured
- console.log/warn/error/info
- window.onerror and unhandledrejection
- Touch events (throttled), device/viewport info

Files
- public/mobile-console-interceptor.js — client script that forwards logs
- scripts/mobile_log_server.py — simple local HTTP log collector (POST /log)

Notes
- iOS Safari does not support the Web Speech Recognition API; the debug system still works for logs and errors
- Android Chrome supports recognition; ensure the site has mic permission
- For LAN testing, HTTP is fine; for Vercel/HTTPS, prefer WSS for sockets
