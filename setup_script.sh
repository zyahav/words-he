#!/usr/bin/env bash
set -euo pipefail

# --- 0. Collect Inputs ---
echo "Enter repository name:" 
read REPO_NAME

echo "Should the repo be public or private? (public/private):"
read VISIBILITY

# Verify GitHub CLI authentication
echo "Checking GitHub authentication..."
if ! gh auth status > /dev/null 2>&1; then
  echo "Not logged in. Running gh auth login..."
  gh auth login
fi

# --- Save inputs to .bmad-setup.json ---
cat > .bmad-setup.json <<EOL
{
  "repo_name": "$REPO_NAME",
  "visibility": "$VISIBILITY",
  "auth": "ok",
  "git": {
    "remote": "origin",
    "branch": "main",
    "tool": "gh"
  },
  "bmad": {
    "installed": false,
    "version": null,
    "packs": [],
    "prd_sharded": null
  }
}
EOL

# --- 1. Check Git ---
if ! git --version > /dev/null 2>&1; then
  brew install git
fi

# --- 2. Check GitHub CLI ---
if ! gh --version > /dev/null 2>&1; then
  brew install gh
fi

# --- 3. Initialize Local Repo ---
git init
git add .
git commit -m "Initial commit"

# --- 4. Create GitHub Repo ---
gh repo create "$REPO_NAME" --$VISIBILITY --source=. --remote=origin --push

# --- 5. Install BMAD (interactive) ---
echo "Starting BMAD installer now. Please complete the interactive prompts in this terminal."
echo "Tip: Use SPACE to select options, arrow keys to navigate, and ENTER to confirm."
npx bmad-method install

# Give the human a chance to finish any follow-up steps before continuing
read -p "If the BMAD installer opened additional prompts, ensure they're complete. Press Enter to continue..." _

# --- 6. Verify BMAD installation and update state ---
BMAD_CORE_DIR=".bmad-core"
if [ -d "$BMAD_CORE_DIR" ]; then
  BMAD_INSTALLED=true
else
  BMAD_INSTALLED=false
fi

# Try to retrieve BMAD version (best-effort)
BMAD_VERSION=$(npx --yes bmad-method --version 2>/dev/null || echo "unknown")

# Persist state
cat > .bmad-setup.json <<EOL
{
  "repo_name": "$REPO_NAME",
  "visibility": "$VISIBILITY",
  "auth": "ok",
  "git": {
    "remote": "origin",
    "branch": "main",
    "tool": "gh"
  },
  "bmad": {
    "installed": $BMAD_INSTALLED,
    "version": "$BMAD_VERSION",
    "packs": [],
    "prd_sharded": null
  }
}
EOL

# --- 7. Push Changes ---
git add .
git commit -m "Setup BMAD"
git push

echo "✅ Setup complete. Repo $REPO_NAME is initialized with BMAD and pushed."
