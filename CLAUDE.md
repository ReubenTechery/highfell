@AGENTS.md

# Notes for Claude

AGENTS.md is the whole brief: the vision, the pillars, decisions already made, the code map, the commands and
the code rules (how each system works is in `docs/design.md`). Read it first. This file only adds what Claude can do here that
other agents can't. It is only for the one Claude that can publish the live game: Claude Code on claude.ai, on
the owner's account that owns it. Any other Claude (Claude Code running on the owner's computer, a Claude on
another account, or a Claude model picked inside Antigravity) works like the other agents: follow `GEMINI.md`,
with branches named `claude/<topic>`, pull requests, and no publishing.

## Publishing (Claude only)

After `npm run all` passes and you've looked at phone and desktop screenshots:

1. Publish `dist/highfell.html` to the live game (Artifact tool, `url` = the live game below). Leave
   `capabilities` out so the declared `db` and `user` carry forward: they hold everyone's save. The music
   lives next to the page as its own files (`music/house.mp3`, `music/dungeon.mp3`, `music/boss.mp3`); a
   publish without `files` keeps them. When a loop in `audio/music/` changes, publish it with the page through
   `files` (`{"music/boss.mp3": "audio/music/boss.mp3"}`).
2. Commit with a plain-English message, then `git push origin main`. When the owner asks Claude for a
   change, pushing `main` is the standing workflow; other agents use branches and pull requests. Push `main`
   only: never `--all`, tags or stashes. The repo is public.
3. If the change matters to the design, update the Dungeon Systems doc on claude.ai **and** its copy in
   `docs/design.md` (other agents can only read the copy), and the "Where it's at" part of Start Here. A
   combat change also updates the Combat Overhaul doc and its copy in `docs/combat.md`. A stage of the duo rework
   also updates the Duo Rework doc and its copy in `docs/duo.md`.

## Work from other agents

When the owner asks, review open pull requests (`gemini/*` and `claude/*` branches) against AGENTS.md: the
pillars, the code rules, the tests and `docs/art.md`. Check them out, run `npm run all`, look at screenshots,
then merge into `main` and publish.

## On claude.ai

| What | Where |
| --- | --- |
| The live game (republish here) | https://claude.ai/artifact/LYyryT29gsopt6UPoNceVd |
| Start Here doc (index of every artifact) | https://claude.ai/artifact/CKgMqHaxJsEvyuQxFWZvP7 |
| Dungeon Systems doc (abilities, loot, achievements) | https://claude.ai/artifact/1JtG4R1SNrsTanWw8KGMhK |
| Combat Overhaul doc (the combat plan; copied to `docs/combat.md`) | https://claude.ai/code/artifact/cf174f66-e52f-4e8a-945f-287a204b089e |
| Duo Rework doc (the duo plan and its calls; copied to `docs/duo.md`) | https://claude.ai/artifact/1JHxqY3H9ikFqWZ216Qpew |
| Barrow Crypt v1 (the first test build, frozen) | https://claude.ai/artifact/PCWjjDHnK42uQb5tUUR8tU |

The design canvases (Concept, Look Book, Raid Night, Barrow King Fight) are linked from Start Here. Never put
business or venue material in the repo.
