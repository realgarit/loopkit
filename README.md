# Loopkit

A Claude Code plugin that runs an autonomous build loop. You write a backlog of
small features. The loop builds the next one, checks it with a second agent,
commits, and moves on.

## How it works

Two commands:

- `/loopkit:loop-init` sets up the loop in a repo. It finds your test and build commands, writes `BACKLOG.md`, `loop.config.json`, and a log, then checks the gate is green.
- `/loopkit:build-loop` runs one pass. A maker agent builds the next item. A separate checker grades it against the test and build gate. The loop commits the pass and stops.

Run it with the built in loop:

```
/loop /loopkit:build-loop
```

No interval, so it self paces until the backlog is empty or it stops for you.

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
2. Run `/loopkit:loop-init` and confirm the commands it found.
3. Fill `BACKLOG.md` with your features in build order.
4. Run `/loop /loopkit:build-loop`.

## Backlog format

```
- [ ] Save and load. Done when: reload restores the full state. Round trip unit tested.
- [ ] Draw the players. Done when: each shows on its tile. (visual)
```

Box states:

- `[ ]` not started. The loop can pick it.
- `[~]` built, waiting for review. Only `(visual)` and `(audio)` items.
- `[x]` done.

## UI repos and logic only repos

`loop-init` sets `ui` in `loop.config.json`.

- UI repo: the loop screenshots visual items, marks them `[~]`, and stops at an epic `(gate)` for review. Needs a dev server and Playwright for the screenshots.
- Logic only repo: no screenshots, no gates. Tests are the gate. Every item finishes on green.

## Rules

- The maker never commits. The loop commits only after the checker passes.
- The checker is a different agent than the maker.
- Visual and audio work is signed off by a person, not the loop.
- Two failures in a row stop the loop.

## Files it writes in a repo

- `loop.config.json`, the gate commands and the mode.
- `BACKLOG.md`, the work and the state.
- `docs/loop-log.md`, one line per pass.

## License

MIT. See [LICENSE](LICENSE).
