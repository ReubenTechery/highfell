@./AGENTS.md

# Notes for Gemini, and any model working in Antigravity

AGENTS.md above is the whole brief. These notes are about working here through Antigravity or the Gemini CLI,
whichever model you are. That includes Claude models: `CLAUDE.md` is only for Claude on claude.ai, which can
publish.

- **You can't publish the live game** (it lives on claude.ai). Show your work with `npm run preview`, which
  prints a link for this computer and one for a phone on the same Wi-Fi, and with screenshots from
  `tools/pw_check.py`.
- **Branches and pull requests only.** Work on a branch named `gemini/<topic>`, commit with plain-English
  messages, push the branch and open a pull request. Never push to `main`, never force-push. The owner merges.
- **Plan first.** For anything bigger than a small fix, write the plan (what, which files, which tests) and
  wait for the owner's yes before writing code.
- **Never weaken a test to get green.** If `npm run all` fails, fix the cause. If a balance band should move,
  ask.
- **Art:** follow `docs/art.md` to the letter. Draw with the helpers already in `tools/*.py`, then look at
  `tools/art_sheet.py` output next to existing sprites before calling it done. Never use an image generator.
- **Keep the docs true.** If you change how a system works, update `docs/design.md` in the same pull request.
  New ideas go in `docs/ideas.md`, not into the game.
