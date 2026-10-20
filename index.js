// The OpenCode plugin: `opencode plugin add github:meldomapp/skills`. Claude Code and Codex read the plugin
// manifests and never load this file.
//
// OpenCode reads no Claude or Codex plugin, so this registers every `skills/<name>/SKILL.md` itself, as the
// ID `meldom:<name>`. That is the name the skills use for each other, and no skill of the user's can shadow it.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const SKILLS = new URL('./skills/', import.meta.url);

export default {
    id: 'meldom.skills',
    async setup(ctx) {
        const folders = (await readdir(SKILLS, { withFileTypes: true })).filter((entry) => entry.isDirectory());
        const skills = await Promise.all(
            folders.map(async ({ name }) => {
                const file = new URL(`${name}/SKILL.md`, SKILLS);
                const { data, content } = matter(await readFile(file, 'utf8'));
                return {
                    id: `meldom:${name}`,
                    name: `meldom:${name}`,
                    description: data.description,
                    autoinvoke: data['disable-model-invocation'] !== true,
                    path: fileURLToPath(file),
                    content,
                };
            }),
        );
        await ctx.skill.transform((editor) => {
            for (const skill of skills) editor.add(skill);
        });
    },
};
