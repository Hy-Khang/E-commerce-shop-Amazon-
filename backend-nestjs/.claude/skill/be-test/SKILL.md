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

**Scope:** Generate unit tests (`.spec.ts`) and integration tests (`.e2e-spec.ts`) for a NestJS feature's service and controller layers, following project testing conventions.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required (e.g., `product`, `cart`, `order`, `review`, `auth`, `user-profile`)

2. **Feature exists?** Check `src/features/<feature-name>/` directory exists
   - If missing → Suggest: "Run `/be-crud <feature-name>` first to scaffold the feature"

3. **Service and controller exist?** Check `<feature-name>.service.ts` and `<feature-name>.controller.ts`
   - If missing → Suggest: "Feature is incomplete. Run `/be-crud <feature-name>` first"

4. **Tests directory exists?** Check `src/features/<feature-name>/tests/`
   - If missing → Create it

5. **Tests already exist?** Check for existing `.spec.ts` / `.e2e-spec.ts` files
   - If found → Ask: "Tests already exist. Overwrite, merge, or skip?"

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `BE-PROJECT-RULES.md` | Testing conventions, Arrange-Act-Assert pattern, coverage targets, naming rules |
| `src/features/<feature-name>/<feature-name>.service.ts` | Service methods to test — the primary test target |
| `src/features/<feature-name>/<feature-name>.controller.ts` | Controller routes to test — thin layer verification |
| `src/features/<feature-name>/entities/*.entity.ts` | Entity shapes for building mock data |
| `src/features/<feature-name>/dto/*.dto.ts` | DTO validation rules to verify in tests |
| `src/features/<feature-name>/repositories/*.repository.ts` | Repository methods to mock |

---

## Workflow

### Step 1: Analyze Feature

- Read the service file — list all public methods (these are test targets)
- Read the controller file — list all route handlers
- Identify injected dependencies (repositories, cross-feature services, EventEmitter2)
- Identify error cases from service logic (exceptions thrown, guard clauses)
- Map feature to its entities from BE-PROJECT-RULES.md feature list:
  - `auth` → roles, users, refresh_tokens
  - `user-profile` → addresses
  - `product` → categories, products, product_variants, product_images
  - `cart` → carts, cart_items
  - `order` → orders, order_items
  - `review` → reviews

### Step 2: Present Execution Plan & Wait for Confirmation

- **STOP before writing any code.** Print a summary for the user including:
  - **Feature name** and service methods to test
  - **Files to CREATE** — full file list with paths (mock factories, spec files)
  - **Test coverage plan** — which methods get happy path, error cases, edge cases
  - **Mocked dependencies** — repositories, cross-feature services, EventEmitter2
  - **Notes** — any complex flows that need e2e tests, missing source files
- Ask user: **"Proceed with generation? (yes / adjust)"**
- **Do NOT generate any files until user confirms.**
- If user requests adjustments → update the plan and re-confirm

### Step 3: Generate Mock Factories

- Create `src/features/<feature-name>/tests/mocks/<feature-name>.mock.ts`
- One factory function per entity: `mockProduct()`, `mockCartWithItems(count)`, `mockOrder()`
- Return typed entity objects with realistic default values
- Support overrides via partial param: `mockProduct(overrides?: Partial<Product>)`
- Include relational mocks where needed (e.g., `mockProductWithVariants()`, `mockOrderWithItems()`)

### Step 4: Generate Service Unit Tests

- File: `src/features/<feature-name>/tests/<feature-name>.service.spec.ts`
- Structure: `describe('<FeatureName>Service')` → nested `describe` per method → `it` blocks

**Test module setup:**
- Use `Test.createTestingModule` from `@nestjs/testing`
- Mock all repository dependencies — never use real database
- Mock cross-feature services (e.g., `CartService`, `ProductService`) when injected
- Mock `EventEmitter2` when used — verify `.emit()` calls

**Per service method, generate tests for:**
- **Happy path** — correct input → expected return value
- **Not found** — entity doesn't exist → throws `NotFoundException`
- **Business rule violations** — throws `BadRequestException` or custom exception (e.g., `InsufficientStockException`)
- **Authorization** — wrong user → throws `ForbiddenException` (e.g., order not belonging to user)
- **Conflict** — duplicate resource → throws `ConflictException` (e.g., duplicate SKU, duplicate review)
- **Cross-feature interactions** — verify DI service calls with correct args
- **Event emissions** — verify `eventEmitter.emit()` called with correct event name and payload

**Pattern per test:**
```
it('should <expected behavior>', async () => {
  // Arrange — set up mocks and input
  // Act — call service method
  // Assert — verify return value or thrown exception
});
```

### Step 5: Generate Controller Unit Tests

- File: `src/features/<feature-name>/tests/<feature-name>.controller.spec.ts`
- Controller tests are thin — verify routing and delegation only

**Per controller method, test:**
- Calls the correct service method with correct arguments
- Passes `@CurrentUser()` user data to service
- Passes `@Param()`, `@Body()`, `@Query()` correctly
- Returns service result unchanged (TransformInterceptor handles wrapping)

### Step 6: Generate Integration Tests (optional, for complex flows)

- File: `src/features/<feature-name>/tests/<feature-name>.e2e-spec.ts`
- Only for features with complex cross-feature flows: `order` (checkout), `cart` (merge), `auth` (token refresh)
- Use real `Test.createTestingModule` with in-memory or test database
- Test full request → response cycle via `supertest`

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
  └── <feature-name>.e2e-spec.ts        (only for complex flows)

⚙️ Commands to run:
- npm run test -- --testPathPattern=<feature-name>
- npm run test:cov -- --testPathPattern=<feature-name>

🚀 Next steps:
1. Run tests: `npm run test -- --testPathPattern=<feature-name>`
2. Check coverage: `npm run test:cov` — target 80% service, 60% overall
3. Add edge cases specific to your business logic
```

---

## Important Rules

1. **Arrange → Act → Assert** — every `it` block follows this structure, clearly separated with comments
2. **Mock repositories, never real DB** — unit tests are fast and isolated. Use `jest.fn()` or `jest.spyOn()` for all repository methods
3. **Test behavior, not implementation** — assert return values and thrown exceptions, not internal method call order (except for event emissions and cross-feature calls)
4. **One `describe` per service method** — nested inside the top-level `describe('<FeatureName>Service')`. Each `it` tests one scenario
5. **Never log sensitive data in mocks** — no `password_hash`, `token_hash`, or PII in mock factories. Use placeholder values
6. **Coverage targets** — 80% line coverage for services, 60% overall. Focus on business logic in services, not boilerplate in controllers
7. **Naming convention** — files: `*.spec.ts` (unit), `*.e2e-spec.ts` (integration). Located in feature's `tests/` folder, co-located with the feature

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature directory not found | Suggest: "Run `/be-crud <feature-name>` first" |
| Service file missing or empty | Suggest: "Service has no methods to test. Implement service logic first" |
| Tests already exist | Ask: "Overwrite existing tests, merge new test cases, or skip?" |