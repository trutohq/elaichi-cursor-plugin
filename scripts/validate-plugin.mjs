// Validates .cursor-plugin/plugin.json, mcp.json, and the components they
// declare (skills/, rules/) against Cursor's plugin schema and marketplace
// submission checklist (https://cursor.com/docs/reference/plugins):
//
//   - name is unique, lowercase, kebab-case
//   - version is semver
//   - author has no undocumented fields (name/email only)
//   - all paths in the manifest are relative and valid (no "..", no
//     absolute paths), and resolve to a real file/directory on disk
//   - mcp.json declares a server at the one Elaichi endpoint
//   - every vendored SKILL.md has valid frontmatter (name, description)
//   - the vendored rule (.mdc) has valid frontmatter (description,
//     alwaysApply, globs)
//
// This repo had no validation at all before this script — five files felt
// too small to need it, until skills/ and rules/ were vendored in from
// trutohq/elaichi-skills and "five files" became a couple dozen. Vendoring
// is exactly where an absolute path or a stripped-frontmatter file sneaks
// in unnoticed, which is why the path and frontmatter checks below exist.
//
// This repo and trutohq/elaichi-skills share no CI: this script only ever
// sees what's committed HERE. If you're changing the MCP endpoint URL, the
// author contact, or the brand pitch, check trutohq/elaichi-skills too —
// nothing here will catch drift between the two beyond the vendored
// skills/rules tree, which scripts/sync-skills.mjs and
// .github/workflows/check-vendor-drift.yml cover separately.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'

const root = join(import.meta.dirname, '..')
const errors = []

const EXPECTED_MCP_URL = 'https://api.elaichi.ai/mcp'
const NAME_RE = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/
const AUTHOR_FIELDS = ['name', 'email']
const PATH_FIELDS = ['logo', 'skills', 'rules', 'agents', 'commands', 'mcpServers']

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf-8'))
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null
  const fields = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (kv) fields[kv[1]] = kv[2].trim()
  }
  return fields
}

// --- plugin.json -----------------------------------------------------------

const manifest = readJson('.cursor-plugin/plugin.json')

if (typeof manifest.name !== 'string' || !NAME_RE.test(manifest.name)) {
  errors.push(`plugin.json: "name" must be lowercase kebab-case, got ${JSON.stringify(manifest.name)}`)
}

if (manifest.version !== undefined && !SEMVER_RE.test(manifest.version)) {
  errors.push(`plugin.json: "version" is not valid semver, got ${JSON.stringify(manifest.version)}`)
}

if (manifest.author !== undefined) {
  if (typeof manifest.author !== 'object' || manifest.author === null || Array.isArray(manifest.author)) {
    errors.push('plugin.json: "author" must be an object')
  } else {
    if (typeof manifest.author.name !== 'string' || manifest.author.name.length === 0) {
      errors.push('plugin.json: "author.name" is required')
    }
    const undocumented = Object.keys(manifest.author).filter(k => !AUTHOR_FIELDS.includes(k))
    if (undocumented.length > 0) {
      errors.push(
        `plugin.json: "author" has undocumented field(s) ${undocumented.join(', ')} (documented: ${AUTHOR_FIELDS.join(', ')})`
      )
    }
  }
}

// "All paths in manifest are relative and valid (no "..", no absolute
// paths)" — the submission checklist's own words.
for (const field of PATH_FIELDS) {
  const value = manifest[field]
  if (value === undefined) continue
  const candidates = Array.isArray(value) ? value : [value]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    if (isAbsolute(candidate)) {
      errors.push(`plugin.json: "${field}" is an absolute path (${candidate}), must be relative`)
      continue
    }
    if (candidate.split('/').includes('..')) {
      errors.push(`plugin.json: "${field}" contains "..", must not escape the plugin root (${candidate})`)
      continue
    }
    const resolved = join(root, candidate)
    if (!existsSync(resolved)) {
      errors.push(`plugin.json: "${field}" points at "${candidate}", which does not exist (resolved ${resolved})`)
    }
  }
}

// --- mcp.json ----------------------------------------------------------------

let mcp
try {
  mcp = readJson('mcp.json')
} catch (err) {
  errors.push(`mcp.json: invalid JSON or missing (${err.message})`)
}
if (mcp) {
  const urls = Object.values(mcp.mcpServers ?? {})
    .map(server => server && server.url)
    .filter(Boolean)
  if (!urls.includes(EXPECTED_MCP_URL)) {
    errors.push(`mcp.json: does not declare a server at ${EXPECTED_MCP_URL}; found ${JSON.stringify(urls)}`)
  }
}

// --- vendored skills/ and rules/ frontmatter --------------------------------
// Cursor's checklist: "All included components have valid files and
// frontmatter." A SKILL.md needs name + description; a rule .mdc needs
// description, alwaysApply and globs (the last two may be empty, but the
// key must be present).

if (existsSync(join(root, 'skills'))) {
  for (const dir of readdirSync(join(root, 'skills'))) {
    const skillPath = join(root, 'skills', dir)
    if (!statSync(skillPath).isDirectory()) continue
    const skillMd = join(skillPath, 'SKILL.md')
    if (!existsSync(skillMd)) {
      errors.push(`skills/${dir}: no SKILL.md`)
      continue
    }
    const fm = parseFrontmatter(readFileSync(skillMd, 'utf-8'))
    const where = `skills/${dir}/SKILL.md`
    if (!fm) {
      errors.push(`${where}: missing YAML frontmatter`)
      continue
    }
    if (!fm.name || !NAME_RE.test(fm.name)) {
      errors.push(`${where}: frontmatter "name" must be lowercase kebab-case, got ${JSON.stringify(fm.name)}`)
    }
    if (!fm.description) {
      errors.push(`${where}: frontmatter "description" is required`)
    }
  }
}

if (existsSync(join(root, 'rules'))) {
  for (const entry of readdirSync(join(root, 'rules'))) {
    if (!entry.endsWith('.mdc')) continue
    const where = `rules/${entry}`
    const raw = readFileSync(join(root, 'rules', entry), 'utf-8')
    const fm = parseFrontmatter(raw)
    if (!fm) {
      errors.push(`${where}: missing YAML frontmatter`)
      continue
    }
    if (!fm.description) errors.push(`${where}: frontmatter "description" is required`)
    if (!('alwaysApply' in fm)) errors.push(`${where}: frontmatter "alwaysApply" is required`)
    if (!('globs' in fm)) errors.push(`${where}: frontmatter "globs" is required`)
  }
}

if (errors.length > 0) {
  console.error(`Plugin validation failed (${errors.length}):`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log('Validated plugin.json, mcp.json, and the vendored skills/rules frontmatter. All clean.')
