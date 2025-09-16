# LLM Onboarding — words-he

This short guide is what you should paste or attach when starting a new chat with an LLM agent. It explains how we work on this repo and how to enable mobile debugging quickly.

## Project in 30 seconds
- A static web app (public/) to practice Hebrew reading
- Runs fully in the browser using Web Speech API (no backend)
- Deployed on Vercel (Production = main, Staging = staging)

## How we work (branch/PR flow)
- Do NOT commit directly to main
- Create a feature branch from main
- Open a PR into staging and validate on:
  - The PR Preview URL (auto from Vercel)
  - The persistent staging URL
- After approval, merge staging → main to deploy to Production

URLs
- Staging: https://words-he-git-staging-zuriel-yahavs-projects.vercel.app
- Production: https://words-he.vercel.app

## Mobile debugging (real-time logs)
- Use debug mode to enable both Eruda (in-page console) and the interceptor that streams logs
- Query params:
  - debug=on | off — turn debug mode on/off
  - debugHttp=http://HOST:3001/log — HTTP endpoint to stream logs
  - debugWs=wss://HOST:3001 — optional WSS endpoint (for HTTPS pages)

Local Wi‑Fi quick start
1) Terminal A — start local log server (no deps):
   ```bash
   python3 scripts/mobile_log_server.py 3001
   # Health: http://localhost:3001/health
   ```
2) Terminal B — serve the app:
   ```bash
   cd public && python3 -m http.server 5500
   ```
3) On your phone (same Wi‑Fi):
   - http://[MAC_IP]:5500/?debug=on&debugHttp=http://[MAC_IP]:3001/log

Vercel + public WSS (optional)
- Use a public WSS endpoint to avoid mixed content on HTTPS pages:
  - https://<preview-or-staging>/?debug=on&debugWs=wss://mobile-logs.zurielyahav.com

What’s captured
- console.log/warn/error/info, window.onerror, unhandledrejection
- Touch events (throttled), device/viewport info

## Files to know
- README.md — single source of truth for workflow + debugging details
- public/index.html — loads Eruda + mobile-console-interceptor.js only when debug is on
- public/mobile-console-interceptor.js — forwards logs to server via WS/HTTP
- scripts/mobile_log_server.py — simple local collector (POST /log)
- docs/mobile-debug-dev-team-instructions.md — deep-dive + troubleshooting

## Guardrails for agents
- Do not expose or commit secrets (.env is ignored); never print tokens in logs
- Follow the branch/PR flow; keep changes focused; include a short test plan
- Use package managers for deps, not manual edits to lockfiles
- Prefer safe verification runs (tests/linters/local builds) over risky changes

## UX and logging preferences
- Fixed game layout (image → Hebrew word → listening status → visualizer; nothing moves)
- Always log raw/interim transcripts in debug mode for speech API
- When recognition fails/mismatches, log detailed info immediately
- Home page: four icon buttons for card style selection (no dropdown)
- Hebrew-only mode is supported (skip English after correct Hebrew)

That’s it—start with README.md for details, then use the steps above to stream mobile logs while testing.

