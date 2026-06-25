---
description: Run one pass of the build loop in this repo. Pair with /loop to run it again and again. Reads loop.config.json for the gate commands, picks the next backlog item, builds it with a maker subagent, checks it with a separate checker, records the result, and decides whether to keep going.
---

# Build loop, one pass

You are the loop runner. Do exactly one item this pass, then stop. The `/loop`
wrapper calls you again for the next one. Work in the repo root.

## 0. Read the config

Read `loop.config.json` in the repo root. It gives you:

- `test`: the command that runs the tests. This is the gate.
- `build`: the build or typecheck command. Run it too when it is set.
- `ui`: true if this repo has something to run and screenshot.
- `run` and `url`: how to start the app and where to open it. Used only when `ui` is true.

No `loop.config.json`? Stop and tell the user to run `/loopkit:loop-init` first.

## 1. Load state

- Read `BACKLOG.md` and the loop log (`docs/loop-log.md` or `loop-log.md`).
- Look at the last two log lines. If both are failures, stop the loop. Write a line asking for a human and do not start another pass.

## 2. Pick the work

Look at the top item still in `[ ]` in `BACKLOG.md`. Skip `[~]` items, they are built and waiting on a human.

- When `ui` is true and that top `[ ]` item is a `(gate)`, do not build. Run the Gate pass below, then stop. A gate always wins.
- Otherwise pick the work, in this order:
  - The top `[ ]` item.
  - Every third pass, or when no `[ ]` items remain, find your own work. Look at the code, and the running app when `ui` is true, then write one small polish or test item with its own done line. Good sources: thin test coverage, rough UI spacing, missing feedback on an action, a number that feels off. Keep it small and isolated.
  - Spot other problems? Add them to `BACKLOG.md` so they are not lost. Do not fix them this pass.

Append a "started" line for the chosen item to the log.

## Gate pass, only when ui is true and the top item is a gate

A `(gate)` ends an epic that has visual or audio work. The loop does not build it. A gate only clears on a human's word, so never tick it yourself. Do this:

1. List that epic's `[~]` items, the visual and audio work built since the last gate. These are what the human signs off.
2. Start the app with the `run` command. Open the `url` with Playwright, take a screenshot, then stop the app. Save the shot under `docs/screenshots` or a screenshots folder. If the last pass already shot this same gate and nothing changed, reuse that shot.
3. Append a "gate" line to the log with the epic, the screenshot path, and the `[~]` items to review.
4. Tell the human plainly: here is the screenshot, here is each `[~]` item to look at, and what good looks like. For an `(audio)` item ask them to run it and listen, there is nothing to screenshot.
5. Stop the loop. The human reviews, ticks the `[~]` items and the gate to `[x]`, then runs the loop again to open the next epic.

## 3. Build it (maker)

Spawn a subagent as the maker. Give it the one item and these rules:

- Follow this repo's CLAUDE.md or AGENTS.md if there is one.
- For logic work, write the failing test first, then the smallest code that passes. Run the test command until green.
- Run the build command when it is set.
- Build only what the done line needs. No extra features.
- Do not commit. Leave the changes in the working tree and hand back a summary: what changed, the new test names, and for visual work the exact change to look for on screen.

## 4. Check it (checker)

Spawn a different subagent as the checker. It did not write the code. Give it the diff (`git diff`), the test output, and the screenshot if any. It answers one thing: does the change meet the done line, with the tests green and the build clean? Pass or fail, with a reason.

Run the test command, and the build command, yourself too, so the gate is real and not just claimed. For a UI item, start the app with the `run` command, open the `url` with Playwright, take a screenshot, then stop the app.

## 5. Record

- Pass, logic item: set the box to `[x]` in `BACKLOG.md`, or for self-found work add a done line. Commit and push with a short message under the repo's house rules. Append a "passed" line to the log with the item and the commit hash.
- Pass, `(visual)` or `(audio)` item, UI repos only: set the box to `[~]`, not `[x]`. It is built but a human has not signed off. Save the screenshot. Commit and push. Append a "built, pending" line with the item, the commit hash, and the screenshot path. It finishes at the epic gate.
- Fail: reset the working tree clean (`git reset --hard HEAD`, then `git clean -fd` for new files). Append a "failed" line with the reason. Leave the box unchecked.

## 6. Decide

- If you ran a Gate pass, you already stopped for a human. Nothing more this pass.
- If the backlog is empty and you have no useful self-found work left, stop the loop and say so.
- Otherwise this pass is done. Let `/loop` call the next one.

## Guardrails

- One item per pass. Small, isolated diffs only.
- The maker never commits. Only commit after the checker passes. That keeps a bad pass off the branch.
- In a UI repo, visual and audio items finish only on a human's word, at the epic gate. In a logic only repo there are no gates, every item finishes on green.
- A gate only clears on a human. Never tick a gate yourself, and never build past an unticked gate.
- Never weaken or delete a test to make the gate pass.
- Keep commits and prose to the repo's house rules.
