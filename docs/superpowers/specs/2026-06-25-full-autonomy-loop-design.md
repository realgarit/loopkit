# Full-autonomy build loop — design

Date: 2026-06-25
Status: approved, ready for planning

## Problem

Loopkit's loop is built to stop and wait for a human at several points. The
default experience is "stop and review", not "set it and let it run". We want a
repo to be ready for fully autonomous work as soon as it is set up, while keeping
the current human-in-the-loop behavior available as an opt-in.

## Goals

- Full autonomy is the default. After `/loopkit:loop-init`, the loop runs without
  human stops.
- Review mode (today's behavior) stays available behind a single config switch.
- A failed item parks itself and the loop keeps working; it only halts when it is
  genuinely stuck.
- Setup is hands-off: detect the commands, seed a starter backlog, prove the gate.

## Non-goals

- No granular per-checkpoint flags yet (one `autonomy` switch only; can grow later).
- No auto-fixing a red baseline at setup time. A broken test gate still stops setup.
- No retry logic for parked items beyond the loop naturally revisiting them; parked
  items wait for a human or a later self-found pass.
- No auto-starting `/loop`. Setup leaves the repo one command away from running.

## Mechanism

A single field in `loop.config.json`:

```json
"autonomy": "full"
```

- `"full"` — the new default. Agent signs off visual work, gates auto-clear,
  failures park instead of stopping, setup is hands-off.
- `"review"` — today's behavior exactly. Visual work waits for a human, gates stop
  for a human, two failures in a row stop the loop, setup confirms with the user.

Both commands branch on this field. A repo whose `loop.config.json` has no
`autonomy` field is treated as `"full"`, matching the new intent.

## Behavior by checkpoint

| Checkpoint | `review` (old default) | `full` (new default) |
|---|---|---|
| Visual / audio item | build → `[~]`, wait for a human | checker agent reviews the screenshot against the done line → `[x]`; screenshot still saved |
| Epic `(gate)` | screenshot, list items, stop for a human | checker agent does an epic-level screenshot review → ticks the gate `[x]`, continues |
| Failed pass | two in a row → hard stop | park the item `[!]` with a reason, pick different work; halt only on a broad stall |
| `loop-init` setup | confirm detected commands with the user | hands-off: auto-detect and proceed; stop only if no test command exists |
| `BACKLOG.md` | human writes it | auto-seeded from README/code, fully editable |

## New box state: `[!]` parked

A fifth box state, used only in `full` mode:

- `[!]` — built attempt failed (or a gate failed its agent review). Set aside with a
  one-line reason appended to the item. The loop skips `[!]` items the same way it
  skips `[~]`.

Review mode does not use `[!]`; it keeps today's behavior (leave the box `[ ]` on a
fail, stop after two in a row).

## Failure back-off and stall halt (full mode)

On a failed pass:

1. Reset the working tree clean (`git reset --hard HEAD`, then `git clean -fd`), as
   today.
2. Append a `failed` line to the log with the reason.
3. Set the item's box to `[!]` in `BACKLOG.md` with a short parenthetical reason.
4. Do **not** stop. End the pass; the next pass picks the next `[ ]` item.

Halt and ask for a human only on a broad stall, when either:

- the last three log lines are all `failed` (the repo is thrashing — something
  systemic is wrong), or
- no `[ ]` items remain to pick (only `[!]`, `[~]`, `[x]`) **and** self-found work
  is not landing either (a self-found item just failed, or none can be found).

When halting, write a summary line listing the parked `[!]` items and their reasons,
and ask for a human. This is the circuit breaker that keeps the loop from grinding
forever.

## Gate handling in full mode

When the top `[ ]` item is a `(gate)` and `autonomy` is `full`, the loop performs the
sign-off the human used to do, then continues:

1. Identify the epic's visual/audio items. In full mode these are already `[x]`
   (each was agent-signed when built); the gate is an epic-level integration check.
2. Start the app with `run`, open `url` with Playwright, screenshot the epic's
   surface, stop the app. Save the shot under `docs/screenshots`.
3. Spawn the checker subagent. Given the screenshot(s) and the epic's done lines, it
   confirms the epic is visually coherent and nothing regressed. Pass or fail, with a
   reason.
4. Pass: tick the gate `[x]`, append a `gate cleared (agent)` line with the
   screenshot path, and continue.
5. Fail: park the gate `[!]` with the reason and end the pass (the epic stays open;
   the stall/parked mechanism surfaces it for a human). Never tick a failed gate.

## Visual / audio item in full mode

Steps 4–5 of a normal pass change:

- The checker explicitly reviews the screenshot against the visual/audio done line.
- On pass: set the box to `[x]` (not `[~]`), commit and push, and append a
  `passed (visual, agent-signed)` line with the commit hash and screenshot path.
- On fail: park `[!]` and reset the tree, like any other failed pass.

The screenshot is still saved on every visual pass so a human can spot-check the
trail later.

## `loop-init` in full mode (hands-off)

- **Detect, don't confirm.** Auto-detect the test, build, run, and url commands. If a
  test command is found, proceed without blocking. Print what was detected for
  transparency. If build or run is ambiguous, pick the best guess and note it. If no
  test command can be found at all, stop and ask — the gate must exist.
- **Write `autonomy: "full"`** into `loop.config.json`.
- **Auto-seed `BACKLOG.md`.** Draft epics and items in build order from the README and
  code. If there is nothing to infer, seed a couple of safe starter items (raise test
  coverage on the core module, harden error handling). Mark the file as auto-generated
  and editable. The loop also finds its own work, so it is never stuck on an empty
  backlog.
- **Prove the gate** as today. A red baseline still stops setup with a clear report —
  the loop will not build on a broken gate.
- **Hand off.** Tell the user full autonomy is on by default, the one command to start
  the loop, how to edit `BACKLOG.md`, and how to switch to review mode
  (`"autonomy": "review"`).

Review mode keeps the existing confirm-with-user step (now also surfacing the
`autonomy` value).

## Files touched

- `plugins/loopkit/commands/build-loop.md` — read `autonomy` (default `full`); branch
  every checkpoint; add `[!]` parking, back-off, and stall halt; agent sign-off for
  visual items and gates in full mode.
- `plugins/loopkit/commands/loop-init.md` — hands-off detection, write
  `"autonomy": "full"`, auto-seed the backlog; keep the confirm path for review mode;
  document `[!]` in the backlog template.
- `plugins/loopkit/README.md` and root `README.md` — document full autonomy as the
  default, the `autonomy` flag, the `[!]` state, and how to switch back to review.
- `plugins/loopkit/.claude-plugin/plugin.json` — refresh the description; bump the
  version `0.1.0 → 0.2.0` (behavioral change).

## Success criteria

- A fresh `/loopkit:loop-init` on a repo with a green test gate writes
  `autonomy: "full"`, seeds a backlog, and reports the repo is ready — without asking
  the user to confirm commands.
- `/loop /loopkit:build-loop` then runs passes end to end: builds, agent-checks
  (including visual sign-off and gate clearing), commits, and keeps going with no human
  stop.
- A single failing item parks `[!]` and the loop moves on; a thrashing or stuck repo
  halts with a summary of parked items.
- Setting `"autonomy": "review"` restores today's stop-and-review behavior at every
  checkpoint.
