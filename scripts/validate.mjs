// Checks the plugin and marketplace files are sound. Run with: node scripts/validate.mjs
import { readFileSync, existsSync } from 'node:fs';

let errors = 0;
const fail = (m) => { console.error('FAIL  ' + m); errors++; };
const pass = (m) => console.log('ok    ' + m);

function readJson(path) {
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    pass(path + ' is valid json');
    return data;
  } catch (e) {
    fail(path + ': ' + e.message);
    return null;
  }
}

const market = readJson('.claude-plugin/marketplace.json');
const plugin = readJson('plugins/loopkit/.claude-plugin/plugin.json');

if (plugin && !plugin.name) fail('plugin.json has no name');

if (market && plugin) {
  const entry = (market.plugins || []).find((p) => p.name === 'loopkit');
  if (!entry) fail('marketplace.json has no loopkit entry');
  else if (entry.version !== plugin.version) fail(`version mismatch: marketplace ${entry.version} vs plugin ${plugin.version}`);
  else pass('versions match at ' + plugin.version);
}

for (const cmd of ['loop-init', 'build-loop']) {
  const p = `plugins/loopkit/commands/${cmd}.md`;
  if (!existsSync(p)) { fail('missing ' + p); continue; }
  if (!readFileSync(p, 'utf8').startsWith('---')) fail(p + ' has no frontmatter');
  else pass(p + ' has frontmatter');
}

console.log(errors ? `\n${errors} problem(s)` : '\nall checks passed');
process.exit(errors ? 1 : 0);
