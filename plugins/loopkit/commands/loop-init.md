---
description: Bootstrap the loopkit build loop in this repo. Detects the test, build, and run commands, writes loop.config.json (full autonomy by default), seeds a starter BACKLOG.md, a loop log, and proves the gate is green. Pass review as an argument to set up stop-and-review instead. Run this once per repo.
---

# Set up the build loop in this repo

You are setting up an autonomous build loop in the current repo. Work in the repo
root, the current working directory. Do this in order. Do not skip the gate check.

The mode is **full autonomy** unless the user passes `review` as an argument
(`/loopkit:loop-init review`). Full autonomy means hands-off setup and a loop that
runs without stopping for a human. Review mode keeps the confirm step and the human
sign-off checkpoints. Argument received: `$ARGUMENTS`.

## 1. Learn the repo

- Read any CLAUDE.md, AGENTS.md, or README so you follow the house rules.
- Find the gate commands. Look at package.json scripts, Cargo.toml, pyproject.toml, go.mod, a Makefile, or a justfile. Pin down:
  - test command, the thing that runs the unit tests. This is the gate, it has to exist.
  - build or typecheck command, if there is one.
  - run command and a local URL, only if this repo has a UI you can open in a browser.
- Decide the mode. A UI repo is a web app, a game, anything you can run and screenshot. A logic only repo is a library, a CLI, or a service where tests are the whole story.

## 2. Settle the commands

**Full autonomy (default).** Do not block on a confirmation. State plainly what you
detected — the test command, the build command, the mode, and the run command plus URL
for a UI repo. If the build or run command is ambiguous, pick the most likely and say
so. The one hard requirement is the test command: if you cannot find a way to run the
tests, stop and ask the user, because that is the gate.

**Review mode.** Show what you found and ask the user to confirm or fix it before
writing anything. Do not guess silently. A wrong test command breaks the whole loop.

## 3. Write the files

Write these into the repo root.

`loop.config.json`, with the real commands you confirmed:

```json
{
  "autonomy": "full",
  "ui": true,
  "test": "npm test",
  "build": "npm run build",
  "run": "npm run dev",
  "url": "http://localhost:5173"
}
```

For a logic only repo set `ui` to false and drop `run` and `url`. If there is no build step, set `build` to an empty string.

Set `autonomy` to `"review"` for the old stop-and-review behavior. Write `"review"`
only when the user asked for review mode; otherwise write `"full"`.

`BACKLOG.md`: use the template at the bottom of this file. Seed it from the repo — read
the README and the code, and draft the epics and items you can infer, top to bottom in
build order. When the repo gives you nothing to go on, seed two safe starters (raise
test coverage on the core module; harden error handling on the main entry point). Mark
the file as auto-generated and editable in a comment at the top. The loop also finds its
own work, so it is never stuck on an empty backlog.

`docs/loop-log.md`, or `loop-log.md` if there is no docs folder: a header and one baseline line you fill in the next step.

If this repo tracks build artifacts, add `loop.config.json` and the log to git as normal source. They are part of the loop, not artifacts.

## 4. Prove the gate

Run the test command, and the build command if there is one. They must pass on a clean tree before the loop is allowed to run. Write the result as the baseline line in the log. If they fail, stop and tell the user. The loop needs a green baseline.

## 5. Hand off

Tell the user, in plain words:

- what you wrote, and that the loop is set to **full autonomy** (or review, if that is
  what they asked for): it runs without stopping for a human
- the backlog you seeded, and that they can edit `BACKLOG.md` to steer the work
- to start the loop with `/loop /loopkit:build-loop`
- to switch modes any time by setting `autonomy` in `loop.config.json` to `"review"` or
  `"full"`

## BACKLOG.md template

```markdown
# Backlog

What it takes to finish this project. The loop reads this top to bottom, so order
matters. Earlier items are the ground later ones stand on. Build them first.

Format:

- [ ] Title. Done when: a concrete, checkable result.

Box states:

- `[ ]` not started. The loop can pick it.
- `[~]` built, waiting for your eyes. Only `(visual)` and `(audio)` items land here. The loop will not pick it again, but it is not done until you sign off.
- `[!]` parked. A pass tried this and failed, so the loop set it aside with a reason and moved on. Full autonomy only. The loop skips it like `[~]`; a human or a later pass revisits it.
- `[x]` done. A logic item the loop verified, or a visual item you signed off at a gate.

How the loop uses this:

- Pick the top `[ ]` item. Skip `[~]`. Tick a logic item `[x]` when a pass meets its done line.
- A `(visual)` or `(audio)` item gets built then set to `[~]`. A human looks or listens before it counts.
- A `(gate)` item ends an epic that has visual or audio work. The loop screenshots, lists that epic's `[~]` items, and stops for you to sign off.
- Too big for one pass? Split it into smaller items first.
- When the list runs thin, the loop finds its own polish and test work.

Logic only repos can drop the `[~]`, `(visual)`, and `(gate)` lines. There every item finishes on green.

## Epic 1: name it

- [ ] First item. Done when: a concrete, checkable result.
- [ ] Second item. Done when: ...
```
