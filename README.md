# Loopkit

A Claude Code plugin that runs an autonomous build loop. You write a backlog of
small features. The loop builds the next one, checks it with a second agent,
commits, and moves on.

## How it works

Two commands:

- `/loopkit:loop-init` sets up the loop in a repo. It finds your test and build commands, writes `BACKLOG.md`, `loop.config.json`, and a log, then checks the gate is green.
- `/loopkit:build-loop` runs one pass. A maker agent builds the next item. A separate checker grades it against the test and build gate. The loop commits the pass and stops.

By default the loop runs in **full autonomy**: a checker agent signs off visual work and clears epic gates, a failed item parks itself (`[!]`) and the loop moves on, and it stops only when it is genuinely stuck. Set `"autonomy": "review"` in `loop.config.json` (or run `/loopkit:loop-init review`) for the stop-and-review behavior, where a human signs off visual work at epic gates and two failures in a row halt the loop.

Run it with the built in loop:

```
/loop /loopkit:build-loop
```

No interval, so it self paces until the backlog is empty or it stops on a stall.

## Install

```
/plugin marketplace add realgarit/loopkit
/plugin install loopkit@realgar-loopkit
```

Try it for one session without installing. Clone the repo, then from inside it:

```
claude --plugin-dir plugins/loopkit
```

## Use it in a repo

1. Open the repo in Claude Code.
2. Run `/loopkit:loop-init`. It detects the commands, seeds a starter `BACKLOG.md`, and sets full autonomy by default (run `/loopkit:loop-init review` for stop-and-review).
3. Edit `BACKLOG.md` to steer the work, or let the loop run with what it seeded.
4. Run `/loop /loopkit:build-loop`.

## Backlog format

```
- [ ] Save and load. Done when: reload restores the full state. Round trip unit tested.
- [ ] Draw the players. Done when: each shows on its tile. (visual)
```

Box states:

- `[ ]` not started. The loop can pick it.
- `[~]` built, waiting for review. Review mode parks `(visual)` and `(audio)` items here; full autonomy signs off and goes to `[x]`.
- `[!]` parked. A pass failed on it, so full autonomy set it aside. The loop skips it.
- `[x]` done.

## UI repos and logic only repos

`loop-init` sets `ui` in `loop.config.json`.

- UI repo: the loop screenshots visual items and reviews them at epic `(gate)` checkpoints. In full autonomy the checker agent signs them off and clears the gate; in review mode they wait as `[~]` for a human at the gate. Needs a dev server and Playwright for the screenshots.
- Logic only repo: no screenshots, no gates. Tests are the gate. Every item finishes on green.

## Rules

- The maker never commits. The loop commits only after the checker passes.
- The checker is a different agent than the maker.
- Visual and audio work is signed off by the checker agent in full autonomy, or by a person at the epic gate in review mode.
- In full autonomy a failed item parks and the loop continues, stopping only on a broad stall. In review mode two failures in a row stop the loop.

## Files it writes in a repo

- `loop.config.json`, the gate commands and the mode.
- `BACKLOG.md`, the work and the state.
- `docs/loop-log.md`, one line per pass.

## License

MIT. See [LICENSE](LICENSE).
