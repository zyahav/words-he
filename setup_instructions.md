# 🛠️ Project Setup Instructions

This file (`setup.md`) explains how the agent should run the setup.

---

## Step 1. Run the Script
The agent should execute the setup script:
```bash
./setup.sh
```

---

## Step 2. Provide User Inputs (if requested)
The script may ask the user for:
- Repository name (e.g., `words-he`)
- Visibility (`public` or `private`)

The agent should pass these inputs once and let the script continue.

---

## Step 3. Verify Results
After running the script, the agent must check that:
- `.bmad-setup.json` was created
- The GitHub repository exists
- BMAD was installed
- Everything was pushed successfully

---

✅ With this flow:
- `setup.md` documents what needs to happen.
- `setup.sh` automates the commands.
- `.bmad-setup.json` saves the project state for all future sessions.