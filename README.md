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

## Deploying (optional)

Since this is a static site, you can deploy with any static hosting (e.g., GitHub Pages, Netlify, Vercel):
- Build step: none
- Publish directory: `public`

