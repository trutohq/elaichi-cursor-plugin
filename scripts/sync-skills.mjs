// Vendors `skills/` and `rules/elaichi.mdc` from the source of truth,
// trutohq/elaichi-skills, into this repo.
//
// DIRECTION OF COPY: elaichi-skills -> elaichi-cursor-plugin, always. This
// repo's `skills/` and `rules/` are a VENDORED, READ-ONLY COPY, not authored
// here (see skills/VENDORED.md and rules/VENDORED.md). Never hand-edit a
// vendored file. Edit the original in trutohq/elaichi-skills, merge it there,
// then re-run this script here and commit what changes.
//
// Why a copy instead of a submodule: Cursor installs a plugin from the repo
// tree it fetches. A git submodule is a pointer, not content — if Cursor's
// installer doesn't run `git submodule update --init`, the plugin ships with
// `skills/` and `rules/` as empty directories, so every skill would silently
// not exist for anyone who installed it. A plain copy has no such failure
// mode.
//
// Why this repo exists separately from elaichi-skills at all: Cursor plugin
// names must be unique, and this is the plugin actually submitted to and
// listed on the Cursor marketplace — see .cursor-plugin/plugin.json's
// "name": "elaichi". elaichi-skills' OWN `.cursor-plugin/plugin.json` is
// named "elaichi-skills" and deliberately does not declare `mcpServers`, so
// installing both never double-registers the MCP server. See the header
// comment in elaichi-skills' scripts/validate-plugin-manifests.mjs for that
// repo's side of the arrangement.
//
// elaichi-skills has no CI job that knows this repo exists, so a change
// there does not automatically reach here. .github/workflows/
// check-vendor-drift.yml is what closes that gap: it runs this script in
// --check mode on a schedule and on every push to main, and fails loudly,
// naming the stale files, the moment the two disagree.
//
// Usage:
//   node scripts/sync-skills.mjs          # pull the latest copy in and report what changed
//   node scripts/sync-skills.mjs --check  # fail (without writing) if the vendored copy is stale
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, cpSync, existsSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '..')
const SOURCE_REPO = 'https://github.com/trutohq/elaichi-skills.git'
const check = process.argv.includes('--check')

// Local-only documentation that explains the vendoring, not part of the
// vendored content itself — elaichi-skills has no such file, and it should
// stay that way, so it is never part of the drift comparison.
const LOCAL_ONLY = new Set(['VENDORED.md'])

const tmp = mkdtempSync(join(tmpdir(), 'elaichi-skills-sync-'))
try {
  execFileSync('git', ['clone', '--depth', '1', '--quiet', SOURCE_REPO, tmp], { stdio: 'pipe' })

  const targets = [
    { src: join(tmp, 'skills'), dest: join(root, 'skills') },
    { src: join(tmp, 'rules', 'elaichi.mdc'), dest: join(root, 'rules', 'elaichi.mdc') },
  ]

  const changed = []
  for (const { src, dest } of targets) collectDiffs(src, dest, changed)
  changed.sort()

  if (changed.length === 0) {
    console.log('Vendored skills/ and rules/elaichi.mdc already match trutohq/elaichi-skills main. Nothing to do.')
    process.exit(0)
  }

  console.log(`${changed.length} vendored file(s) differ from trutohq/elaichi-skills main:`)
  for (const f of changed) console.log(`  ${f}`)

  if (check) {
    console.error('\nThe vendored copy is stale. Run `node scripts/sync-skills.mjs` to update it, then commit.')
    process.exit(1)
  }

  for (const { src, dest } of targets) {
    rmSync(dest, { recursive: true, force: true })
    cpSync(src, dest, { recursive: true })
  }
  console.log('\nVendored copy updated. Review the diff and commit.')
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

/**
 * Walks both `src` and `dest` (each a file or a directory) and records the
 * repo-relative path of every entry whose content differs, or that exists on
 * only one side, so callers can name the exact stale files instead of just
 * saying "different".
 */
function collectDiffs(src, dest, out) {
  const srcIsFile = existsSync(src) && statSync(src).isFile()
  if (srcIsFile) {
    if (!existsSync(dest) || !filesEqual(src, dest)) out.push(relative(root, dest))
    return
  }

  const srcFiles = existsSync(src) ? walk(src) : []
  const destFiles = existsSync(dest) ? walk(dest) : []
  const all = new Set([...srcFiles, ...destFiles])
  for (const rel of all) {
    const a = join(src, rel)
    const b = join(dest, rel)
    if (!existsSync(a) || !existsSync(b) || !filesEqual(a, b)) out.push(relative(root, b))
  }
}

function filesEqual(a, b) {
  return readFileSync(a).equals(readFileSync(b))
}

function walk(dir, prefix = '') {
  const out = []
  for (const entry of readdirSync(dir)) {
    if (LOCAL_ONLY.has(entry)) continue
    const full = join(dir, entry)
    const rel = prefix ? join(prefix, entry) : entry
    if (statSync(full).isDirectory()) out.push(...walk(full, rel))
    else out.push(rel)
  }
  return out
}
