# Loopkit plugin

An autonomous, backlog driven build loop for any repo.

- `/loopkit:loop-init` sets up the loop: finds the test and build commands, writes `BACKLOG.md`, `loop.config.json`, and a log, and checks the gate is green.
- `/loopkit:build-loop` runs one pass. A maker builds the next item, a separate checker grades it, the loop records the result and decides whether to keep going.

Run it with the built in loop:

```
/loop /loopkit:build-loop
```

See the README one level up for install and usage.
