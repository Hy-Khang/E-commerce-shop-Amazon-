---
name: fe-crud
description: >
  Generate a complete React frontend feature with pages, components, hooks, services, types, stores, and utils.
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

**Scope:** Scaffold one feature module under `src/features/<feature-name>/`. Does NOT touch other features.

---

## Pre-flight Checks

1. **Argument provided?** `<feature-name>` is required
2. **Project initialized?** `src/App.tsx`, `src/core/`, `src/shared/` (or `src/common/`) must exist
3. **Feature already exists?** If `src/features/<feature-name>/` has real files → ask overwrite or skip

---

## Required Reading (READ FIRST)

| Doc | Purpose |
|-----|---------|
| `API_SPEC.md` | Endpoints, request/response shapes, error codes |
| `FE-ARCHITECTURE.md` | Folder structure, data flow, routing, state strategy |
| `FE-PROJECT-RULES.md` | Naming, code patterns, TanStack Query config, anti-patterns |

All generation must follow conventions from these docs. Do not invent patterns — use what's documented.

---

## Workflow

### Step 1: Identify Feature Scope

Map `<feature-name>` to its scope:

| Feature | Scope |
|---------|-------|
| `auth` | Login, register, token refresh, logout, logout all |
| `user-profile` | Profile view/edit, address CRUD, default address |
| `product` | Listing, detail (variants + images), category tree, admin CRUD |
| `cart` | Cart view, add/update/remove, guest cart, merge on login |
| `order` | Checkout, order history, detail, admin management |
| `review` | Create review (purchase-verified), product reviews, my reviews |

From the docs, identify: endpoints, pages & routes, cross-feature dependencies.

### Step 2: Present Plan & Confirm

**STOP before writing code.** Show the user:

- Feature name and scope
- Files to create (with paths)
- Files to update (e.g., `router.tsx`)
- API endpoints consumed
- Cross-feature dependencies
- State decisions (Zustand store yes/no)

Ask: **"Proceed? (yes / adjust)"** — do NOT generate until confirmed.

### Step 3: Generate Feature Files

Generate all files following FE-PROJECT-RULES.md conventions:

| File | Location | Key rule |
|------|----------|----------|
| Types | `types/<feature>.types.ts` | Interfaces matching API_SPEC + Zod schemas for forms |
| Services | `services/<feature>.service.ts` | Plain object, 1 method per endpoint, uses `api` from axios-instance |
| Hooks | `hooks/use<Action>.ts` | One file per operation, follow TanStack Query patterns from docs |
| Store | `stores/<feature>.store.ts` | **Only** for `auth` and `cart` — skip for other features |
| Pages | `pages/<Page>Page.tsx` | Default export for `React.lazy`, compose hooks + components |
| Components | `components/<Name>.tsx` | Named export, presentational, max 200 lines |
| Utils | `utils/<feature>.util.ts` | Domain-specific pure functions only |
| Barrel | `index.ts` | Export only what other features consume |
| Context | `context.md` | Feature purpose, pages, API deps, state decisions |

**Feature-specific files:**

| Feature | Pages (`pages/`) | Components (`components/`) |
|---------|-------------------|---------------------------|
| `auth` | `LoginPage`, `RegisterPage` | `LoginForm`, `RegisterForm` |
| `user-profile` | `ProfilePage`, `AddressListPage` | `ProfileForm`, `AddressForm`, `AddressCard` |
| `product` | `HomePage`, `ProductListPage`, `ProductDetailPage`, `CategoryPage`, `AdminProductListPage`, `AdminProductCreatePage`, `AdminProductEditPage` | `ProductCard`, `VariantSelector`, `ImageGallery`, `CategorySidebar`, `ProductCardSkeleton`, `ProductDetailSkeleton` |
| `cart` | `CartPage` | `CartItemList`, `CartItemRow`, `CartSummary`, `CartBadge`, `AddToCartButton`, `CartPageSkeleton` |
| `order` | `CheckoutPage`, `OrderHistoryPage`, `OrderDetailPage`, `AdminOrderListPage`, `AdminOrderDetailPage` | `OrderItemRow`, `OrderStatusBadge`, `OrderListSkeleton` |
| `review` | `MyReviewsPage` | `ReviewForm`, `ReviewList`, `ReviewCard` |

### Step 4: Register Routes & Verify

- Update `src/core/router/router.tsx` — lazy imports point to `pages/` (not `components/`)
- Apply correct guards: `AuthGuard` for protected, `RoleGuard` for admin
- Assign to correct layout: `MainLayout`, `AdminLayout`, or `AuthLayout`
- Run `npx tsc --noEmit` to verify zero errors

---

## Output

```
✅ Feature "<feature-name>" created!

📁 Files CREATED:
- src/features/<feature-name>/
  ├── pages/
  │   └── <Page>Page.tsx              (per page)
  ├── components/
  │   └── <Component>.tsx             (per component)
  ├── hooks/
  │   └── use<Action>.ts              (per operation)
  ├── services/
  │   └── <feature>.service.ts
  ├── stores/
  │   └── <feature>.store.ts          (auth, cart only)
  ├── types/
  │   └── <feature>.types.ts
  ├── utils/
  │   └── <feature>.util.ts
  ├── index.ts
  └── context.md

📝 Files UPDATED:
- src/core/router/router.tsx          (added lazy routes)

⚠️ Risks / Notes:
- If cross-feature dependencies exist, ensure dependent features are already generated

🚀 Next steps:
1. Run `npx tsc --noEmit` to verify compilation
2. Run `npm run dev` and test in browser
```

---

## Important Rules

1. **Pages in `pages/`, components in `components/`** — pages use default export, components use named export
2. **4-layer API architecture** — `axios-instance` → `service` → `hook` → `component` (never skip layers)
3. **Cross-feature imports via barrel only** — import from `@/features/product`, never from internal paths
4. **Server state in TanStack Query, not Zustand** — Zustand only for auth tokens and cart badge count
5. **Follow the docs** — all patterns (query keys, cache invalidation, forms, error handling) are in FE-PROJECT-RULES.md

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `<feature-name>` argument | Ask: "Which feature? Available: `auth`, `user-profile`, `product`, `cart`, `order`, `review`" |
| Feature not in known list | Ask user to provide pages, endpoints, and state requirements manually |
| Feature directory already exists | Ask: "Feature `<name>` already exists. Overwrite, merge, or skip?" |
| Core/shared layer missing | Suggest: "Set up core and shared layers first" |
| Dependent feature not found | Warn and proceed without cross-feature imports |
| API_SPEC.md not found | Ask user to provide endpoint definitions manually |
