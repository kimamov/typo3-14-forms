# AGENTS.md

Context for AI agents working in this repository.

## Project overview

This monorepo contains two related products:

| Product | Scope | Audience |
|---------|-------|----------|
| **FormLayer** | Generic, framework-free form library | Any server-rendered HTML stack |
| **T13 Forms** | TYPO3 EXT:form integration (sitepackage + PHP backend) | TYPO3 CMS projects |

**FormLayer** progressively enhances native `<form>` elements with TypeScript controllers — validation, plugins, events, loading state, and pluggable submit handling. No React, Vue, or SPA framework required.

**T13 Forms** wraps FormLayer for TYPO3: AJAX submit, multistep remounting, client variants, Altcha, options import, and PHP middleware.

## Tech stack

### Frontend (FormLayer)

- **TypeScript** (~6.x), **Vite** 8, **Vitest** + jsdom
- **Zero third-party runtime deps** in core `formlayer`
- Optional plugins: `@formlayer/plugin-datepicker` (air-datepicker), `@formlayer/plugin-altcha` (altcha)
- Built as preserved ESM modules for tree-shaking
- TYPO3 dev integration via `vite-plugin-typo3`

### Backend (T13 Forms)

- **TYPO3 CMS 14.3**, **PHP 8.2**
- EXT:form, Fluid templates, PSR-15 middleware
- Composer path repo: `packages/sitepackage`
- PHPUnit for PHP unit tests
- **DDEV** for local TYPO3 environment

### Documentation

- **Astro + Starlight** at `docs/formlayer/`
- Interactive demos in `docs/formlayer/public/demos/`
- Library bundle copied to `docs/formlayer/public/formlayer/` via `npm run build:lib`

## Repository layout

```
formlayer/            # Standalone npm monorepo (publishable)
  src/                # Core FormLayer (no third-party deps)
  packages/
    plugin-datepicker/  # @formlayer/plugin-datepicker
    plugin-altcha/      # @formlayer/plugin-altcha
  tests/
  docs/

src/                  # Monorepo copy used by TYPO3 site (vite-plugin-typo3)
  forms/              # Generic FormLayer (framework-agnostic)
  typo3/              # TYPO3 integration layer (composition, not fork)

tests/                # Vitest tests for generic layer (monorepo)

packages/sitepackage/ # TYPO3 extension (T13 Forms)
  Classes/            # Middleware, listeners, ViewHelpers, services
  Resources/          # Fluid templates, JS modules, form definitions
  Configuration/      # Middleware, routes, Services.yaml

docs/formlayer/       # Starlight docs (monorepo copy; source of truth → formlayer/docs/)
```

## Architecture principles

### Two layers, composition over extension

- **`src/forms/`** must stay **TYPO3-agnostic**. No TYPO3 imports, no CMS-specific logic.
- **`src/typo3/`** configures the generic layer: registers plugins/validators, wires submit, handles remount/unmount for multistep.
- Do **not** copy generic code into the TYPO3 layer. Extend via hooks, options, and composition.

### Progressive enhancement

- Server-rendered HTML is the baseline; forms must work without JavaScript.
- FormLayer strips native constraint attributes at runtime and replaces them with its validation pipeline.
- Submit falls back to native form POST when AJAX fails (unless aborted).

### Data attributes drive behavior

- `data-form-field` — field wrapper
- `data-validate` — JSON validator rules
- `data-field-type` — lazy-loaded field plugin (combobox, or optional `@formlayer/plugin-*` packages)
- `data-loading` — toggled on submit button during submission (default loading UI)

### Event system

Three layers: **registry** (`form:registered`, …), **form** (`form:submit`, `form:loading`, …), **field** (value/validation changes).

### Multistep (TYPO3)

- PHP middleware returns JSON with `html` for next step or `message` on finish.
- `createTypo3Submit()` uses `remount()` / `unmount()` — never put this logic in `FormController`.

## Commands

From repo root:

```bash
npm run dev          # Vite dev (TYPO3 asset pipeline)
npm run build        # Vite production build
npm run build:lib    # Build FormLayer bundle → docs/formlayer/public/formlayer/
npm test             # Vitest (generic layer)
npm run test:watch
```

Docs site (`docs/formlayer/`):

```bash
npm run dev          # Astro dev server
npm run build        # Static docs build
```

PHP (from project root, via DDEV):

```bash
ddev composer install
ddev exec vendor/bin/phpunit -c packages/sitepackage
```

## Conventions for agents

### Do

- Match existing naming, types, and patterns in surrounding code.
- Keep diffs minimal and scoped to the requested change.
- Put generic behavior in `src/forms/`, TYPO3-specific behavior in `src/typo3/` or `packages/sitepackage/`.
- Add/update Vitest tests for generic layer changes.
- Update Starlight docs in `docs/formlayer/src/content/docs/` when changing public API or behavior.
- Run `npm test` after frontend changes; run relevant PHPUnit tests after PHP changes.

### Do not

- Add React/Vue/Angular dependencies or patterns.
- Put TYPO3 logic in `src/forms/`.
- Commit secrets (`.env`, credentials).
- Create git commits or push unless explicitly asked.
- Over-engineer: no extra abstractions for one-off use cases.

### Import paths (documentation / consumer code)

```typescript
import { formRegistry, initField, registerDefaultValidators } from 'formlayer';
import { initTypo3Forms } from 'formlayer/typo3';
import 'formlayer/forms.css';
```

The publishable npm package lives in `formlayer/`. The monorepo root `src/` is consumed by TYPO3 via `vite-plugin-typo3`.

Internal monorepo source uses relative imports; `'formlayer'` package names are for the npm package and docs.

## Key files

| File | Purpose |
|------|---------|
| `src/forms/form-controller.ts` | Per-form lifecycle, submit, loading state |
| `src/forms/field-controller.ts` | Per-field validation, plugins, ARIA errors |
| `src/forms/registry.ts` | Singleton registry, form discovery |
| `src/typo3/index.ts` | `initTypo3Forms()` — one-call TYPO3 setup |
| `src/typo3/submit.ts` | AJAX submit, multistep remount, finish handling |
| `packages/sitepackage/Classes/Middleware/AjaxFormSubmitMiddleware.php` | JSON responses for AJAX/multistep |
| `vite.config.lib.ts` | Library build config |
| `docs/formlayer/astro.config.mjs` | Docs site sidebar and title |

## Roadmap / future goals

These are planned but not yet implemented. Agents should align new work with this direction:

1. **`create-formlayer` CLI** — shadcn-style scaffold: `npm create formlayer@latest` copies `src/` + `tests/` into consumer projects.
2. **`formlayer update` command** — sync managed files from template with diff-aware overwrite (`--force`).
3. **pnpm workspace** — `packages/create-formlayer/` alongside the main repo.
4. **Publish FormLayer** as a copy-in library (own-the-code model), not a heavy runtime dependency.
5. **Docs**: Installation and Updating guides once the CLI exists.

When implementing the CLI, use **`formlayer`** (lowercase) for npm package/bin names and **`FormLayer`** for branding in prose.

## Naming reference

| Term | Meaning |
|------|---------|
| **FormLayer** | Generic form library (brand name) |
| **T13 Forms** | TYPO3 product / sitepackage extension |
| **t13-forms** | Root npm/composer project name |
| **sitepackage** | TYPO3 extension key (`packages/sitepackage/`) |
