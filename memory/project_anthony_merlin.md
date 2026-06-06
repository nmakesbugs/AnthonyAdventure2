---
name: project-anthony-merlin
description: Anthony & Merlin game — architecture, key bugs fixed, design decisions
metadata:
  type: project
---

Phaser 3 / HTML mobile game. Single-file architecture: `index.html` (fake intro + DOM UI), `game.js` (all scenes), `style.css`. No build step. Playwright tests in `tests/`.

**Key design rule:** Before the hotel suitcase reveal, player must believe this is Anthony's Policy Journey Chapter Two. No Merlin visible until HotelScene._reveal(). TitleScene and early prologue maintain the sequel deception.

**Fixed in June 2026 patch:**
- Removed Merlin from TitleScene (was walking across screen)
- Removed Merlin monologue from suitcase interior (_suitcase in PrologueScene)
- Changed "9-page FDA RFI" → "20-page FDA RFI" everywhere
- Rewrote Cyndie call as tap-based DialogueManager dialogue (was broken auto-scroll)
- Fixed routing stuck bug: `#dialogue-box` z-index raised to 22 so it's above `#routing-container` (z-index 20)
- Fixed `_dmg()` and blocked-route callbacks to explicitly show routing-container after dialogue
- Fixed `_cyndie()` to use native `setTimeout` instead of Phaser `time.delayedCall` (headless rAF issue)
- Added `merlin-sit` and `bg-ending` textures (were missing, caused silent Phaser warnings)
- Exposed `window.__phaserGame` for test scene jumping
- Toned down CRT green: `0x00ff41` → `0x00bb33` in sprites, `#00ff41` → `#00cc33` in CSS

**Keep:** "DC TRAFFIC IS A THREAT TO NATIONAL SECURITY" chapter title (hilarious, user loves it)

**Why:** User QA pass surfaced 9 issues including visual polish, story coherence, routing bugs, and Cyndie call being broken.

**How to apply:** Preserve the pre-hotel CRT deception on any future scene additions. After hotel reveal, chaos/warm aesthetic can take over freely.
