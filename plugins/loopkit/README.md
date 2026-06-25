# Loopkit plugin

An autonomous, backlog driven build loop for any repo.

Full autonomy is the default: the loop builds, checks its own work (including the look
of visual items), commits, and keeps going with no human stop. Pass `review` to
`/loopkit:loop-init`, or set `"autonomy": "review"` in `loop.config.json`, to get the
old stop-and-review behavior back.

- `/loopkit:loop-init` sets up the loop: finds the test and build commands, writes `BACKLOG.md`, `loop.config.json`, and a log, and checks the gate is green.
- `/loopkit:build-loop` runs one pass. A maker builds the next item, a separate checker grades it, the loop records the result and decides whether to keep going.

Run it with the built in loop:

```
/loop /loopkit:build-loop
```

See the README one level up for install and usage.
