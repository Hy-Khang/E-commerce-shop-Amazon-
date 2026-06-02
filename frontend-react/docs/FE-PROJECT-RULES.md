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

### Feature List

| Feature | Folder | Scope |
|---------|--------|-------|
| Auth | `src/features/auth/` | Login, register, token refresh, logout, logout all |
| User Profile | `src/features/user-profile/` | Profile view/edit, address CRUD, default address |
| Product | `src/features/product/` | Listing, detail (variants + images), category tree, admin CRUD |
| Cart | `src/features/cart/` | Cart view, add/update/remove, guest cart, merge on login |
| Order | `src/features/order/` | Checkout, order history, detail, admin management |
| Review | `src/features/review/` | Create review (purchase-verified), product reviews, my reviews |
| Wishlist | `src/features/wishlist/` | Add/remove products, wishlist page, admin popular analytics |
| Coupon | `src/features/coupon/` | Coupon validation at checkout, admin CRUD, usage tracking |

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

### Cross-Feature Communication

```typescript
// ✅ DO — Import from barrel
import { ProductCard } from '@/features/product';
import { useAuthStore } from '@/features/auth';

// ❌ DON'T — Import from internal path
import { ProductCard } from '@/features/product/components/ProductCard';
import { productService } from '@/features/product/services/product.service';
```

### Communication Mechanisms

| Mechanism | Example |
|-----------|---------|
| **Zustand stores** | Auth store (user, token) consumed by cart, order, review; cart store (itemCount) consumed by header |
| **React Router params** | `/products/:slug`, `/orders/:id`, `?category_id=5&page=2` |
| **TanStack Query cache** | Checkout success → invalidate `['cart']` + `['orders', 'list']` |
| **Props at page level** | Route pages compose components from multiple features via barrel exports |

### Feature Dependency Map

- **auth** owns user identity + tokens — others read from auth store, never call auth service directly
- **product** is read-only for non-admin — cart uses product types but gets variant data via its own cart API response
- **cart** is session-scoped — guest via `session_id` (localStorage), merge triggered on login
- **order** reads cart at checkout — composes cart items display + order form, backend handles cart→order conversion
- **review** depends on order — receives `order_id` + `product_id` as props, API enforces 3-way link server-side
- **wishlist** depends on auth + product — WishlistButton rendered on product cards/detail, bulk check for product listings

---

## 5. Code Patterns

### API Calls — Service + TanStack Query

```typescript
// ✅ DO — Service file + custom hook
// features/product/services/product.service.ts
export const productService = {
  getList: (params: ProductListParams) => axios.get('/products', { params }),
  getBySlug: (slug: string) => axios.get(`/products/${slug}`),
};

// features/product/hooks/useProducts.ts
export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getList(params),
  });
}

// ❌ DON'T — Axios in component
function ProductListPage() {
  useEffect(() => { axios.get('/products').then(setData); }, []);
}
```

### Query Key Factory

```typescript
// features/product/hooks/useProducts.ts
export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductListParams) => ['products', 'list', filters] as const,
  detail: (slug: string) => ['products', 'detail', slug] as const,
};
```

### State — Local First, Global When Necessary

```typescript
// ✅ Server state → TanStack Query (source of truth)
const { data: products, isLoading } = useProducts({ page: 1, categoryId: 5 });

// ✅ Client-only cross-feature state → Zustand
const { user, isAuthenticated, logout } = useAuthStore();

// ✅ Component-local UI state → React useState
const [isModalOpen, setIsModalOpen] = useState(false);

// ❌ DON'T — Server data in Zustand
const useProductStore = create((set) => ({
  products: [],  // This belongs in TanStack Query!
}));
```

### Authentication — Axios Interceptor + Zustand

```typescript
// core/axios.ts — request interceptor
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// response interceptor: 401 → silent refresh → retry → if fail → logout
```

**Guest cart flow:** `session_id` in localStorage → sent for cart endpoints → on login → `POST /cart/merge` with `session_id` → clear from localStorage.

### Form Handling — React Hook Form + Zod

```typescript
// features/auth/types/auth.types.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginRequest = z.infer<typeof loginSchema>;

// features/auth/components/LoginForm.tsx
const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
  resolver: zodResolver(loginSchema),
});
```

### Error Handling

- **Global:** `ErrorBoundary` in `shared/components/` wraps route-level pages
- **API:** Axios response interceptor transforms to typed `ApiError { code, message, details }`
- **Mutations:** TanStack Query `onError` for feature-specific toasts
- **Forms:** Inline validation via React Hook Form + Zod — never `alert()`

### Loading States

- `Skeleton` components for initial page loads (`ProductCardSkeleton`, `OrderListSkeleton`)
- `Spinner` for mutations (button loading state on checkout, add to cart)
- `EmptyState` component for zero-result lists
- Use `isLoading` / `isFetching` / `isRefetching` to pick the right pattern

### Routing — React Router v7

```typescript
// ✅ DO — Route constants
import { ROUTES } from '@/shared/constants/routes';
navigate(ROUTES.PRODUCT_DETAIL(slug));

// ❌ DON'T — Hardcoded paths
navigate(`/products/${slug}`);
```

- `AuthGuard` wraps protected routes (→ `/login` if not authenticated)
- `RoleGuard` wraps admin routes (→ `/403` if role !== admin)
- `React.lazy` + `Suspense` per feature page for code splitting

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

```typescript
// core/providers/query.provider.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
    mutations: { retry: 1 },
  },
});
```

| Data | staleTime | Reason |
|------|-----------|--------|
| Products, categories | 5 min | Rarely changes, cacheable |
| Cart | 0 | Always fresh, reflects latest state |
| Orders, reviews, wishlist | 1 min | Moderate freshness needed |

**Optimistic updates:** Cart add/remove → `onMutate` updates cache, `onError` rolls back.

**Prefetch:** Product detail prefetched on `ProductCard` hover via `queryClient.prefetchQuery`.

**Cache invalidation map:**

| Trigger | Invalidate |
|---------|------------|
| Checkout success | `['cart']` + `['orders', 'list']` |
| Review created | `['reviews', 'list', productId]` |
| Cart merge on login | `['cart']` |
| Wishlist add/remove | `['wishlist']` + `['wishlist', 'check', productId]` |

---

## 9. Git & Testing

### Git Workflow

- **Branch:** `[type]/[feature]-[short-description]` — e.g. `feat/cart-guest-merge`, `ui/order-detail-skeleton`
- **Types:** `feat`, `fix`, `refactor`, `ui`, `docs`, `test`, `chore`
- **Commits:** Conventional — `feat(cart): add guest merge on login`
- **PR scope:** Max 400 lines, one feature per PR

### Testing

- **Framework:** Vitest + React Testing Library
- **Location:** Co-located — `ProductCard.test.tsx` next to `ProductCard.tsx`
- **Focus:** Checkout flow, cart operations, auth flow, form validation
- **Coverage:** 70% for hooks/utils, 50% overall

```typescript
describe('ProductCard', () => {
  it('should display sale price when available', () => {
    render(<ProductCard product={mockProductWithSale} />);
    expect(screen.getByText('250.000₫')).toBeInTheDocument();
    expect(screen.getByText('199.000₫')).toBeInTheDocument();
  });
});
```