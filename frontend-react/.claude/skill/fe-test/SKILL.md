---
name: fe-test
description: >
  Generate unit tests for a React frontend feature's components, hooks, and utils.
  Use when user says "generate frontend tests", "create FE tests for", "fe-test", "test frontend feature".
argument-hint: "<feature-name> (e.g., product, cart, order, review, auth, user-profile)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Frontend Test Generator

**Scope:** Generate co-located unit tests (`.test.tsx` / `.test.ts`) for a React feature's components, hooks, and utils using Vitest + React Testing Library.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required
2. **Feature exists?** `src/features/<feature-name>/` must exist with components + hooks
3. **Test framework configured?** `vitest.config.ts` or test config in `vite.config.ts` must exist
4. **Tests already exist?** If `.test.tsx` / `.test.ts` files found → ask overwrite, merge, or skip

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `FE-PROJECT-RULES.md` | Testing conventions, co-location, coverage targets, component rules |
| `src/features/<feature-name>/components/*.tsx` | Components to test — rendering, interactions, conditional UI |
| `src/features/<feature-name>/hooks/*.ts` | Hooks to test — TanStack Query wrappers, mutations |
| `src/features/<feature-name>/utils/*.util.ts` | Utils to test — pure functions |
| `src/features/<feature-name>/types/*.types.ts` | Types and Zod schemas for mock data |
| `src/features/<feature-name>/stores/*.store.ts` | Zustand stores to test (if exists) |

---

## Workflow

### Step 1: Analyze Feature

- Read all component files — list components and their props
- Read all hook files — list hooks, identify `useQuery` vs `useMutation`
- Read all util files — list exported functions
- Read store file (if exists) — list store actions and state shape
- Identify pages (default export, data-fetching) vs presentational components (props-driven)

### Step 2: Present Plan & Confirm

**STOP before writing code.** Show the user:

- Feature name and files to test
- Test files to create (co-located next to source)
- Mock factory file path
- Test coverage plan (which scenarios per component/hook/util)
- Mocked dependencies (hooks, stores, React Router, services)

Ask: **"Proceed? (yes / adjust)"** — do NOT generate until confirmed.

### Step 3: Generate Test Files

Generate all files following FE-PROJECT-RULES.md testing conventions:

| File | Location | Key rule |
|------|----------|----------|
| Mock factories | `tests/mocks/<feature>.mock.ts` | One factory per entity, typed defaults, `Partial<T>` overrides, shared `renderWithProviders` helper |
| Component tests | `components/<Component>.test.tsx` | Co-located next to source file |
| Hook tests | `hooks/use<Action>.test.ts` | Co-located, use `renderHook` with fresh `QueryClient` wrapper |
| Util tests | `utils/<feature>.util.test.ts` | Co-located, pure function tests |

**For presentational components:**
- Rendering with default props, conditional rendering, user interactions, empty/edge states

**For page components:**
- Mock TanStack Query hooks — test loading, error, empty, success states
- Mock React Router (`useParams`, `useSearchParams`, `useNavigate`)

**For form components:**
- Field rendering, validation error display, successful submission, loading state during `isPending`

**For hooks:**
- `useQuery` → verify query key, loading state, data return, `enabled` option
- `useMutation` → verify cache invalidation on success, error handling
- Zustand stores → initial state, action effects

**For utils:**
- Normal cases, edge cases, boundary values

### Step 4: Run & Verify

- Run `npx vitest run --reporter=verbose src/features/<feature-name>`
- Verify all tests pass
- Check coverage targets: 70% hooks/utils, 50% overall

---

## Output

```
✅ Tests for "<feature-name>" created!

📁 Files CREATED:
- src/features/<feature-name>/
  ├── tests/mocks/
  │   └── <feature-name>.mock.ts
  ├── components/
  │   ├── <Component>.test.tsx          (per component)
  │   └── ...
  ├── hooks/
  │   ├── use<Action>.test.ts           (per hook)
  │   └── ...
  └── utils/
      └── <feature-name>.util.test.ts

⚙️ Commands to run:
- npx vitest run --reporter=verbose src/features/<feature-name>
- npx vitest run --coverage src/features/<feature-name>

🚀 Next steps:
1. Run tests: `npx vitest run src/features/<feature-name>`
2. Check coverage: target 70% hooks/utils, 50% overall
3. Add edge cases specific to your business logic
```

---

## Important Rules

1. **Co-located tests** — `ProductCard.test.tsx` next to `ProductCard.tsx`. Exception: mock factories in `tests/mocks/`
2. **Mock hooks, not services** — components use hooks, not services. Mock `useProducts`, not `productService`
3. **Test user behavior, not implementation** — use `screen.getByText`, `userEvent.click`. Never test internal state or re-render counts
4. **Arrange → Act → Assert** — every `it` block follows this structure
5. **Coverage targets** — 70% hooks/utils, 50% overall. Focus on user-facing behavior, not boilerplate

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature directory not found | Suggest: "Run `/fe-crud <feature-name>` first" |
| No components/hooks to test | Suggest: "Implement components and hooks first" |
| Tests already exist | Ask: "Overwrite existing tests, merge new test cases, or skip?" |
| Vitest not configured | Suggest: "Install and configure Vitest + React Testing Library first" |
