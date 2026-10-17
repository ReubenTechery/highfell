@./AGENTS.md

# Notes for every agent working on the owner's computer

AGENTS.md above is the whole brief. These notes are for any agent that can't publish the live game: Antigravity,
the Gemini CLI, Claude Code running on the owner's computer, or a Claude on another account, whichever model
you are. Only Claude on claude.ai, on the account that owns the live game, publishes (`CLAUDE.md`).

- **You can't publish the live game** (it lives on claude.ai). Show your work with `npm run preview`, which
  prints a link for this computer and one for a phone on the same Wi-Fi, and with screenshots from
  `tools/pw_check.py`. Other agents may be running at the same time: if port 5173 is taken, use
  `npm run preview -- --port 5174` (or the next free port) and give the owner the new links.
- **Start every task from the latest `main`:** `git fetch`, then make your branch from `origin/main`, so you
  build on what has already been merged. In a new worktree, run `npm ci` first.
- **Branches and pull requests only.** Work on a branch named `gemini/<topic>` (Claude models: `claude/<topic>`), commit with plain-English
  messages, push the branch and open a pull request. Never push to `main`, never force-push. The owner merges.
- **Plan first.** For anything bigger than a small fix, write the plan (what, which files, which tests) and
  wait for the owner's yes before writing code.
- **Never weaken a test to get green.** If `npm run all` fails, fix the cause. If a balance band should move,
  ask.
- **Art:** follow `docs/art.md` to the letter. Draw with the helpers already in `tools/*.py`, then look at
  `tools/art_sheet.py` output next to existing sprites before calling it done. Never use an image generator.
- **Keep the docs true.** If you change how a system works, update `docs/design.md` in the same pull request
  (and `docs/combat.md`, the combat plan, for a combat change). New ideas go in `docs/ideas.md`, not into the
  game.
