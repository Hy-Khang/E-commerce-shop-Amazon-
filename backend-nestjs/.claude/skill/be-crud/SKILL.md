---
name: be-crud
description: >
  Generate a complete NestJS backend feature with entities, repositories, DTOs, service, controller, and module.
  Use when user says "generate backend feature", "create CRUD for", "scaffold feature", "be-crud".
argument-hint: "<feature-name> (e.g., product, cart, order, review, auth, user-profile)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Backend CRUD Feature Generator

**Scope:** Scaffold one feature module under `src/features/<feature-name>/`. Does NOT touch other features.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required
2. **Project initialized?** `src/app.module.ts` must exist
3. **Feature already exists?** If `src/features/<feature-name>/` has real files → ask overwrite or skip
4. **Common layer exists?** `src/common/` must have guards, interceptors, filters, decorators

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `DATABASE.md` | Entity fields, types, constraints, relations, indexes |
| `API_SPEC.md` | Endpoints, request/response format, error codes, auth levels |
| `BE-ARCHITECTURE.md` | Folder structure, layer responsibilities, cross-feature dependencies |
| `BE-PROJECT-RULES.md` | Naming, code patterns, repository pattern, validation, anti-patterns |

All generation must follow conventions from these docs. Do not invent patterns — use what's documented.

---

## Workflow

### Step 1: Identify Feature Scope

Map `<feature-name>` to owned entities:

| Feature | Entities |
|---------|----------|
| `auth` | roles, users, refresh_tokens |
| `user-profile` | addresses |
| `product` | categories, products, product_variants, product_images |
| `cart` | carts, cart_items |
| `order` | orders, order_items |
| `review` | reviews |

From the docs, identify: endpoints, cross-feature dependencies, events emitted/listened.

### Step 2: Present Plan & Confirm

**STOP before writing code.** Show the user:

- Feature name and owned entities
- Files to create (with paths)
- Files to update (e.g., `app.module.ts`)
- Endpoints from API_SPEC.md
- Cross-feature dependencies (modules imported, services injected)
- Events emitted or listened to

Ask: **"Proceed? (yes / adjust)"** — do NOT generate until confirmed.

### Step 3: Generate Feature Files

Generate all files following BE-PROJECT-RULES.md conventions:

| File | Location | Key rule |
|------|----------|----------|
| Entities | `entities/<entity>.entity.ts` | One per entity, columns + relations from DATABASE.md |
| Repositories | `repositories/<entity>.repository.ts` | `@Injectable()`, wraps `@InjectRepository`, all data access here |
| DTOs | `dto/create-<entity>.dto.ts`, `update-<entity>.dto.ts`, `<entity>-response.dto.ts` | `class-validator` + `@ApiProperty()`, update uses `PartialType` |
| Service | `<feature>.service.ts` | All business logic, inject own repos + cross-feature services via DI |
| Controller | `<feature>.controller.ts` | Thin — route, extract params, delegate to service |
| Module | `<feature>.module.ts` | `TypeOrmModule.forFeature([...entities])`, export service only |
| Types | `types/<feature>.types.ts` | Enums, filter param interfaces, event payload interfaces |
| Utils | `utils/<feature>.util.ts` | Domain-specific pure functions only |
| Tests | `tests/<feature>.controller.spec.ts`, `<feature>.service.spec.ts` | Unit test skeletons, Arrange → Act → Assert |
| Context | `context.md` | Feature purpose, entities, dependencies, key decisions |

### Step 4: Register & Verify

- Add feature module to `src/app.module.ts` imports
- Verify no circular dependencies
- Verify cross-feature imports use module exports only (never direct repo/entity imports)
- Run `npm run build` to verify zero errors

---

## Output

```
✅ Feature "<feature-name>" created!

📁 Files CREATED:
- src/features/<feature-name>/
  ├── <feature-name>.module.ts
  ├── <feature-name>.controller.ts
  ├── <feature-name>.service.ts
  ├── entities/
  │   └── <entity>.entity.ts          (per entity)
  ├── repositories/
  │   └── <entity>.repository.ts      (per entity)
  ├── dto/
  │   ├── create-<entity>.dto.ts
  │   ├── update-<entity>.dto.ts
  │   └── <entity>-response.dto.ts
  ├── types/
  │   └── <feature-name>.types.ts
  ├── utils/
  │   └── <feature-name>.util.ts
  ├── tests/
  │   ├── <feature-name>.controller.spec.ts
  │   └── <feature-name>.service.spec.ts
  └── context.md

📝 Files UPDATED:
- src/app.module.ts                   (added feature module to imports)

⚠️ Risks / Notes:
- If cross-feature dependencies exist, ensure dependent modules are already generated
- Migrations are NOT auto-generated — run `npx typeorm migration:generate` separately

🚀 Next steps:
1. Run `npm run build` to verify compilation
2. Generate migration if needed
3. Run `npm run start:dev` to verify endpoints in Swagger at `/api/v1/docs`
```

---

## Important Rules

1. **Layer separation is strict** — Controllers: routing only. Services: business logic. Repositories: data access.
2. **Cross-feature via module exports + DI** — import MODULE, inject SERVICE. Use EventEmitter2 for async side effects.
3. **Never return raw entities** — map to response DTOs. Never expose `password_hash`, `token_hash`, `is_revoked`.
4. **Error codes from API_SPEC.md** — follow `[FEATURE]_[3-digit]` format, throw NestJS built-in or custom exceptions.
5. **Follow the docs** — all patterns (repository, guards, DTOs, Swagger, validation) are in BE-PROJECT-RULES.md.

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature not in known list | Ask user to provide entity definitions, endpoints, and dependencies manually |
| Feature directory already exists | Ask: "Feature `<name>` already exists. Overwrite, merge, or skip?" |
| Dependent feature module not found | Warn and proceed without cross-feature injection |
| `src/common/` missing | Suggest: "Generate common layer first (guards, interceptors, filters, decorators)" |
| DATABASE.md or API_SPEC.md not found | Ask user to provide entity schema and endpoint definitions manually |
