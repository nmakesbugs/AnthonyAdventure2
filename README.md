# Anthony & Merlin: The Adventure Gets Weird

A policy RPG. A dog showed up. Nobody knows how.

---

## What This Is

After Anthony survived the FDA RFI, he thought the hard part was over. Then Bernie Sanders summoned him to DC. Then Merlin stowed away in his suitcase. Nobody fully understands the sequence of events that followed.

**Featuring:**
- A fake sequel intro that glitches into the real game
- CRT green aesthetic that gets invaded by warm dog chaos
- 10 scenes: dialogue RPG, routing puzzle, beat-em-up, CIA operative showdown, DDR Senate authentication
- The cheetah jacket. Always the cheetah jacket.

Built for Anthony, Cyndie, and Tanisha. Nick's fault.

---

## Deploy to GitHub Pages

1. Create a new GitHub repository (public)
2. Push these files to the `main` branch:
   ```
   index.html
   game.js
   style.css
   manifest.json
   README.md
   .gitignore
   ```
3. Go to **Settings → Pages → Branch: main → / (root) → Save**
4. GitHub Pages URL will be: `https://yourusername.github.io/repo-name/`

That's it. No build step, no npm, no config. Static files only.

---

## Install as Phone App (PWA)

On Android: open the GitHub Pages URL in Chrome → three-dot menu → **Add to Home Screen**

On iPhone: open in Safari → Share → **Add to Home Screen**

---

## Run Playwright Tests Locally

```bash
npm install
npm install @playwright/test
npx playwright install chromium
npx playwright test --config tests/playwright.config.js
```

Update `baseURL` in `tests/playwright.config.js` to match wherever you're serving the files from.

---

## File Structure

```
index.html      ← Fake Anthony intro + Phaser shell + DOM UI overlays
game.js         ← All 10 Phaser scenes + game logic (1,527 lines)
style.css       ← CRT aesthetic + warm chaos aesthetic + all scene UI
manifest.json   ← PWA install metadata
```

---

*v0.1 — June 2026*
