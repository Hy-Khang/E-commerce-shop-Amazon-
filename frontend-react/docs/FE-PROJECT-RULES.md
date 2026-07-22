# PROJECT-RULES.md — Frontend (React)

## 1. Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript (strict mode)
- **State:** Zustand (global client state), TanStack Query v5 (server state)
- **Styling:** Tailwind CSS v4
- **HTTP:** Axios (interceptors for JWT, refresh, error transform)
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

---

## 2. Project Structure

```
src/
├── features/              — all business features
├── shared/                — shared components, hooks, utils, types, constants
├── core/                  — app-level: router, providers, axios, auth, layouts
├── assets/                — static images, fonts
├── styles/                — global CSS, Tailwind overrides
├── App.tsx
└── main.tsx
```

### Per Feature

```
src/features/[feature-name]/
├── pages/
│   └── [PageName]Page.tsx           — route-level pages (default export for React.lazy)
├── components/
│   ├── [ComponentName].tsx
│   └── [ComponentName].test.tsx    — co-located test
├── hooks/
│   └── use[HookName].ts
├── services/
│   └── [feature-name].service.ts   — Axios calls → maps to API_SPEC endpoints
├── stores/
│   └── [feature-name].store.ts     — Zustand (only if global state needed)
├── types/
│   └── [feature-name].types.ts
├── utils/
│   └── [feature-name].util.ts
├── index.ts                         — barrel file, public exports only
└── context.md                       — purpose, pages, API deps, state decisions
```

---

## 3. Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Folders | kebab-case | `user-profile/` |
| Components | PascalCase file + named export | `ProductCard.tsx` → `export function ProductCard` |
| Hooks | camelCase, `use` prefix | `useCart.ts` → `export function useCart` |
| Services | kebab-case + `.service` | `cart.service.ts` → `export const cartService` |
| Stores | kebab-case + `.store` | `cart.store.ts` → `export const useCartStore` |
| Types | kebab-case + `.types`, PascalCase names | `order.types.ts` → `OrderResponse`, `CreateOrderRequest` |
| Utils | kebab-case + `.util` | `product.util.ts` → `export function formatPrice` |
| Tests | co-located, `.test.tsx` | `ProductCard.test.tsx` |
| Pages | PascalCase + `Page` suffix | `ProductListPage.tsx`, `CheckoutPage.tsx` |
| Constants | UPPER_SNAKE_CASE | `ORDER_STATUS_LABELS`, `MAX_CART_QUANTITY` |

---

## 4. Feature Boundary Rules

Each feature is **self-contained**. Export only via `index.ts` barrel file.

- ✅ Import from barrel: `import { ProductCard } from '@/features/product'`
- ❌ Never import from internal paths (`/components/`, `/services/`, etc.)
- Cross-feature communication: Zustand stores, TanStack Query cache invalidation, URL params, props at page level
- See ARCHITECTURE.md Section 5 for dependency map and communication details

---

## 5. Code Patterns

### API Calls
- Service file (typed Axios calls) → TanStack Query hook → component. Never Axios in components.
- Query key factory per feature: `featureKeys.all`, `.list(params)`, `.detail(id/slug)`

### State
- Server state → TanStack Query (source of truth). Client-only cross-feature → Zustand. URL-representable → searchParams. Everything else → `useState`.
- Never put server data in Zustand.

### Auth
- Axios request interceptor attaches JWT. Response interceptor: 401 → silent refresh → retry → if fail → logout.
- Guest cart: `session_id` in localStorage → merge on login → clear.

### Forms
- React Hook Form + Zod schema. `zodResolver`. Types inferred from schema via `z.infer<>`.

### Error Handling
- Global `ErrorBoundary` wraps route pages. Axios interceptor transforms to typed `ApiError`.
- Mutations: TanStack `onError` for toasts. Forms: RHF + Zod inline — never `alert()`.

### Loading States
- `Skeleton` for initial loads, `Spinner` for mutations, `EmptyState` for zero results.
- Use `isLoading` / `isFetching` / `isRefetching` appropriately.

### Routing
- Use `ROUTES` constants: `navigate(ROUTES.PRODUCT_DETAIL(slug))` — never hardcode paths.
- `AuthGuard` → `/login`, `PortalGuard` → `/403`, `React.lazy` per feature page.

---

## 6. Component Rules

- **One component per file** — no multiple exports from a single file
- **All props typed** — define `Props` interface in the same file or import from feature types
- **Max 200 lines** — extract sub-components or hooks if exceeding
- **Container + Presentational** — split data-fetching (hook) from rendering (props)
- **Named exports only** — exception: lazy-loaded pages use default export for `React.lazy`

---

## 7. Anti-Patterns Checklist

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Import another feature's internals | Import from barrel: `@/features/product` |
| Axios calls in components | Service file → TanStack Query hook |
| Business logic in components | Extract to hooks or utils |
| Deep prop drilling (3+ levels) | Zustand store, Context, or composition |
| `any` type | `unknown` + type narrowing |
| Inline styles | Tailwind classes; shared component if repeats 3+ times |
| Server state in Zustand | TanStack Query is source of truth for server data |
| `useEffect` for data fetching | TanStack Query `useQuery` |
| Barrel re-exports everything | Only export what other features consume |

---

## 8. TanStack Query Config

| Data | staleTime | Reason |
|------|-----------|--------|
| Products, categories | 5 min | Rarely changes, cacheable |
| Cart | 0 | Always fresh, reflects latest state |
| Orders, reviews, wishlist | 1 min | Moderate freshness needed |

- **Optimistic updates:** Cart add/remove → `onMutate` updates cache, `onError` rolls back
- **Prefetch:** Product detail prefetched on `ProductCard` hover via `queryClient.prefetchQuery`
- **Cache invalidation map:** See ARCHITECTURE.md Section 8

---

