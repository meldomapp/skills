#!/usr/bin/env node
// The repo's own guard. Every rule here is a mistake that would ship a broken plugin to a user's machine and
// only surface as "the skill isn't there" — a provider that cannot load a skill says nothing about why.
//
// No dependencies on purpose: this runs on a bare `node` in CI, before anything is installed.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function fail(message) {
    errors.push(message);
}

function readJson(relativePath) {
    try {
        return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
    } catch (error) {
        fail(`${relativePath}: not valid JSON (${error.message})`);
        return null;
    }
}

// Every file in the repo, so the whole-repo string checks below cannot be dodged by putting the banned text
// somewhere the per-file checks do not look.
function allFiles(dir, acc = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) allFiles(full, acc);
        else acc.push(full);
    }
    return acc;
}

// --- Manifests -----------------------------------------------------------------------------------------

const claudePlugin = readJson('.claude-plugin/plugin.json');
const codexPlugin = readJson('.codex-plugin/plugin.json');

if (claudePlugin && codexPlugin) {
    // Both providers read their OWN manifest, so a name or version that differs between them means a user
    // installs two different things depending on which CLI they used.
    if (claudePlugin.name !== codexPlugin.name) {
        fail(`plugin name differs between manifests: "${claudePlugin.name}" vs "${codexPlugin.name}"`);
    }
    if (claudePlugin.version !== codexPlugin.version) {
        fail(`plugin version differs between manifests: "${claudePlugin.version}" vs "${codexPlugin.version}"`);
    }
    if (claudePlugin.name !== 'meldom') fail(`plugin name must be "meldom", got "${claudePlugin.name}"`);
    if (!/^\d+\.\d+\.\d+$/.test(String(claudePlugin.version))) fail(`plugin version must be semver, got "${claudePlugin.version}"`);
}

// --- Marketplaces --------------------------------------------------------------------------------------

const claudeMarket = readJson('.claude-plugin/marketplace.json');
const codexMarket = readJson('.agents/plugins/marketplace.json');

for (const [path, market] of [
    ['.claude-plugin/marketplace.json', claudeMarket],
    ['.agents/plugins/marketplace.json', codexMarket],
]) {
    if (!market) continue;
    if (market.name !== 'meldom') fail(`${path}: marketplace name must be "meldom", got "${market.name}"`);
    const names = (market.plugins ?? []).map((plugin) => plugin.name);
    if (!names.includes('meldom')) fail(`${path}: does not reference plugin "meldom" (found: ${names.join(', ') || 'none'})`);
}

// --- Skills --------------------------------------------------------------------------------------------

const skillsDir = join(ROOT, 'skills');
let skillNames = [];
try {
    skillNames = readdirSync(skillsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
} catch {
    fail('skills/: missing or unreadable');
}

if (skillNames.length === 0) fail('skills/: holds no skill folders');

for (const name of skillNames) {
    // MEL-3199: the plugin namespace IS `meldom:`, so a `meldom-` prefix on a folder would name the skill
    // `meldom:meldom-ship` — the exact double-namespacing the plugin exists to remove.
    if (name.startsWith('meldom-')) fail(`skills/${name}: a skill folder must not carry a "meldom-" prefix; the plugin already namespaces it`);

    const file = join(skillsDir, name, 'SKILL.md');
    let content;
    try {
        statSync(file);
        content = readFileSync(file, 'utf8');
    } catch {
        fail(`skills/${name}/SKILL.md: missing`);
        continue;
    }
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)?.[1];
    if (frontmatter === undefined) {
        fail(`skills/${name}/SKILL.md: has no frontmatter block`);
        continue;
    }
    // Claude names a plain skill by its FOLDER and Codex by its frontmatter `name`. They only agree when the
    // two match, so a mismatch means the same skill answers to two different names depending on the provider.
    const declared = /^name:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim().replace(/^["']|["']$/g, '');
    if (declared !== name) fail(`skills/${name}/SKILL.md: frontmatter name is "${declared ?? '(none)'}", must equal the folder name "${name}"`);
    if (!/^description:\s*\S/m.test(frontmatter)) fail(`skills/${name}/SKILL.md: has no description`);
}

// Claude does not load a skill nested deeper than `skills/<name>/SKILL.md`, so one that sits deeper is
// invisible on that provider while working fine on Codex — the worst kind of difference to debug.
for (const file of allFiles(ROOT)) {
    const rel = relative(ROOT, file);
    if (!rel.endsWith('SKILL.md')) continue;
    if (!/^skills\/[^/]+\/SKILL\.md$/.test(rel)) fail(`${rel}: a SKILL.md must sit exactly at skills/<name>/SKILL.md`);
}

// --- Banned strings ------------------------------------------------------------------------------------

// Leftovers from when the app copied these skills onto a user's machine: an ownership marker it stamped, and
// the placeholder it substituted at publish time. Neither means anything to a plugin, and a `{{VERSION}}` that
// nothing substitutes ships to the user verbatim.
for (const file of allFiles(ROOT)) {
    const rel = relative(ROOT, file);
    // This file NAMES the banned strings in order to ban them, so it checks itself by identity rather than by
    // path — a second script under `scripts/` gets no exemption.
    if (rel === join('scripts', 'validate.mjs')) continue;
    let content;
    try {
        content = readFileSync(file, 'utf8');
    } catch {
        continue;
    }
    if (content.includes('meldom-bundled')) fail(`${rel}: contains "meldom-bundled" — the app's old ownership marker`);
    if (content.includes('{{VERSION}}')) fail(`${rel}: contains "{{VERSION}}" — nothing substitutes it in a plugin`);
}

// --- Report --------------------------------------------------------------------------------------------

if (errors.length > 0) {
    for (const error of errors) console.error(`error: ${error}`);
    console.error(`\n${errors.length} problem(s) found.`);
    process.exit(1);
}
console.log(`ok: ${skillNames.length} skill(s), both manifests at ${claudePlugin?.version}`);
