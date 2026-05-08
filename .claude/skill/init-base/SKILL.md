---
name: init-base
description: >
  Initialize the base project for the e-commerce fullstack app (NestJS + React).
  Scaffolds folder structure, installs dependencies, creates .env.example, and writes minimum infrastructure code
  for core/shared/common/config. Does NOT create feature business logic.
  Derives structure from architecture docs at runtime.
  Usage: "init fe" (frontend only), "init be" (backend only), "init both" (BE first, then FE).
  If target not specified, ask the user before proceeding.
---

# Init Base Project

**This is a process document.** Derive folder structures and file lists by reading the architecture docs at runtime — do NOT rely on hardcoded lists in this file. The docs are the single source of truth.

If target is `both` → run **Task BE** first, complete all phases, then run **Task FE**.

---

## Phase 0: Pre-execution Verification

**MUST pass before any task.** If any check fails → STOP immediately, report exactly which item is missing.

Only check items relevant to the selected target.

1. **Working directory** — must be the project root (contains `frontend-react/`, `backend-nestjs/`, `share-docs/`)
2. **Target directory + package.json:**
   - FE: `frontend-react/` and `frontend-react/package.json`
   - BE: `backend-nestjs/` and `backend-nestjs/package.json`
3. **Required docs:**
   - FE: `frontend-react/docs/FE-ARCHITECTURE.md`, `frontend-react/docs/FE-PROJECT-RULES.md`, `share-docs/API_SPEC.md`
   - BE: `backend-nestjs/docs/BE-ARCHITECTURE.md`, `backend-nestjs/docs/BE-PROJECT-RULES.md`, `share-docs/API_SPEC.md`, `share-docs/DATABASE.md`

---

## Task FE — Frontend Init

### Phase 1: Read FE Docs

Read ALL of these files BEFORE any execution:

1. `frontend-react/docs/FE-ARCHITECTURE.md` — folder structure, feature anatomy, data flow patterns
2. `frontend-react/docs/FE-PROJECT-RULES.md` — naming conventions, code patterns, component rules
3. `share-docs/API_SPEC.md` — endpoint list to confirm feature names, response format for API types

**Rule:** Do NOT install anything, create anything, or write any code before reading all required docs.

### Phase 2: Install FE Dependencies

Read `frontend-react/package.json` first. Only install packages NOT already present.
If `node_modules/` does not exist → run `npm install` first to install base deps.

Run from `frontend-react/`:
```
npm install tailwindcss@latest @tailwindcss/vite @tanstack/react-query zustand axios react-router-dom react-hook-form @hookform/resolvers zod lucide-react
```

Verify install succeeded by checking `package.json` contains the new packages. On failure → STOP.

### Phase 3: Create FE Folder Structure

Read `FE-ARCHITECTURE.md` Section 2 (Folder Structure) to derive the complete directory tree. Create all directories defined there.

Add `.gitkeep` only to empty directories that would otherwise be omitted by Git. Do not add `.gitkeep` to directories that already contain files or subdirectories. Note: `.gitkeep` placed here may be removed in Phase 5 if files are later added to the directory.

Examples (not exhaustive — derive from docs):
```
src/core/providers/
src/shared/components/ui/
src/features/auth/{components,hooks,...}/
```

### Phase 4: Create FE `.env.example`

Create `frontend-react/.env.example`. If it already exists → append only missing variables, never duplicate existing keys.

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Phase 5: Create FE Base Modules

Create only the **minimum infrastructure code** required for:
- **Successful TypeScript compilation** (`npx tsc --noEmit` passes)
- **Architecture wiring** (providers, router shell, layouts shell, Axios instance)
- **Reusable shared infrastructure** (types, constants, utils that other features will import)

Create files in `core/`, `shared/`, and `styles/`. For `features/`, only create `index.ts` (empty barrel) and `context.md` per feature — **no business logic.** After adding files to a directory, remove any `.gitkeep` that was placed there in Phase 3.

Read `FE-ARCHITECTURE.md` and `FE-PROJECT-RULES.md` to determine which files to create.

Examples (not exhaustive — derive from docs):
- `src/core/api/axios-instance.ts` — Axios instance + interceptors
- `src/core/api/api.types.ts` — shared API response types
- `src/core/providers/AppProviders.tsx` — QueryClient + providers
- `src/shared/constants/routes.ts` — ROUTES object
- `src/styles/globals.css` — Tailwind v4 directives
- `src/features/auth/index.ts` — empty barrel export
- Update `src/App.tsx`, `src/main.tsx` to wire up providers + router
- Update `vite.config.ts` to add Tailwind v4 plugin + `resolve.alias` for `@/`

### Phase 6: Verify FE

1. All directories from `FE-ARCHITECTURE.md` exist
2. Empty leaf dirs have `.gitkeep`
3. Dependencies present in `package.json`
4. `.env.example` created
5. Run `npx tsc --noEmit` — base modules compile
6. `features/` has only `index.ts` (empty barrel) and `context.md` per feature — no business logic. Sub-directories within features that have no files should have `.gitkeep`.

---

## Task BE — Backend Init

### Phase 1: Read BE Docs

Read ALL of these files BEFORE any execution:

1. `backend-nestjs/docs/BE-ARCHITECTURE.md` — folder structure, feature anatomy, request flow, cross-feature communication
2. `backend-nestjs/docs/BE-PROJECT-RULES.md` — naming conventions, code patterns, repository pattern, error handling
3. `share-docs/API_SPEC.md` — endpoint list to confirm feature names, response/error format for interceptors/filters
4. `share-docs/DATABASE.md` — entity list to confirm feature ownership, TypeORM patterns for data-source config

**Rule:** Do NOT install anything, create anything, or write any code before reading all required docs.

### Phase 2: Install BE Dependencies

Read `backend-nestjs/package.json` first. Only install packages NOT already present.
If `node_modules/` does not exist → run `npm install` first to install base deps.

Run from `backend-nestjs/`:
```
npm install @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport @nestjs/typeorm @nestjs/event-emitter typeorm mssql passport passport-jwt bcrypt class-validator class-transformer joi swagger-ui-express uuid
```
```
npm install -D @types/passport-jwt @types/bcrypt
```

Verify install succeeded by checking `package.json` contains the new packages. On failure → STOP.

### Phase 3: Create BE Folder Structure

Read `BE-ARCHITECTURE.md` Section 2 (Folder Structure) to derive the complete directory tree. Create all directories defined there.

Add `.gitkeep` only to empty directories that would otherwise be omitted by Git. Do not add `.gitkeep` to directories that already contain files or subdirectories. Note: `.gitkeep` placed here may be removed in Phase 5 if files are later added to the directory.

Examples (not exhaustive — derive from docs):
```
src/config/
src/common/decorators/
src/features/auth/{repositories,dto,...}/
```

### Phase 4: Create BE `.env.example`

Create `backend-nestjs/.env.example`. If it already exists → append only missing variables, never duplicate existing keys.

Variables from `BE-ARCHITECTURE.md` Section 7:
```env
# App
APP_PORT=3000
APP_PREFIX=api/v1
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development

# Database (SQL Server)
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=your_password_here
DB_DATABASE=ecommerce_shop

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRY=7d
```

### Phase 5: Create BE Base Modules

Create only the **minimum infrastructure code** required for:
- **Successful TypeScript compilation** (`npx tsc --noEmit` passes)
- **Architecture wiring** (config registration, database module, global providers in main.ts)
- **Reusable shared infrastructure** (decorators, guards, interceptors, filters, pipes, DTOs, constants that features will import)

Create files in `config/`, `core/`, and `common/`. For `features/`, only create `index.ts` (empty barrel) and `context.md` per feature — **no business logic.** After adding files to a directory, remove any `.gitkeep` that was placed there in Phase 3.

Read `BE-ARCHITECTURE.md` and `BE-PROJECT-RULES.md` to determine which files to create.

Examples (not exhaustive — derive from docs):
- `src/config/*.config.ts` — env config registration
- `src/core/database/database.module.ts` — TypeORM setup
- `src/common/decorators/` — generic reusable decorators required by the architecture docs
- `src/common/interceptors/transform.interceptor.ts` — response wrapper
- `src/common/filters/http-exception.filter.ts` — error format
- `src/features/auth/index.ts` — empty barrel export
- Update `src/main.ts`, `src/app.module.ts` to wire up base modules
- `src/main.ts` — after `app.listen()`, log startup info: app URL, global prefix, environment

### Phase 6: Verify BE

1. All directories from `BE-ARCHITECTURE.md` exist
2. Empty leaf dirs have `.gitkeep`
3. Dependencies present in `package.json`
4. `.env.example` created
5. Run `npx tsc --noEmit` — base modules compile
6. `features/` has only `index.ts` (empty barrel) and `context.md` per feature — no business logic. Sub-directories within features that have no files should have `.gitkeep`.

---

## Output

After all phases complete successfully, print a summary report:

### 1. Directories Created
List all new directories created (excluding those that already existed).

### 2. Dependencies Installed
List packages added to `package.json` (grouped: production / dev).

### 3. Files Created
List all new files created (base modules, barrel exports, context.md, .env.example, .gitkeep).

### 4. Files Modified
List existing files that were updated (App.tsx, main.ts, tsconfig.json, vite.config.ts, etc.).

### 5. Verification Result
- TypeScript compilation: PASS / FAIL
- If FAIL: list errors encountered and fixes attempted

### 6. Skipped Items
List any items skipped because they already existed.

### 7. Next Steps
Suggest what the user should do next after setup completes. Examples:
- Copy `.env.example` to `.env` and fill in real values
- Start dev server (`npm run start:dev` for BE, `npm run dev` for FE)
- Begin implementing the first feature (e.g. auth)
- Run migrations if database is ready

---

## Failure Handling

| Failure | Action |
|---------|--------|
| Doc file not found | STOP. Report which doc is missing. |
| `npm install` fails | STOP. Report error output. |
| Directory creation fails | STOP. Report which directory and the error. |
| TypeScript compilation error | Attempt to fix ONLY files created during this execution or explicitly allowed files. Maximum 2 fix attempts. If still failing → STOP and report. |
| Already initialized (files exist) | SKIP existing. Report which were skipped. |
| `.env.example` already exists | Append only missing variables. Never duplicate existing keys. |

**General rule:** On any failure, STOP immediately. Report the error clearly. Do NOT continue to the next phase.

---

## File Modification Rules

### Allowed to modify:
- `package.json` / `package-lock.json` (via npm install)
- FE: `src/App.tsx`, `src/main.tsx` — **replace entirely** (remove Vite demo code, write architecture wiring)
- BE: `src/main.ts`, `src/app.module.ts` — **replace entirely** (remove NestJS demo code, write architecture wiring)
- `tsconfig.json` — **only** to add `paths` alias (`"@/*": ["./src/*"]`)
- `vite.config.ts` — **only** for architecture-required alias or Tailwind integration

### Allowed to create:
- New directories + `.gitkeep`
- `.env.example`
- Base module files in `core/`, `shared/`, `styles/` (FE) or `config/`, `core/`, `common/` (BE)
- Per-feature `index.ts` (empty barrel) and `context.md` in each feature directory

### NEVER modify:
- Secondary tsconfig variants (`tsconfig.build.json`, `tsconfig.app.json`, etc.) — do not modify unless explicitly required
- `eslint.config.*`, `nest-cli.json`, `.prettierrc`
- `index.html`
- Any file not listed above
