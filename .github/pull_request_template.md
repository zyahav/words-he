# Pull Request

## Summary
- What does this change do? Why?

## Type
- [ ] Feature
- [ ] Fix
- [ ] Docs/Chore

## Target environment
- [ ] Staging (feature → staging)
- [ ] Production (staging → main)
- [ ] Hotfix (hotfix/* → main)

## Preview links
- Branch Preview URL (from Vercel):
- Staging page(s) to verify (if targeting staging):
  - https://words-he-staging.vercel.app/
  - https://words-he-staging.vercel.app/hebrew-words-stt.html?debug=on&debugHttp=https://mobile-logs.zurielyahav.com/log

## Test plan
- Steps performed
- Browsers/devices tested (esp. Android Chrome)
- Expected vs actual results

## Risk and rollout
- Risk level: Low / Medium / High
- Rollout plan: deploy to staging, verify, then promote
- Rollback plan: `git revert <sha>` and redeploy

## Checklist
- [ ] Preview deployment validated (Vercel)
- [ ] No always-on debug scripts (use `?debug=on` / `?debugHttp=...`)
- [ ] Hebrew STT tested on Android Chrome (if applicable)
- [ ] README/Docs updated if behavior/flows changed
- [ ] For prod PRs: staging is green and validated

## Additional notes
- Links, screenshots, or logs as needed

