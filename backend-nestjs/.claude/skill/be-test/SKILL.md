---
name: be-test
description: >
  Generate unit and integration tests for a NestJS backend feature.
  Use when user says "generate backend tests", "create tests for", "be-test", "test feature".
argument-hint: "<feature-name> (e.g., product, cart, order, review, auth, user-profile)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Backend Test Generator

**Scope:** Generate unit tests (`.spec.ts`) and integration tests (`.e2e-spec.ts`) for a NestJS feature's service and controller layers.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required
2. **Feature exists?** `src/features/<feature-name>/` must exist with service + controller
3. **Tests already exist?** If `.spec.ts` / `.e2e-spec.ts` files found → ask overwrite, merge, or skip

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `BE-PROJECT-RULES.md` | Testing conventions, AAA pattern, coverage targets |
| `src/features/<feature-name>/<feature-name>.service.ts` | Service methods — primary test targets |
| `src/features/<feature-name>/<feature-name>.controller.ts` | Controller routes — thin layer verification |
| `src/features/<feature-name>/repositories/*.repository.ts` | Repository methods to mock |
| `src/features/<feature-name>/entities/*.entity.ts` | Entity shapes for mock data |
| `src/features/<feature-name>/dto/*.dto.ts` | DTO validation rules |

---

## Workflow

### Step 1: Analyze Feature

- Read service file — list all public methods (test targets)
- Read controller file — list all route handlers
- Identify injected dependencies (repositories, cross-feature services, EventEmitter2)
- Identify error cases from service logic (exceptions thrown, guard clauses)

### Step 2: Present Plan & Confirm

**STOP before writing code.** Show the user:

- Feature name and service methods to test
- Files to create (mock factories, spec files)
- Test coverage plan (happy path, error cases, edge cases per method)
- Mocked dependencies (repositories, cross-feature services, EventEmitter2)

Ask: **"Proceed? (yes / adjust)"** — do NOT generate until confirmed.

### Step 3: Generate Test Files

Generate all files following BE-PROJECT-RULES.md testing conventions:

| File | Location | Key rule |
|------|----------|----------|
| Mock factories | `tests/mocks/<feature>.mock.ts` | One factory per entity, typed with realistic defaults, supports `Partial<T>` overrides |
| Service tests | `tests/<feature>.service.spec.ts` | Mock all repos + DI services, test happy path + exceptions + event emissions per method |
| Controller tests | `tests/<feature>.controller.spec.ts` | Thin — verify correct service method called with correct args |
| Admin controller tests | `tests/admin-<feature>.controller.spec.ts` | **Only** if feature has `admin-<feature>.controller.ts` — same thin pattern as controller tests |
| E2E tests | `tests/<feature>.e2e-spec.ts` | HTTP-level integration via supertest — tests route wiring, DTO validation, auth/authorization, and multi-step flows |

**E2E test scope:** These are HTTP integration tests using `supertest` against controllers with mocked services. They verify: route registration, `ValidationPipe` enforcement (invalid enums, missing fields, `forbidNonWhitelisted`), auth guard behavior (unauthenticated → 401, wrong role → 403), and multi-step flows (checkout → cancel). They do **not** hit a real database.

**Transaction testing:** Features using `DataSource.createQueryRunner()` (e.g., order checkout) need a `mockQueryRunner` with `connect`, `startTransaction`, `commitTransaction`, `rollbackTransaction`, `release`, and `manager.create`/`manager.save`. Test: commit on success, rollback on failure, release always called, events emitted only after commit.

**Cross-feature mock dependencies:** When a feature's mocks need entities from another feature (e.g., order needs `mockProduct` from product), **import from the existing mock factory** (`../product/tests/mocks/product.mock.ts`). Do not duplicate mock factories across features.

**Per service method, cover:**
- Happy path — correct input → expected return
- Not found → `NotFoundException`
- Business rule violations → `BadRequestException` or custom exceptions
- Authorization → `ForbiddenException` (e.g., order not belonging to user)
- Conflict → `ConflictException` (e.g., duplicate SKU, duplicate review)
- Event emissions → verify `eventEmitter.emit()` called correctly

### Step 4: Run & Verify

- Run `npm run test -- --testPathPattern=<feature-name>`
- Verify all tests pass
- Check coverage targets: 80% services, 60% overall

---

## Output

```
✅ Tests for "<feature-name>" created!

📁 Files CREATED:
- src/features/<feature-name>/tests/
  ├── mocks/
  │   └── <feature-name>.mock.ts
  ├── <feature-name>.service.spec.ts
  ├── <feature-name>.controller.spec.ts
  ├── admin-<feature-name>.controller.spec.ts  (if admin controller exists)
  └── <feature-name>.e2e-spec.ts               (HTTP integration tests)

⚙️ Commands to run:
- npm run test -- --testPathPattern=<feature-name>
- npm run test:cov -- --testPathPattern=<feature-name>

🚀 Next steps:
1. Run tests: `npm run test -- --testPathPattern=<feature-name>`
2. Check coverage: target 80% service, 60% overall
3. Add edge cases specific to your business logic
```

---

## Important Rules

1. **Arrange → Act → Assert** — every `it` block follows this structure
2. **Mock repositories, never real DB** — unit tests are fast and isolated
3. **Test behavior, not implementation** — assert return values and exceptions, not internal call order
4. **One `describe` per service method** — nested inside `describe('<FeatureName>Service')`
5. **Coverage targets** — 80% services, 60% overall. Focus on business logic, not boilerplate

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature directory not found | Suggest: "Run `/be-crud <feature-name>` first" |
| Service file missing or empty | Suggest: "Implement service logic first" |
| Tests already exist | Ask: "Overwrite existing tests, merge new test cases, or skip?" |
