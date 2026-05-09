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

1. **Argument provided?** `<feature-name>` is required (e.g., `product`, `cart`, `order`, `review`, `auth`, `user-profile`)

2. **Feature exists?** Check `src/features/<feature-name>/` directory exists
   - If missing → Suggest: "Run `/fe-crud <feature-name>` first to scaffold the feature"

3. **Components and hooks exist?** Check `src/features/<feature-name>/components/` and `src/features/<feature-name>/hooks/`
   - If missing → Suggest: "Feature is incomplete. Run `/fe-crud <feature-name>` first"

4. **Test framework configured?** Check `vitest.config.ts` or `vite.config.ts` has test config
   - If missing → Suggest: "Set up Vitest + React Testing Library first"

5. **Tests already exist?** Check for existing `.test.tsx` / `.test.ts` files in the feature
   - If found → Ask: "Tests already exist. Overwrite, merge, or skip?"

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `FE-PROJECT-RULES.md` | Testing conventions, co-location, coverage targets, naming, component rules |
| `src/features/<feature-name>/components/*.tsx` | Components to test — rendering, interactions, conditional UI |
| `src/features/<feature-name>/hooks/*.ts` | Hooks to test — TanStack Query wrappers, mutations, state logic |
| `src/features/<feature-name>/utils/*.util.ts` | Utils to test — pure functions, easiest to cover |
| `src/features/<feature-name>/types/*.types.ts` | Types and Zod schemas for building mock data |
| `src/features/<feature-name>/stores/*.store.ts` | Zustand stores to test (if exists) |

---

## Workflow

### Step 1: Analyze Feature

- Read all component files — list components and their props
- Read all hook files — list hooks, identify which use `useQuery` vs `useMutation`
- Read all util files — list exported functions
- Read store file (if exists) — list store actions and state shape
- Read types file — understand entity shapes for mock data
- Identify which components are pages (default export, data-fetching) vs presentational (props-driven)
- Identify key user interactions: button clicks, form submissions, quantity changes, navigation

### Step 2: Present Execution Plan & Wait for Confirmation

- **STOP before writing any code.** Print a summary for the user including:
  - **Feature name** and files to test
  - **Test files to CREATE** — full file list with paths (co-located next to source)
  - **Mock file to CREATE** — shared mock factory path
  - **Test coverage plan** — which components/hooks/utils get tests, what scenarios per file
  - **Mocked dependencies** — TanStack Query hooks, Zustand stores, React Router, services
  - **Notes** — any complex components that need special setup, missing source files
- Ask user: **"Proceed with generation? (yes / adjust)"**
- **Do NOT generate any files until user confirms.**
- If user requests adjustments → update the plan and re-confirm

### Step 3: Generate Mock Factories

- File: `src/features/<feature-name>/tests/mocks/<feature-name>.mock.ts`
- One factory function per entity type: `mockProduct()`, `mockCartItem()`, `mockOrder()`
- Return typed objects with realistic default values (Vietnamese content where appropriate)
- Support overrides via partial param: `mockProduct(overrides?: Partial<Product>)`
- Include variant mocks where needed: `mockProductWithSale()`, `mockCartWithItems(count)`, `mockEmptyCart()`
- Never include sensitive fields (`password`, `token`) in mocks

### Step 4: Generate Component Tests

- Location: co-located at `src/features/<feature-name>/components/<Component>.test.tsx`
- One test file per component

**Test setup pattern:**
```
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

**For presentational components** (props-driven, no hooks):
- Test rendering with default props
- Test conditional rendering (e.g., sale price shown only when `sale_price` exists)
- Test user interactions (click handlers called with correct args)
- Test empty/edge states (empty list, null fields, long text truncation)

**For page components** (data-fetching, compose hooks):
- Mock TanStack Query hooks — return `{ data, isLoading, error }` variations
- Test loading state → renders Skeleton component
- Test error state → renders error message or ErrorBoundary fallback
- Test empty state → renders EmptyState component
- Test success state → renders data correctly
- Mock React Router: `useParams`, `useSearchParams`, `useNavigate`

**For form components** (React Hook Form + Zod):
- Test form renders all fields
- Test validation errors display on invalid submit (empty required fields, bad format)
- Test successful submission calls mutation hook
- Test button shows loading state during `isPending`
- Do NOT test Zod schema logic here — that goes in util/hook tests

**Feature-specific test scenarios:**
- `auth` → LoginForm: invalid email error, successful submit calls `useLogin`; RegisterForm: password mismatch
- `product` → ProductCard: sale price display, discount badge; VariantSelector: size/color selection
- `cart` → CartItemRow: quantity change calls `useUpdateCartItem`, remove calls `useRemoveCartItem`; CartSummary: subtotal calculation display
- `order` → OrderStatusBadge: correct color per status; CheckoutPage: address selection, payment method
- `review` → ReviewForm: star rating selection, comment validation; ReviewCard: rating display
- `user-profile` → AddressCard: default badge shown; AddressForm: phone validation

### Step 5: Generate Hook Tests

- Location: co-located at `src/features/<feature-name>/hooks/use<Action>.test.ts`
- Use `renderHook` from `@testing-library/react` with QueryClient wrapper

**For `useQuery` hooks:**
- Mock service function → verify correct query key used
- Test returns `isLoading: true` initially
- Test returns data on success
- Test `enabled` option works (e.g., `enabled: !!slug` → doesn't fetch when slug is empty)

**For `useMutation` hooks:**
- Mock service function
- Test `onSuccess` triggers correct cache invalidation
- Test `onError` handles error codes from API_SPEC.md
- Test optimistic updates (cart hooks): verify cache updated before server response

**For Zustand stores** (if exists):
- Test initial state
- Test each action modifies state correctly
- Test selectors return expected values
- `auth` → `login()` sets tokens + user, `logout()` clears state
- `cart` → `setItemCount()` updates count

### Step 6: Generate Util Tests

- Location: co-located at `src/features/<feature-name>/utils/<feature-name>.util.test.ts`
- Pure function tests — simplest to write, highest coverage value
- Test normal cases, edge cases, boundary values
- Examples per feature:
  - `product` → `calculateDiscountPercent(500000, 400000)` → `20`, `getEffectivePrice` with/without sale
  - `cart` → `calculateSubtotal([...items])` → correct sum, `isCartEmpty([])` → `true`
  - `order` → `isOrderCancellable('pending')` → `true`, `isOrderCancellable('delivered')` → `false`
  - `review` → `getAverageRating([5, 4, 3])` → `4`

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

1. **Co-located tests** — `ProductCard.test.tsx` lives next to `ProductCard.tsx`, not in a separate `tests/` folder. Exception: mock factories go in `tests/mocks/`
2. **Mock hooks, not services** — components import hooks, not services. Mock `useProducts` return value, not `productService.getList`. Services are tested indirectly via hook tests
3. **Test user behavior, not implementation** — use `screen.getByText`, `screen.getByRole`, `userEvent.click`. Never test internal state, `useState` values, or re-render counts
4. **Arrange → Act → Assert** — every `it` block follows this structure. Arrange: render + setup. Act: user interaction. Assert: screen query or mock verification
5. **Coverage targets** — 70% for hooks/utils (business logic), 50% overall. Focus on user-facing behavior, not boilerplate
6. **Never test** — Tailwind class names, exact DOM structure, third-party library internals (TanStack Query, React Router, Zod). Test what the user sees and does
7. **QueryClient wrapper** — hook tests need a fresh `QueryClient` per test wrapped in `QueryClientProvider`. Create a shared `renderWithProviders` helper in mock factory file

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature directory not found | Suggest: "Run `/fe-crud <feature-name>` first" |
| No components/hooks to test | Suggest: "Feature has no testable code. Implement components and hooks first" |
| Tests already exist | Ask: "Overwrite existing tests, merge new test cases, or skip?" |
| Vitest not configured | Suggest: "Install and configure Vitest + React Testing Library first" |