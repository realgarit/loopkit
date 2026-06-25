# Loopkit

An autonomous build loop you can drop into any repo. You write a backlog of small
features. The loop picks the next one, builds it, checks it with a separate agent,
commits, and moves on. Visual work waits for your eyes. Logic work finishes on
green.

It is the "loop engineering" idea in a plugin: you stop hand prompting the agent
for every task and design a system that prompts it for you.

## What you get

Two commands, namespaced under the plugin:

- `/loopkit:loop-init` runs once per repo. It finds your test and build commands, asks you to confirm, writes a starter `BACKLOG.md`, a `loop.config.json`, and a loop log, then proves the gate is green.
- `/loopkit:build-loop` runs one pass: pick the next backlog item, build it with a maker agent, grade it with a separate checker, record the result, decide whether to keep going.

You run the loop by pairing the pass with the built in `/loop`:

```
/loop /loopkit:build-loop
```

No interval, so it self paces, pass after pass, until the backlog is empty or it
stops for you.

## Install

This repo is both the plugin and a small personal marketplace. In Claude Code:

```
/plugin marketplace add /Users/realgar/Git/loopkit
/plugin install loopkit@realgar-loopkit
```

To use it on another machine, push this repo to your git, then add it by URL:

```
/plugin marketplace add https://git.realgar.ch/realgarit/loopkit.git
/plugin install loopkit@realgar-loopkit
```

To try it for one session without installing:

```
claude --plugin-dir /Users/realgar/Git/loopkit/plugins/loopkit
```

## Use it in a repo

1. Open the repo in Claude Code.
2. Run `/loopkit:loop-init` and confirm the commands it found.
3. Fill `BACKLOG.md` with your features, top to bottom in build order.
4. Run `/loop /loopkit:build-loop` and let it work.

## How a backlog item looks

```
- [ ] Save and load the city. Done when: reload restores the full state. Round trip unit tested.
- [ ] Draw the villagers. Done when: each shows as a small figure on its tile. (visual)
```

The done line has to be something a test or a screenshot can check. Box states:

- `[ ]` not started, the loop can pick it.
- `[~]` built, waiting for your eyes. Only `(visual)` and `(audio)` items land here.
- `[x]` done. A logic item the loop verified, or a visual item you signed off.

## UI repos and logic only repos

`loop-init` sets `ui` in `loop.config.json`.

- UI repo: the loop screenshots visual items, sets them to `[~]`, and stops at an epic `(gate)` for you to sign off.
- Logic only repo: no screenshots, no gates. Tests are the whole gate and every item finishes on green.

## The rules that keep it honest

- The maker never commits. The loop commits only after a separate checker passes. A bad pass never lands.
- The checker is a different agent than the maker, so code is not graded by the one who wrote it.
- Visual and audio work is never called done on the loop's word. A human signs it off.
- Two failures in a row stops the loop for a human.

## Files it writes in a repo

- `loop.config.json`, the gate commands and the mode.
- `BACKLOG.md`, the work and the state.
- `docs/loop-log.md`, one line per pass, so a fresh session can pick up where the last left off.
