# Loopkit plugin

An autonomous, backlog driven build loop for any repo.

- `/loopkit:loop-init` sets up the loop in the current repo: finds the test and build commands, writes `BACKLOG.md`, `loop.config.json`, and a loop log, and proves the gate is green.
- `/loopkit:build-loop` runs one pass: a maker builds the next backlog item, a separate checker grades it, the loop records the result and decides whether to keep going.

Run it with the built in loop:

```
/loop /loopkit:build-loop
```

See the marketplace README one level up for install and usage.
