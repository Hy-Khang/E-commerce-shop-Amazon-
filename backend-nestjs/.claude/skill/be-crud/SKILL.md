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

**Scope:** Scaffold a complete NestJS feature module following the project's architecture, conventions, and API spec. Generates entities, repositories, DTOs, service, controller, module, types, utils, and tests for a given feature.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required (e.g., `product`, `cart`, `order`, `review`, `auth`, `user-profile`)

2. **NestJS project initialized?** Check `src/app.module.ts` exists
   - If missing → Suggest: "Initialize the NestJS project first"

3. **Feature already exists?** Check `src/features/<feature-name>/` directory
   - If found → Ask: "Feature `<feature-name>` already exists. Overwrite or skip?"

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `DATABASE.md` | Entity fields, types, constraints, relations, indexes, TypeORM patterns |
| `API_SPEC.md` | Endpoints, request/response format, error codes, auth levels, pagination |
| `BE-ARCHITECTURE.md` | Folder structure, layer responsibilities, cross-feature communication, request flow |
| `BE-PROJECT-RULES.md` | Naming conventions, code patterns, anti-patterns, repository pattern, validation |

---

## Workflow

### Step 1: Identify Feature Scope

- Map `<feature-name>` to owned entities from DATABASE.md:
  - `auth` → roles, users, refresh_tokens
  - `user-profile` → addresses
  - `product` → categories, products, product_variants, product_images
  - `cart` → carts, cart_items
  - `order` → orders, order_items
  - `review` → reviews
- Identify endpoints from API_SPEC.md for this feature
- Identify cross-feature dependencies from BE-ARCHITECTURE.md dependency map

### Step 2: Generate Entities

- One file per entity at `src/features/<feature-name>/entities/<entity>.entity.ts`
- Use `@Entity('<table_name>')` with plural snake_case table name
- Column types from DATABASE.md:
  - Strings → `nvarchar` with specified length
  - Money → `decimal`, precision: 10, scale: 2
  - Booleans → `BIT` mapped as `boolean` with default
  - Timestamps → `datetime2` with `default: () => 'SYSUTCDATETIME()'`
  - Enums → stored as `nvarchar` string columns, NOT TypeORM enum type
- Define all relations: `@ManyToOne`, `@OneToMany`, `@JoinColumn({ name: 'fk_column' })`
- Set eager/lazy loading per BE-ARCHITECTURE.md relation loading strategy table
- Add indexes via `@Index('idx_<table>_<column>')` per DATABASE.md indexing strategy

### Step 3: Generate Repositories

- One file per entity at `src/features/<feature-name>/repositories/<entity>.repository.ts`
- Class is `@Injectable()`, wraps `@InjectRepository(Entity)` → `Repository<Entity>`
- **Never** expose raw TypeORM Repository — all queries go through custom methods
- Use QueryBuilder for complex queries (search, pagination, filtering, joins)
- Stock deduction uses optimistic locking pattern: `SET stock_quantity = stock_quantity - :qty WHERE stock_quantity >= :qty`
- Pagination methods accept `{ page, limit, sort, order, ...filters }` and return `{ data, total }`

### Step 4: Generate DTOs

- Location: `src/features/<feature-name>/dto/`
- Files: `create-<entity>.dto.ts`, `update-<entity>.dto.ts`, `<entity>-response.dto.ts`
- All fields decorated with `class-validator` validators (`@IsString`, `@IsInt`, `@IsEnum`, `@IsOptional`, etc.)
- All fields decorated with `@ApiProperty()` for Swagger
- Update DTOs use `PartialType(CreateDto)` from `@nestjs/swagger`
- Response DTOs **never** expose: `password_hash`, `token_hash`, `is_revoked`
- Pagination DTO: extend shared `PaginationDto` from `src/common/dto/pagination.dto.ts`
- Filter DTOs: per feature as defined in API_SPEC.md filtering section

### Step 5: Generate Service

- File: `src/features/<feature-name>/<feature-name>.service.ts`
- `@Injectable()` class with `private readonly logger = new Logger(<ServiceName>.name)`
- Inject own repositories + cross-feature services via DI (never import another feature's repo directly)
- All business logic lives here — controllers are thin
- Use `EventEmitter2` for async side effects (e.g., `order.created` → stock deduction)
- Use `@OnEvent('event.name')` handlers for listening to cross-feature events
- Error handling: throw NestJS built-in exceptions or custom domain exceptions from `src/common/exceptions/`
- Map error codes from API_SPEC.md (e.g., `PRODUCT_001`, `CART_002`, `ORDER_003`)

### Step 6: Generate Controller

- File: `src/features/<feature-name>/<feature-name>.controller.ts`
- `@Controller()` with correct route prefix per API_SPEC.md
- `@ApiTags('<Feature Name>')` for Swagger grouping
- Each endpoint decorated with:
  - `@ApiOperation({ summary: '...' })`
  - `@ApiResponse({ status, description })` for success + each error code
  - `@ApiBearerAuth()` if authenticated
  - `@Public()` if no auth needed
  - `@Roles('admin')` or `@Roles('customer')` per endpoint auth level
  - `@ApiQuery()` for pagination/filter params on list endpoints
- Use `@CurrentUser()` to extract user from JWT — never `@Req()`
- Use `@Body()`, `@Param()`, `@Query()` for input extraction
- Controller methods: parse request → call service → return data (no business logic)
- DELETE endpoints return `HttpCode(204)` with no body

### Step 7: Generate Module

- File: `src/features/<feature-name>/<feature-name>.module.ts`
- `@Module({})` with:
  - `imports`: `TypeOrmModule.forFeature([...entities])` + dependent feature modules per dependency map
  - `controllers`: `[<FeatureName>Controller]`
  - `providers`: `[<FeatureName>Service, ...Repositories]`
  - `exports`: `[<FeatureName>Service]` — only export service, never repositories
- Register module in `src/app.module.ts` imports array

### Step 8: Generate Supporting Files

- `src/features/<feature-name>/types/<feature-name>.types.ts` — sort enums, filter param interfaces, event payload interfaces
- `src/features/<feature-name>/utils/<feature-name>.util.ts` — pure helper functions (slug generation, discount calculation, etc.)
- `src/features/<feature-name>/context.md` — feature purpose, owned entities, dependencies, key decisions
- `src/features/<feature-name>/tests/<feature-name>.controller.spec.ts` — controller unit test skeleton
- `src/features/<feature-name>/tests/<feature-name>.service.spec.ts` — service unit test skeleton (Arrange → Act → Assert pattern)

### Step 9: Register & Verify

- Add feature module to `src/app.module.ts` imports
- Verify no circular dependencies
- Verify cross-feature imports use module exports only (never direct repo/entity imports)

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
- Run `npm run build` to verify no TypeScript errors
- If cross-feature dependencies exist, ensure dependent modules are already generated
- Migrations are NOT auto-generated — run `npx typeorm migration:generate` separately

🚀 Next steps:
1. Review generated code against DATABASE.md and API_SPEC.md
2. Run `npm run build` to verify compilation
3. Generate migration: `npx typeorm migration:generate src/database/migrations/<MigrationName> -d src/database/data-source.ts`
4. Run `npm run start:dev` to verify endpoints in Swagger at `/api/v1/docs`
```

---

## Important Rules

1. **Layer separation is strict** — Controllers: route + extract params only. Services: all business logic. Repositories: all data access. Never put QueryBuilder in a service or business logic in a controller.
2. **Cross-feature communication** — Import the MODULE, inject the SERVICE. Never import another feature's repository, entity, or DTO directly. Use EventEmitter2 for async side effects.
3. **Response format** — All responses wrapped by `TransformInterceptor` into `{ success, data, meta? }`. Errors wrapped by `HttpExceptionFilter` into `{ success: false, error: { code, message } }`. Do not manually wrap responses.
4. **Entity-to-DTO mapping** — Never return raw entity objects from controllers. Always map to response DTOs. Never expose `password_hash`, `token_hash`, `is_revoked`, or other internal fields.
5. **Validation at DTO level only** — Use `class-validator` decorators on DTOs. Global `ValidationPipe` handles validation automatically. Services assume input is already validated.
6. **Database conventions** — All string columns use `nvarchar`. Money uses `decimal(10,2)`. Timestamps use `datetime2` with UTC default. Enums stored as string columns. Table names are plural snake_case.
7. **Auth decorators** — Use `@Public()` to skip auth. Use `@Roles('admin')` for admin-only. Use `@CurrentUser()` to extract JWT user. Never access `req.user` directly.
8. **Error codes** — Follow `[FEATURE]_[3-digit]` format from API_SPEC.md. Throw NestJS built-in exceptions or custom exceptions from `src/common/exceptions/`.
9. **No `synchronize: true`** — Schema changes via TypeORM migrations only. Never auto-sync in any environment.
10. **Swagger decorators** — Every DTO field gets `@ApiProperty()`. Every controller gets `@ApiTags()`. Every endpoint gets `@ApiOperation()` and `@ApiResponse()`.

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature not in known list | Ask user to provide entity definitions, endpoints, and dependencies manually |
| Feature directory already exists | Ask: "Feature `<name>` already exists. Overwrite, merge, or skip?" |
| Dependent feature module not found | Warn: "Feature `<dep>` not found. Generate it first or proceed without cross-feature injection." |
| `src/common/` missing guards/interceptors | Generate common layer scaffolding before feature generation |
| DATABASE.md or API_SPEC.md not found | Ask user to provide entity schema and endpoint definitions manually |