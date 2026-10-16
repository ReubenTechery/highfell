# Collection log overhaul (proposal, not decided)

The plan, with before and after screenshots and live mockups:
https://claude.ai/artifact/XFThgbYjDo9y1X27NMnkY2

Nothing here is in the game. These are the tools behind the proposal, kept so the work isn't lost if the
owner says go:

| File | What it does |
| --- | --- |
| `mannequins.py` | Draft art: the four Barrow sets on wardrobe stands, drawn with the helpers in `tools/art_sprites.py`. Each piece is its own layer, so a missing piece can be drawn as a dashed ghost. Writes `shots/log-proposal/mannequins.json` and a check sheet. Not game art yet: real stands go through the loop in `docs/art.md`. |
| `build_mockups.py` | The mockup pages, built from `art/*.json` and the stands. Writes `shots/log-proposal/mock/*.html`. Run `mannequins.py` first. |
| `capture.py` | Seeds saves at 0, 6, 16 and 17 of 17 (and Heroic) and screenshots every log page, the item sheet, the Dungeons sheet's log and the chest, on a phone and a desktop. Run `npm run build` first. Useful for checking each rollout step. |

```bash
python3 docs/proposals/collection-log/mannequins.py
python3 docs/proposals/collection-log/build_mockups.py
npm run build && python3 docs/proposals/collection-log/capture.py
```
