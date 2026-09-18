# Vendored from trutohq/elaichi-skills — do not edit here

Everything under `skills/` in this repo is a **copy**, not the source. The
source of truth is [trutohq/elaichi-skills](https://github.com/trutohq/elaichi-skills)
— edit a skill there, merge it, then run `node scripts/sync-skills.mjs` in
*this* repo to pull the change in. `rules/elaichi.mdc` is vendored the same
way; see `rules/VENDORED.md`.

Direction of copy: `elaichi-skills` → `elaichi-cursor-plugin`, always.

Editing a file under `skills/` directly in this repo will be silently
overwritten the next time someone runs the sync script, and
`.github/workflows/check-vendor-drift.yml` will fail on this repo's own `main`
branch the moment it disagrees with `elaichi-skills` main — see that
workflow and `scripts/sync-skills.mjs` for why the split exists (Cursor
plugin names must be unique, so the dedicated Cursor plugin and the
skills-source repo cannot be the same repo).
