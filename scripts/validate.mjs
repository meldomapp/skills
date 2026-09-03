#!/usr/bin/env node
// The repo's own guard. Every rule here is a mistake that would ship a broken plugin to a user's machine and
// only surface as "the skill isn't there" — a provider that cannot load a skill says nothing about why.
//
// No dependencies on purpose: this runs on a bare `node` in CI, before anything is installed.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
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

    // Codex reads `agents/openai.yaml` for the display name it shows in the skill picker, and for the policy
    // that hides a user-invoked skill from the model. Without the file a skill is nameless there, and a
    // user-invoked one is silently reachable by the model.
    const yamlPath = join(skillsDir, name, 'agents', 'openai.yaml');
    let yaml;
    try {
        yaml = readFileSync(yamlPath, 'utf8');
    } catch {
        fail(`skills/${name}/agents/openai.yaml: missing`);
        continue;
    }
    if (!/^[ \t]+display_name:[ \t]*\S/m.test(yaml)) fail(`skills/${name}/agents/openai.yaml: has no interface.display_name`);
    if (!/^[ \t]+short_description:[ \t]*\S/m.test(yaml)) fail(`skills/${name}/agents/openai.yaml: has no interface.short_description`);

    // The two providers express "user-invoked" separately, so they can drift apart. A skill is user-invoked in
    // BOTH or neither: half-configured means the human types it on one provider while the model fires it on
    // the other, which is exactly the accident the flag exists to prevent.
    const userInvokedClaude = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter);
    const userInvokedCodex = /^[ \t]+allow_implicit_invocation:[ \t]*(?:false|False|FALSE|no|off)[ \t]*$/m.test(yaml);
    if (userInvokedClaude !== userInvokedCodex) {
        fail(
            `skills/${name}: invocation disagrees between providers — SKILL.md ${userInvokedClaude ? 'sets' : 'omits'} "disable-model-invocation: true" but agents/openai.yaml ${userInvokedCodex ? 'sets' : 'omits'} "policy.allow_implicit_invocation: false"`,
        );
    }
}

// --- Agents ---------------------------------------------------------------------------------------------

// The two subagents ship with the plugin, so they run on whatever model the user's harness gives them. A
// `model:` pin would silently override that with one the maintainer happened to prefer — PORTING.md rule 6
// bans it, and nothing else checks.
for (const agentFile of ['meldom-reviewer.md', 'meldom-worker.md']) {
    let content;
    try {
        content = readFileSync(join(ROOT, 'agents', agentFile), 'utf8');
    } catch {
        fail(`agents/${agentFile}: missing`);
        continue;
    }
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)?.[1];
    if (frontmatter === undefined) {
        fail(`agents/${agentFile}: has no frontmatter block`);
        continue;
    }
    if (!/^name:\s*\S/m.test(frontmatter)) fail(`agents/${agentFile}: has no name`);
    if (!/^description:\s*\S/m.test(frontmatter)) fail(`agents/${agentFile}: has no description`);
    if (/^model:\s*\S/m.test(frontmatter)) {
        fail(`agents/${agentFile}: pins "model:" — an agent must run on whatever model the user's harness provides`);
    }
}

// Claude does not load a skill nested deeper than `skills/<name>/SKILL.md`, so one that sits deeper is
// invisible on that provider while working fine on Codex — the worst kind of difference to debug.
for (const file of allFiles(ROOT)) {
    const rel = relative(ROOT, file);
    if (!rel.endsWith('SKILL.md')) continue;
    // `relative()` uses the platform separator, so compare on a normalized copy: a hardcoded `/` would fail
    // every skill on Windows and take this file's own self-exemption below with it.
    const posix = rel.split(sep).join('/');
    if (!/^skills\/[^/]+\/SKILL\.md$/.test(posix)) fail(`${posix}: a SKILL.md must sit exactly at skills/<name>/SKILL.md`);
}

// --- Banned strings ------------------------------------------------------------------------------------

// Each of these shipped to a user at least once, and each is invisible on the user's side: a dead tracker key,
// a path into a repo they don't have, a setup step for a tracker this plugin doesn't use. All of them are gone
// now; this list is what stops them coming back through the next upstream sync.
const BANNED = [
    ['meldom-bundled', "the app's old ownership marker"],
    ['{{VERSION}}', 'nothing substitutes it in a plugin'],
    ['LOC-', 'a dead tracker key; the ticket-key placeholder is KEY-N'],
    ['.out-of-scope/', 'the out-of-scope KB is meldom notes, not a directory'],
    ['gh issue', 'meldom is the tracker; there is no GitHub issue surface'],
    ['docs/agents/issue-tracker.md', "another tracker's config file; meldom needs none"],
    // The whole `lsp_*` family, not one member of it: the rule is "name no harness-specific tool", and
    // `lsp_servers` or `lsp_find_references` would sail past a check that only knows `lsp_diagnostics`.
    ['lsp_', 'a harness-specific tool name; say "the harness LSP tool" instead'],
    // Any path under the app's runtime dir, not just the log one.
    ['~/.meldom/', "the Meldom app's own runtime path, meaningless on a user's machine"],
    // This repo's own ticket prefix. Meaningless on a user's board, and the ledger's rule 5 bans it.
    ['MEL-', "this repo's own ticket prefix; the placeholder in prose is KEY-N"],
    ['setup-matt-pocock-skills', 'a tombstoned upstream skill this plugin does not ship'],
];

// `PORTING.md` and `CHANGELOG.md` legitimately NAME what was removed: the ledger explains each divergence, and
// history cannot be rewritten to hide a string it recorded. Everything else is checked.
const BANNED_EXEMPT = new Set(['PORTING.md', 'CHANGELOG.md']);

for (const file of allFiles(ROOT)) {
    const rel = relative(ROOT, file);
    // This file NAMES the banned strings in order to ban them, so it checks itself by identity rather than by
    // path — a second script under `scripts/` gets no exemption.
    if (rel === join('scripts', 'validate.mjs')) continue;
    if (BANNED_EXEMPT.has(rel)) continue;
    let content;
    try {
        content = readFileSync(file, 'utf8');
    } catch {
        continue;
    }
    for (const [needle, why] of BANNED) {
        if (content.includes(needle)) fail(`${rel}: contains "${needle}" — ${why}`);
    }
}

// --- The map, the README, and the ledger -----------------------------------------------------------------

// A skill nobody can find is a skill nobody runs. `ask-meldom` is the map an agent loads when it is unsure
// which skill fits, and the README table is the same list for a human browsing the repo.
const routerPath = join('skills', 'ask-meldom', 'SKILL.md');
let router = '';
try {
    router = readFileSync(join(ROOT, routerPath), 'utf8');
} catch {
    fail(`${routerPath}: missing — it is the map over every skill`);
}
let readme = '';
try {
    readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
} catch {
    fail('README.md: missing');
}
// A bare `includes` would let a LONGER name satisfy a shorter one: `meldom:implement-spec` contains
// `meldom:implement`, so dropping every `implement` mention from the router would still pass. Require a
// non-name character (or the end of the text) right after the name, so each match stands on its own.
function namesSkill(text, name) {
    return new RegExp(`meldom:${name}(?![a-z0-9-])`).test(text);
}

for (const name of skillNames) {
    // The router does not list itself; everything else must be in it.
    if (name !== 'ask-meldom' && router && !namesSkill(router, name)) {
        fail(`${routerPath}: never names "meldom:${name}" — a skill missing from the map is one nobody can find`);
    }
    // Scoped to a TABLE ROW, not the whole document: prose elsewhere in the README mentions skills by name
    // (`the ask-meldom map`), so a document-wide search would call a deleted row present.
    if (!new RegExp(`^\\|\\s*\`${name}\`\\s*\\|`, 'm').test(readme)) {
        fail(`README.md: the skill table has no row for "${name}"`);
    }
}

// The ledger is the single source of truth for "what we changed and why". A mapped skill with no section there
// makes the next sync unable to tell a real upstream change from a deliberate local edit.
let porting = '';
try {
    porting = readFileSync(join(ROOT, 'PORTING.md'), 'utf8');
} catch {
    fail('PORTING.md: missing — it is the divergence ledger every sync reads');
}
{
    // The paragraph that lists the skills with no upstream source. Everything NOT in it is a port, and a port
    // owes the ledger a `### <name>` section naming its divergences.
    const meldomOnly = /\*\*Meldom-only, no upstream source\.\*\*([\s\S]*?)\r?\n\r?\n/.exec(porting)?.[1] ?? '';
    for (const name of skillNames) {
        if (meldomOnly.includes(`\`${name}\``)) continue;
        // `\b` matches before a hyphen, so `^### implement\b` would accept `### implement-spec`. Demand a
        // space or end of line after the name, the way the real headings are written.
        if (!new RegExp(`^### ${name}(?: |$)`, 'm').test(porting)) {
            fail(`PORTING.md: no "### ${name}" divergence section — a ported skill must say what it changed, or be listed as Meldom-only`);
        }
    }
}

// --- Report --------------------------------------------------------------------------------------------

if (errors.length > 0) {
    for (const error of errors) console.error(`error: ${error}`);
    console.error(`\n${errors.length} problem(s) found.`);
    process.exit(1);
}
console.log(`ok: ${skillNames.length} skill(s), both manifests at ${claudePlugin?.version}`);
