---
name: fe-crud
description: >
  Generate a complete React frontend feature with components, hooks, services, types, stores, and utils.
  Use when user says "generate frontend feature", "create frontend CRUD", "scaffold FE feature", "fe-crud".
argument-hint: "<feature-name> (e.g., product, cart, order, review, auth, user-profile)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Frontend CRUD Feature Generator

**Scope:** Scaffold a complete React feature module following the project's architecture, conventions, and API spec. Generates components (pages + UI), hooks (TanStack Query), services (Axios), types (Zod + TS), stores (Zustand if needed), utils, barrel file, and context doc.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required (e.g., `product`, `cart`, `order`, `review`, `auth`, `user-profile`)

2. **React project initialized?** Check `src/App.tsx` exists
   - If missing → Suggest: "Initialize the React + Vite project first"

3. **Core layer exists?** Check `src/core/` has `api/axios-instance.ts`, `providers/`, `router/`, `layouts/`
   - If missing → Suggest: "Set up core layer first (axios, providers, router, layouts)"

4. **Shared layer exists?** Check `src/shared/` has `components/ui/`, `hooks/`, `utils/`, `types/`, `constants/`
   - If missing → Suggest: "Set up shared layer first"

5. **Feature already exists?** Check `src/features/<feature-name>/` directory
   - If found → Ask: "Feature `<feature-name>` already exists. Overwrite or skip?"

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `API_SPEC.md` | Endpoints, request/response shapes, error codes, auth levels, pagination format |
| `FE-ARCHITECTURE.md` | Folder structure, data flow, cross-feature communication, routing, state strategy, API 4-layer architecture |
| `FE-PROJECT-RULES.md` | Naming conventions, code patterns, anti-patterns, component rules, TanStack Query config |

---

## Workflow

### Step 1: Identify Feature Scope

- Map `<feature-name>` to its scope from FE-ARCHITECTURE.md:
  - `auth` → login, register, token refresh, logout, logout all
  - `user-profile` → profile view/edit, address CRUD, default address
  - `product` → listing, detail (variants + images), category tree, admin CRUD
  - `cart` → cart view, add/update/remove, guest cart, merge on login
  - `order` → checkout, order history, detail, admin management
  - `review` → create review (purchase-verified), product reviews, my reviews
- Identify endpoints from API_SPEC.md for this feature
- Identify pages and routes from FE-ARCHITECTURE.md routing structure
- Identify cross-feature dependencies from dependency map

### Step 2: Present Execution Plan & Wait for Confirmation

- **STOP before writing any code.** Print a summary for the user including:
  - **Feature name** and scope (pages, components)
  - **Files to CREATE** — full file list with paths
  - **Files to UPDATE** — e.g., `src/core/router/router.tsx`
  - **Pages & routes** — list of routes this feature will register
  - **API endpoints consumed** — from API_SPEC.md
  - **Cross-feature dependencies** — barrel imports needed from other features
  - **State decisions** — Zustand store (yes/no), TanStack Query keys
  - **Notes** — any assumptions, missing dependencies, or potential conflicts
- Ask user: **"Proceed with generation? (yes / adjust)"**
- **Do NOT generate any files until user confirms.**
- If user requests adjustments → update the plan and re-confirm

### Step 3: Generate Types

- File: `src/features/<feature-name>/types/<feature-name>.types.ts`
- Define all TypeScript interfaces matching API_SPEC.md response shapes:
  - Entity types (e.g., `Product`, `CartItem`, `Order`)
  - Request types (e.g., `CreateOrderRequest`, `AddToCartRequest`)
  - Response types if different from entity (e.g., `LoginResponse`)
  - Param types for list endpoints (e.g., `ProductListParams` with page, limit, sort, filters)
- Define Zod schemas for forms (mirror backend DTO validation):
  - Export both the schema and inferred type: `export type LoginRequest = z.infer<typeof loginSchema>`
- Use `PaginationParams` and `PaginatedResponse<T>` from `src/shared/types/`

### Step 4: Generate Services

- File: `src/features/<feature-name>/services/<feature-name>.service.ts`
- Export a plain object `export const <featureName>Service = { ... }`
- One method per API_SPEC.md endpoint for this feature
- Each method: typed params → Axios call → returns typed `AxiosPromise`
- Use the shared axios instance from `src/core/api/axios-instance.ts`
- Methods map 1:1 to API_SPEC endpoints:
  - `GET /products` → `getList(params: ProductListParams)`
  - `GET /products/:slug` → `getBySlug(slug: string)`
  - `POST /cart/items` → `addItem(data: AddToCartRequest)`
  - `DELETE /cart/items/:id` → `removeItem(id: number)`
- Service layer does NOT handle errors — that's for hooks and interceptors

### Step 5: Generate Hooks (TanStack Query)

- Location: `src/features/<feature-name>/hooks/`
- One file per operation: `use<Action>.ts` (e.g., `useProducts.ts`, `useAddToCart.ts`, `useCreateOrder.ts`)

**Query key factory** (define in the main list hook file or a dedicated `keys.ts`):
```
export const <feature>Keys = {
  all: ['<feature>'] as const,
  list: (params) => ['<feature>', 'list', params] as const,
  detail: (identifier) => ['<feature>', 'detail', identifier] as const,
};
```

**Read hooks** (`useQuery`):
- Use query key factory for all keys
- Set `staleTime` per FE-PROJECT-RULES.md: products/categories 5min, cart 0, orders/reviews 1min
- Return `{ data, isLoading, error }` — components never see raw query object internals
- Add `enabled` option where conditional fetching is needed (e.g., `enabled: !!slug`)

**Write hooks** (`useMutation`):
- `onMutate` → optimistic cache update for cart operations (snapshot → update → return rollback context)
- `onError` → rollback optimistic update, show toast with mapped error code from API_SPEC.md
- `onSettled` → `queryClient.invalidateQueries()` per cache invalidation map:
  - Checkout success → invalidate `cartKeys.current()` + `orderKeys.list()`
  - Cart add/update/remove → invalidate `cartKeys.current()` → sync `useCartStore.itemCount`
  - Review created → invalidate `reviewKeys.list(productId)` + `productKeys.detail(slug)`
  - Login + cart merge → invalidate `cartKeys.current()`
- `onSuccess` → navigate or show success toast as needed

**Prefetch hooks** (where applicable):
- Product detail prefetch on `ProductCard` hover: `queryClient.prefetchQuery({ queryKey: productKeys.detail(slug), queryFn: ... })`

### Step 6: Generate Store (Zustand — only if needed)

- File: `src/features/<feature-name>/stores/<feature-name>.store.ts`
- Only create for features that need cross-feature client state:
  - `auth` → `useAuthStore`: `{ accessToken, refreshToken, user, isAuthenticated, login(), logout() }`
  - `cart` → `useCartStore`: `{ itemCount, setItemCount }` (derived from TanStack Query cart data)
- Do NOT create stores for server data — TanStack Query is the source of truth
- Export as `export const use<FeatureName>Store = create<StoreType>(...)`

### Step 7: Generate Components

- Location: `src/features/<feature-name>/components/`
- One component per file, named export, PascalCase filename
- Max 200 lines per component — extract sub-components or hooks if exceeding

**Page components** (route-level):
- Suffix `Page`: `ProductListPage.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`
- Use `default export` for `React.lazy` code splitting
- Compose data-fetching hooks + presentational children
- Read URL params via `useParams()` / `useSearchParams()` for filters/pagination
- Handle loading → `*Skeleton` component, error → `ErrorBoundary` or inline, empty → `EmptyState`

**UI components** (presentational):
- Receive data via props — no direct hook calls for data fetching
- Use Tailwind classes for styling — no inline styles
- Use shared UI components from `src/shared/components/ui/` (Button, Input, Modal, Badge, Skeleton, Spinner, Table)
- Use shared form components from `src/shared/components/form/` (FormInput, FormSelect, FormTextarea)

**Skeleton components**:
- One per page: `<FeatureName>PageSkeleton.tsx`
- Match the layout of the real page with placeholder elements

**Form components** (where applicable):
- Use React Hook Form + Zod resolver
- Import Zod schema from feature types
- Use `useForm<T>({ resolver: zodResolver(schema) })`
- Display inline validation errors — never `alert()`
- Submit via mutation hook — show Spinner on button during `isPending`

**Feature-specific components to generate per feature:**
- `auth` → `LoginPage`, `LoginForm`, `RegisterPage`, `RegisterForm`
- `user-profile` → `ProfilePage`, `ProfileForm`, `AddressListPage`, `AddressForm`, `AddressCard`
- `product` → `ProductListPage`, `ProductCard`, `ProductDetailPage`, `VariantSelector`, `ImageGallery`, `CategorySidebar`, `ProductCardSkeleton`, `ProductDetailSkeleton` + admin pages
- `cart` → `CartPage`, `CartItemList`, `CartItemRow`, `CartSummary`, `CartBadge`, `AddToCartButton`, `CartPageSkeleton`
- `order` → `CheckoutPage`, `OrderHistoryPage`, `OrderDetailPage`, `OrderItemRow`, `OrderStatusBadge`, `OrderListSkeleton` + admin pages
- `review` → `ReviewForm`, `ReviewList`, `ReviewCard`, `MyReviewsPage`

### Step 8: Generate Utils

- File: `src/features/<feature-name>/utils/<feature-name>.util.ts`
- Pure helper functions specific to this feature's domain:
  - `product` → `generateSlug`, `calculateDiscountPercent`, `getEffectivePrice`
  - `cart` → `calculateSubtotal`, `isCartEmpty`
  - `order` → `isOrderCancellable`, `getStatusColor`
  - `review` → `getAverageRating`, `formatRatingStars`
- Generic utils (formatPrice, formatDate) belong in `src/shared/utils/`

### Step 9: Generate Barrel File

- File: `src/features/<feature-name>/index.ts`
- Export ONLY what other features consume — not everything:
  - Pages (for router lazy imports)
  - Shared components used cross-feature (e.g., `AddToCartButton`, `CartBadge`, `OrderStatusBadge`)
  - Hooks that other features call (e.g., `useAuthStore`, `useCartStore`)
  - Types that other features reference
- Do NOT export: internal components, services, utils used only within the feature

### Step 10: Generate Context File

- File: `src/features/<feature-name>/context.md`
- Document: feature purpose, owned pages, API dependencies (endpoints consumed), state decisions (why Zustand or not), cross-feature exports, key design decisions

### Step 11: Register Routes & Verify

- Add feature pages to `src/core/router/router.tsx` with `React.lazy`
- Wrap with appropriate guards: `AuthGuard` for protected, `RoleGuard` for admin
- Assign to correct layout: `MainLayout`, `AdminLayout`, or `AuthLayout`
- Verify barrel exports are minimal and correct
- Verify no internal cross-feature imports (all via barrel)

---

## Output

```
✅ Feature "<feature-name>" created!

📁 Files CREATED:
- src/features/<feature-name>/
  ├── components/
  │   ├── <Page>Page.tsx               (per route)
  │   ├── <Component>.tsx              (per UI piece)
  │   ├── <Page>Skeleton.tsx           (per page)
  ├── hooks/
  │   ├── use<Action>.ts               (per query/mutation)
  │   └── keys.ts                      (query key factory, optional)
  ├── services/
  │   └── <feature-name>.service.ts
  ├── stores/
  │   └── <feature-name>.store.ts      (only if cross-feature client state needed)
  ├── types/
  │   └── <feature-name>.types.ts
  ├── utils/
  │   └── <feature-name>.util.ts
  ├── index.ts                         (barrel — public exports only)
  └── context.md

📝 Files UPDATED:
- src/core/router/router.tsx           (added lazy routes + guards)

⚠️ Risks / Notes:
- Ensure dependent features are generated first if cross-feature imports are needed
- Zustand store only created for auth and cart — other features use TanStack Query only
- Admin pages included only for product and order features

🚀 Next steps:
1. Review generated components against API_SPEC.md response shapes
2. Run `npm run dev` to verify pages render
3. Connect to backend API and test data flow
4. Add Tailwind styling refinements
```

---

## Important Rules

1. **4-layer API architecture is strict** — `axios-instance` → `service` → `hook` → `component`. Components never import Axios or call services directly. Services never handle errors. Hooks own all TanStack Query logic.
2. **Cross-feature imports via barrel only** — Import from `@/features/product`, never from `@/features/product/components/ProductCard`. Barrel exports only what other features need.
3. **Server state in TanStack Query, not Zustand** — Never store API data in Zustand. Zustand is only for cross-feature client-only state (auth tokens, cart badge count). URL-representable state goes in `searchParams`.
4. **One component per file, max 200 lines** — Split data-fetching (hook) from rendering (props). Pages compose hooks + presentational children. Named exports only; default export only for `React.lazy` pages.
5. **Form validation with Zod + React Hook Form** — Define Zod schema in types file, use `zodResolver` in form component. Inline error display, never `alert()`. Submit via mutation hook with button loading state.
6. **Error codes from API_SPEC.md** — Map error codes (CART_003, ORDER_002, etc.) to user-friendly toast messages in mutation `onError`. Global 401 handling via Axios interceptor (silent refresh → retry → logout).
7. **Optimistic updates for cart operations** — `onMutate`: snapshot cache → update optimistically → return rollback. `onError`: restore snapshot. `onSettled`: invalidate to refetch server truth. Sync `useCartStore.itemCount` after every cart mutation.
8. **Loading/error/empty states for every page** — Skeleton for initial load, Spinner for mutations, EmptyState for zero results. Use `isLoading` vs `isFetching` correctly.
9. **Route constants, not hardcoded paths** — Use `ROUTES` from `src/shared/constants/routes`. Lazy-load all pages. Apply `AuthGuard` / `RoleGuard` per FE-ARCHITECTURE.md routing table.
10. **Tailwind only, no inline styles** — Use shared UI components (Button, Input, Modal) from `src/shared/components/ui/`. Extract a shared component if a pattern repeats 3+ times. Use Lucide React for icons.

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature not in known list | Ask user to provide pages, endpoints, and state requirements manually |
| Feature directory already exists | Ask: "Feature `<name>` already exists. Overwrite, merge, or skip?" |
| Core layer (`src/core/`) missing | Suggest: "Set up core layer first — axios, providers, router, layouts" |
| Shared layer (`src/shared/`) missing | Suggest: "Set up shared layer first — UI components, hooks, utils, types, constants" |
| Dependent feature not found | Warn: "Feature `<dep>` barrel not found. Generate it first or proceed without cross-feature imports." |
| API_SPEC.md not found | Ask user to provide endpoint definitions and response shapes manually |