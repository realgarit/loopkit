# Full-autonomy build loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make loopkit default to fully autonomous work — no human stops — while keeping today's stop-and-review behavior available behind one config switch.

**Architecture:** A single `autonomy` field in `loop.config.json` (`"full"` default, `"review"` opt-in). Both command prompts (`loop-init.md`, `build-loop.md`) branch on it. Full mode has the checker agent sign off visual work and gates, parks failed items as `[!]` instead of stopping, and sets up hands-off. Review mode is the current behavior verbatim.

**Tech Stack:** Markdown command prompts, JSON manifests, `scripts/validate.mjs` (Node) as the gate.

## Global Constraints

- The loop's gate command (`test`) must exist; everything else is best-guess.
- `validate.mjs` requires `plugins/loopkit/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to declare the **same** version, both command files to keep `---` frontmatter, and all JSON to parse. Every commit must leave `node scripts/validate.mjs` green.
- Prose follows the repo's existing voice: short, plain, lowercase box states in backticks (`[ ]`, `[~]`, `[x]`, `[!]`).
- New box state `[!]` (parked) is used only in `full` mode. Review mode keeps `[ ]`/`[~]`/`[x]` exactly as today.
- Missing `autonomy` field is treated as `"full"`.
- The maker never commits; the loop commits only after the checker passes. Unchanged in both modes.

---

### Task 1: `loop-init.md` — hands-off setup, autonomy flag, auto-seed backlog

**Files:**
- Modify: `plugins/loopkit/commands/loop-init.md`

**Interfaces:**
- Produces: a `loop.config.json` containing `"autonomy": "full"` (or `"review"`), consumed by Task 2's loop. Seeds `BACKLOG.md` whose legend includes `[!]`.

- [ ] **Step 1: Update the frontmatter description**

Replace the `description:` line so it reads (one line):

```
description: Bootstrap the loopkit build loop in this repo. Detects the test, build, and run commands, writes loop.config.json (full autonomy by default), seeds a starter BACKLOG.md, a loop log, and proves the gate is green. Pass `review` to set up stop-and-review instead. Run this once per repo.
```

- [ ] **Step 2: Add a mode line under the title**

After the intro paragraph ("You are setting up... Do not skip the gate check."), add:

```markdown
The mode is **full autonomy** unless the user passes `review` as an argument
(`/loopkit:loop-init review`). Full autonomy means hands-off setup and a loop that
runs without stopping for a human. Review mode keeps the confirm step and the
human sign-off checkpoints. Argument received: `$ARGUMENTS`.
```

- [ ] **Step 3: Replace section "## 2. Confirm with the user" with mode-aware detection**

Replace the whole section with:

```markdown
## 2. Settle the commands

**Full autonomy (default).** Do not block on a confirmation. State plainly what you
detected — the test command, the build command, the mode, and the run command plus
URL for a UI repo. If the build or run command is ambiguous, pick the most likely and
say so. The one hard requirement is the test command: if you cannot find a way to run
the tests, stop and ask the user, because that is the gate.

**Review mode.** Show what you found and ask the user to confirm or fix it before
writing anything. Do not guess silently. A wrong test command breaks the whole loop.
```

- [ ] **Step 4: Add the autonomy field to the config example**

In section "## 3. Write the files", change the JSON block to include the flag as the first field:

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

And add this line right after the JSON block's explanatory sentence:

```markdown
Set `autonomy` to `"review"` for the old stop-and-review behavior. Write `"review"`
only when the user asked for review mode; otherwise write `"full"`.
```

- [ ] **Step 5: Make backlog seeding the default, not optional**

In section "## 3. Write the files", replace the `BACKLOG.md:` bullet with:

```markdown
`BACKLOG.md`: use the template at the bottom of this file. Seed it from the repo — read
the README and the code, and draft the epics and items you can infer, top to bottom in
build order. When the repo gives you nothing to go on, seed two safe starters (raise
test coverage on the core module; harden error handling on the main entry point). Mark
the file as auto-generated and editable in a comment at the top. The loop also finds
its own work, so it is never stuck on an empty backlog.
```

- [ ] **Step 6: Add `[!]` to the BACKLOG.md template legend**

In the "## BACKLOG.md template" block, add this bullet to the "Box states:" list, right after the `[~]` line:

```markdown
- `[!]` parked. A pass tried this and failed, so the loop set it aside with a reason
  and moved on. Full autonomy only. The loop skips it like `[~]`; a human or a later
  pass revisits it.
```

- [ ] **Step 7: Update the hand-off so it states the mode**

Replace section "## 5. Hand off" with:

```markdown
## 5. Hand off

Tell the user, in plain words:

- what you wrote, and that the loop is set to **full autonomy** (or review, if that is
  what they asked for): it runs without stopping for a human
- the backlog you seeded, and that they can edit `BACKLOG.md` to steer the work
- to start the loop with `/loop /loopkit:build-loop`
- to switch modes any time by setting `autonomy` in `loop.config.json` to `"review"`
  or `"full"`
```

- [ ] **Step 8: Validate and commit**

Run: `node scripts/validate.mjs`
Expected: ends with `all checks passed`, exit 0.

```bash
git add plugins/loopkit/commands/loop-init.md
git commit -m "loop-init: hands-off full-autonomy setup with seeded backlog"
```

---

### Task 2: `build-loop.md` — autonomy branch, agent sign-off, parking and back-off

**Files:**
- Modify: `plugins/loopkit/commands/build-loop.md`

**Interfaces:**
- Consumes: `autonomy` from `loop.config.json` (default `"full"` when absent), plus the existing `test`/`build`/`ui`/`run`/`url` fields.
- Produces: in full mode, `[x]` for agent-signed visual items, cleared gates, and `[!]` for parked failures. No interface other tasks depend on.

- [ ] **Step 1: Update the frontmatter description**

Replace the `description:` line with (one line):

```
description: Run one pass of the build loop in this repo. Pair with /loop to run it again and again. Reads loop.config.json for the gate commands and the autonomy mode, picks the next backlog item, builds it with a maker subagent, checks it with a separate checker, records the result, and decides whether to keep going. Full autonomy by default; set autonomy to review for human sign-off.
```

- [ ] **Step 2: Read the autonomy mode in section 0**

In "## 0. Read the config", add a bullet to the list:

```markdown
- `autonomy`: `full` (default) or `review`. Missing means `full`. In `full` the loop
  signs off its own visual work, clears gates, and parks failures instead of stopping.
  In `review` a human signs off visual work and gates, and two failures in a row stop
  the loop.
```

- [ ] **Step 3: Make the failure stop mode-aware in section 1**

In "## 1. Load state", replace the second bullet ("Look at the last two log lines...") with:

```markdown
- Decide whether to stop before starting more work:
  - `review` mode: if the last two log lines are both failures, stop the loop. Write a
    line asking for a human and do not start another pass.
  - `full` mode: stop only on a broad stall — when the last three log lines are all
    failures (the repo is thrashing), or when no `[ ]` items remain to pick (only
    `[!]`, `[~]`, `[x]`) and self-found work is not landing either. When you stop, write
    a summary line listing the parked `[!]` items and their reasons, and ask for a
    human. Otherwise keep going.
```

- [ ] **Step 4: Skip parked items when picking work in section 2**

In "## 2. Pick the work", change the first paragraph to also skip `[!]`:

```markdown
Look at the top item still in `[ ]` in `BACKLOG.md`. Skip `[~]` items (built, waiting
on a human) and `[!]` items (parked after a failed pass).
```

And change the gate bullet to name the mode:

```markdown
- When `ui` is true and that top `[ ]` item is a `(gate)`, do not build. Run the Gate
  pass for your mode below, then stop the pass. A gate always wins.
```

- [ ] **Step 5: Replace the Gate pass section with both modes**

Replace the whole "## Gate pass, only when ui is true and the top item is a gate" section with:

```markdown
## Gate pass, only when ui is true and the top item is a gate

A `(gate)` ends an epic that has visual or audio work. The loop does not build it. How
it clears depends on the mode.

**Review mode.** A gate clears only on a human's word, so never tick it yourself. Do
this:

1. List that epic's `[~]` items, the visual and audio work built since the last gate.
   These are what the human signs off.
2. Start the app with the `run` command. Open the `url` with Playwright, take a
   screenshot, then stop the app. Save the shot under `docs/screenshots` or a
   screenshots folder. If the last pass already shot this same gate and nothing
   changed, reuse that shot.
3. Append a "gate" line to the log with the epic, the screenshot path, and the `[~]`
   items to review.
4. Tell the human plainly: here is the screenshot, here is each `[~]` item to look at,
   and what good looks like. For an `(audio)` item ask them to run it and listen.
5. Stop the loop. The human reviews, ticks the `[~]` items and the gate to `[x]`, then
   runs the loop again to open the next epic.

**Full autonomy.** The checker agent does the epic-level sign-off, then the loop
continues. In full mode the epic's visual items are already `[x]` (each was
agent-signed when built), so the gate is an integration check, not a backlog of
unreviewed work. Do this:

1. Start the app with the `run` command. Open the `url` with Playwright, screenshot the
   epic's surface, then stop the app. Save the shot under `docs/screenshots`.
2. Spawn the checker subagent. Give it the screenshot and the epic's done lines. It
   answers one thing: does the epic hang together visually, with nothing regressed?
   Pass or fail, with a reason.
3. Pass: tick the gate `[x]`. Append a "gate cleared (agent)" line with the epic and the
   screenshot path. Do not stop — let `/loop` open the next epic on the next pass.
4. Fail: park the gate `[!]` with the reason and append a "gate parked" line. Leave the
   epic open. Do not tick a failed gate. The stall check in section 1 brings in a human
   if the loop cannot get past it.
```

- [ ] **Step 6: Add agent visual sign-off to section 4**

In "## 4. Check it (checker)", after the existing paragraph, add:

```markdown
For a `(visual)` or `(audio)` item in `full` mode, the checker also does the sign-off a
human would: it judges the screenshot (or, for audio, the described change) against the
item's done line and says whether the visual result is right, not just whether the
tests are green. In `review` mode the checker still grades tests and build; the human
judges the look at the gate.
```

- [ ] **Step 7: Rework section 5 (Record) for parking and agent sign-off**

Replace the three bullets in "## 5. Record" with:

```markdown
- Pass, logic item: set the box to `[x]` in `BACKLOG.md`, or for self-found work add a
  done line. Commit and push with a short message under the repo's house rules. Append
  a "passed" line to the log with the item and the commit hash.
- Pass, `(visual)` or `(audio)` item, UI repos only:
  - `review` mode: set the box to `[~]`, not `[x]`. It is built but a human has not
    signed off. Save the screenshot. Commit and push. Append a "built, pending" line
    with the item, the commit hash, and the screenshot path. It finishes at the epic
    gate.
  - `full` mode: the checker has signed off the look, so set the box to `[x]`. Save the
    screenshot for the trail. Commit and push. Append a "passed (visual, agent-signed)"
    line with the item, the commit hash, and the screenshot path.
- Fail: reset the working tree clean (`git reset --hard HEAD`, then `git clean -fd` for
  new files). Append a "failed" line with the reason.
  - `review` mode: leave the box unchecked.
  - `full` mode: set the box to `[!]` with a short parenthetical reason, so the loop
    parks it and picks different work next pass.
```

- [ ] **Step 8: Update section 6 (Decide) for full-mode continuation**

Replace "## 6. Decide" with:

```markdown
## 6. Decide

- If you ran a review-mode Gate pass, you already stopped for a human. Nothing more
  this pass.
- If the backlog is empty and you have no useful self-found work left, stop the loop and
  say so.
- In `full` mode, apply the stall check from section 1: stop only when the loop cannot
  move anything forward. Otherwise this pass is done — let `/loop` call the next one.
- In `review` mode, this pass is done. Let `/loop` call the next one.
```

- [ ] **Step 9: Update the Guardrails for both modes**

Replace the Guardrails list with:

```markdown
## Guardrails

- One item per pass. Small, isolated diffs only.
- The maker never commits. Only commit after the checker passes. That keeps a bad pass
  off the branch.
- `review` mode: visual and audio items finish only on a human's word, at the epic gate.
  Two failures in a row stop the loop.
- `full` mode: the checker signs off visual and audio work and clears gates; a failed
  pass parks its item `[!]` and the loop moves on, stopping only on a broad stall.
- In a logic only repo there are no gates, every item finishes on green, in either mode.
- Never weaken or delete a test to make the gate pass.
- Keep commits and prose to the repo's house rules.
```

- [ ] **Step 10: Validate and commit**

Run: `node scripts/validate.mjs`
Expected: ends with `all checks passed`, exit 0.

```bash
git add plugins/loopkit/commands/build-loop.md
git commit -m "build-loop: full-autonomy mode with agent sign-off and parked failures"
```

---

### Task 3: Docs and manifests — READMEs, version bump

**Files:**
- Modify: `plugins/loopkit/README.md`
- Modify: `README.md`
- Modify: `plugins/loopkit/.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: the `autonomy` field and `[!]` state defined in Tasks 1–2.
- Produces: nothing downstream. Must keep `validate.mjs` green (matching versions).

- [ ] **Step 1: Update `plugins/loopkit/README.md`**

After the "An autonomous, backlog driven build loop for any repo." line, add:

```markdown

Full autonomy is the default: the loop builds, checks its own work (including the look
of visual items), commits, and keeps going with no human stop. Pass `review` to
`/loopkit:loop-init`, or set `"autonomy": "review"` in `loop.config.json`, to get the
old stop-and-review behavior back.
```

- [ ] **Step 2: Update the root `README.md`**

In the "## How it works" section, after the two command bullets, add:

```markdown

By default the loop runs in **full autonomy**: a checker agent signs off visual work and
clears epic gates, a failed item parks itself (`[!]`) and the loop moves on, and it
stops only when it is genuinely stuck. Set `"autonomy": "review"` in `loop.config.json`
(or run `/loopkit:loop-init review`) for the stop-and-review behavior, where a human
signs off visual work at epic gates and two failures in a row halt the loop.
```

In the "## Backlog format" box-states list, add after the `[~]` line:

```markdown
- `[!]` parked. A pass failed on it, so full autonomy set it aside. The loop skips it.
```

In the "## Rules" section, replace the last two bullets with:

```markdown
- Visual and audio work is signed off by the checker agent in full autonomy, or by a
  person at the epic gate in review mode.
- In full autonomy a failed item parks and the loop continues, stopping only on a broad
  stall. In review mode two failures in a row stop the loop.
```

- [ ] **Step 3: Bump the plugin version and description**

In `plugins/loopkit/.claude-plugin/plugin.json`, set `"version"` to `"0.2.0"` and replace `"description"` with:

```json
"description": "A fully autonomous build loop. Bootstrap a backlog driven loop in any repo, then run it with /loop. A maker builds one item, a separate checker grades and signs it off, failed items park and the loop keeps going. Set autonomy to review for human sign-off at epic gates.",
```

- [ ] **Step 4: Bump the marketplace version to match**

In `.claude-plugin/marketplace.json`, set the loopkit entry's `"version"` to `"0.2.0"` and its `"description"` to:

```json
"description": "Fully autonomous backlog driven build loop for any repo.",
```

- [ ] **Step 5: Validate and commit**

Run: `node scripts/validate.mjs`
Expected: prints `ok    versions match at 0.2.0` and ends with `all checks passed`, exit 0.

```bash
git add plugins/loopkit/README.md README.md plugins/loopkit/.claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "docs: document full autonomy default; bump to 0.2.0"
```

---

## Self-Review

**Spec coverage:**
- `autonomy` flag, default full, missing→full → Task 1 Steps 4, Task 2 Step 2, Global Constraints. ✓
- Visual/audio agent sign-off → `[x]` → Task 2 Steps 6, 7. ✓
- Gate auto-clear by agent, park on fail → Task 2 Step 5. ✓
- `[!]` parked state, skipped like `[~]` → Task 1 Step 6, Task 2 Steps 4, 7. ✓
- Back-off on failure + broad-stall halt → Task 2 Steps 3, 8. ✓
- Hands-off loop-init, stop only if no test cmd → Task 1 Step 3. ✓
- Auto-seed backlog, safe-starter fallback → Task 1 Step 5. ✓
- Red baseline still stops setup → unchanged in loop-init "## 4. Prove the gate" (not touched, still stops). ✓
- Review mode preserves today's behavior → Task 2 Steps 3, 5, 7, 8, 9. ✓
- Files touched incl. marketplace.json version match → Task 3 Steps 3, 4. ✓

**Placeholder scan:** No TBD/TODO; every prose block is the literal replacement text. ✓

**Type/name consistency:** flag name `autonomy`, values `"full"`/`"review"`, state `[!]`, log lines ("passed (visual, agent-signed)", "gate cleared (agent)", "gate parked") used consistently across tasks. ✓
