// Generates rules/elaichi.mdc from the vendored skills/elaichi-conventions/SKILL.md.
//
// The same base facts have to reach a Cursor session (which has an
// always-applied rule primitive) and a Claude Code session (which does not,
// so the same content ships as a model-invoked skill). Two hand-kept copies
// drifted within a day, so there is one source and this derives the other.
//
// This used to run in trutohq/elaichi-skills, and the rule was vendored here
// with the skills. The Claude plugin directory refuses an .mdc file in a
// plugin, so elaichi-skills no longer ships the rule: this repo, which is the
// Cursor install, derives it from the skill it already vendors.
// scripts/sync-skills.mjs calls renderRule() so --check catches a stale rule.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = join(import.meta.dirname, '..')
export const SOURCE = join('skills', 'elaichi-conventions', 'SKILL.md')
export const OUT = join('rules', 'elaichi.mdc')

export function renderRule(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error(`No frontmatter in ${SOURCE}`)

  const description = (match[1].match(/^description:\s*(.+)$/m)?.[1] ?? '').trim()
  if (!description) throw new Error(`No description in ${SOURCE}`)

  const body = match[2].replace(/^\s+/, '')

  return `---
description: ${description}
globs:
alwaysApply: true
---

<!-- Generated from skills/elaichi-conventions/SKILL.md by scripts/generate-rule.mjs. Edit that skill in trutohq/elaichi-skills, not this file. -->

${body}`
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(join(root, OUT), renderRule(readFileSync(join(root, SOURCE), 'utf-8')))
  console.log(`Wrote ${OUT}`)
}
