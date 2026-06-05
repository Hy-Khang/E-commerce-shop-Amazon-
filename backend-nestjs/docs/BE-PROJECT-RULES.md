# PROJECT-RULES.md — Backend (NestJS)

## 1. Tech Stack

- **Language:** TypeScript (strict mode)
- **Framework:** NestJS v11
- **ORM:** TypeORM (migrations only — never `synchronize: true` in production)
- **Database:** SQL Server
- **Auth:** JWT (access token 15min + refresh token 7d, stored hashed)

---

## 2. Project Structure

```
src/
├── features/          — all business features (self-contained modules)
├── common/            — shared: guards, interceptors, filters, decorators, pipes, dto, constants, interfaces
├── config/            — env & app config via @nestjs/config
├── database/          — TypeORM data-source, migrations, seeds
└── main.ts
```

### Per Feature

```
src/features/[feature-name]/
├── [feature-name].module.ts
├── [feature-name].controller.ts
├── [feature-name].service.ts
├── repositories/
│   └── [entity].repository.ts       — one per entity, wraps TypeORM Repository<Entity>
├── dto/
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   └── [entity]-response.dto.ts
├── entities/
│   └── [entity].entity.ts
├── types/
│   └── [feature-name].types.ts
├── utils/
│   └── [feature-name].util.ts
├── tests/
│   ├── [feature-name].controller.spec.ts
│   └── [feature-name].service.spec.ts
└── context.md                        — purpose, entities, dependencies, design decisions
```

### Feature List

| Feature | Folder | Owns Entities |
|---------|--------|---------------|
| Auth | `src/features/auth/` | roles, permissions, role_permissions, users, refresh_tokens |
| User Profile | `src/features/user-profile/` | addresses |
| Product | `src/features/product/` | categories, products, product_variants, product_images |
| Cart | `src/features/cart/` | carts, cart_items |
| Order | `src/features/order/` | orders, order_items |
| Review | `src/features/review/` | reviews |
| Wishlist | `src/features/wishlist/` | wishlist_items |
| Coupon | `src/features/coupon/` | coupons, coupon_categories, coupon_products, coupon_usages |
| Upload | `src/features/upload/` | — (file storage, no DB entities) |
| Dashboard | `src/features/dashboard/` | — (read-only analytics, no owned entities) |

---

## 3. Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Folders | kebab-case | `user-profile/`, `product/` |
| Files | kebab-case + suffix | `create-product.dto.ts`, `product.entity.ts` |
| Classes | PascalCase + suffix | `ProductService`, `CreateProductDto` |
| Functions / methods | camelCase | `findByVariantId()`, `calculateTotalAmount()` |
| Variables | camelCase | `cartItems`, `shippingFee` |
| Constants | UPPER_SNAKE_CASE | `MAX_CART_ITEMS`, `ORDER_STATUS` |
| Interfaces | PascalCase, prefix `I` | `IOrderResponse`, `IPaginatedResult` |
| Enums | PascalCase.PascalCase | `OrderStatus.Pending`, `PaymentStatus.Paid` |
| Entity class → table | Singular → plural snake_case | `class Product` → `@Entity('products')` |
| DB columns | snake_case in decorators | `@Column({ name: 'stock_quantity' })` |

---

## 4. Feature Boundary Rules

Each feature is a **self-contained NestJS module**. No reaching into another feature's internals.

### Cross-Feature Communication

```typescript
// ✅ DO — Module exports + DI
// order.module.ts
@Module({
  imports: [CartModule, ProductModule],  // import the MODULE
  ...
})
export class OrderModule {}

// order.service.ts
constructor(
  private readonly cartService: CartService,       // injected via DI
  private readonly productService: ProductService,
) {}
```

```typescript
// ❌ DON'T — Direct internal imports
import { ProductRepository } from '../product/repositories/product.repository';
import { ProductVariant } from '../product/entities/product-variant.entity';
```

### Decoupled Side Effects — EventEmitter2

```typescript
// order.service.ts — emit event after checkout
this.eventEmitter.emit('order.created', { orderId, items });

// product.service.ts — listen and deduct stock
@OnEvent('order.created')
async handleOrderCreated(payload: OrderCreatedEvent) {
  await this.productRepository.deductStock(payload.items);
}
```

### Feature Dependency Map

- **auth** owns user identity — other features receive `user_id` from JWT guard, never query `users` table directly
- **product** owns stock — order emits `order.created`, product handles stock deduction
- **cart → order** — order imports CartModule to read cart at checkout, then clears it
- **review** depends on order + product — imports their modules to verify purchase & product existence
- **order_items** snapshots product data at checkout — reads from product once, then stores independently

---

## 5. Code Patterns

### Error Handling

```typescript
// ✅ DO — NestJS built-in exceptions
throw new NotFoundException(`Product with slug "${slug}" not found`);
throw new BadRequestException('Quantity exceeds available stock');

// ✅ DO — Custom domain exceptions in common/exceptions/
export class InsufficientStockException extends BadRequestException {
  constructor(sku: string) {
    super(`Insufficient stock for variant ${sku}`);
  }
}

// ❌ DON'T
throw new Error('something went wrong');
```

### Validation — DTO Level Only

```typescript
// src/features/order/dto/create-order.dto.ts
export class CreateOrderDto {
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsInt()
  @IsPositive()
  address_id: number;
}
```

Global pipe in `main.ts`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Services assume valid input.

### Response Format

All responses wrapped by `common/interceptors/transform.interceptor.ts`:

```typescript
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 58 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Product not found" } }
```

### Auth Pattern

```typescript
// ✅ Public route
@Public()
@Get('products')
findAll() { ... }

// ✅ Permission-based access control (admin endpoints)
@Permissions(PERMISSIONS.PRODUCTS_CREATE)
@Post('products')
create(@CurrentUser() user: ICurrentUser, @Body() dto: CreateProductDto) { ... }
```

- `@CurrentUser()` extracts user from JWT — never parse `req.user` manually
- `JwtAuthGuard` applied globally, `@Public()` to opt out
- `PermissionsGuard` per-route via `@Permissions()` decorator — checks `role_permissions` table with caching
- Permission strings follow `resource:action` format — defined in `common/constants/permissions.constant.ts`

### Repository Pattern

```typescript
// ✅ DO — Injectable repository wrapping TypeORM
@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findBySlug(slug: string): Promise<Product | null> {
    return this.repo.findOne({ where: { slug, is_active: true } });
  }
}

// ❌ DON'T — Inject Repository directly into service
constructor(
  @InjectRepository(Product)
  private readonly productRepo: Repository<Product>,
) {}
```

### Stock — Optimistic Locking

```typescript
// ✅ DO — Atomic update with guard clause
await this.repo
  .createQueryBuilder()
  .update(ProductVariant)
  .set({ stock_quantity: () => `stock_quantity - :qty` })
  .where('id = :id AND stock_quantity >= :qty', { id: variantId, qty })
  .execute();

// ❌ DON'T — Read-then-write (race condition)
const variant = await this.repo.findOne(id);
variant.stock_quantity -= qty;
await this.repo.save(variant);
```

---

## 6. Anti-Patterns Checklist

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Import another feature's repo/entity directly | Import the feature's **module**, inject its **service** via DI |
| Business logic in controllers | Controllers: parse request → call service → return response |
| QueryBuilder / EntityManager in services | All queries go through repository layer |
| Hardcoded env values | Use `ConfigService` from `@nestjs/config` |
| Return entity objects from controllers | Map to response DTO — never expose `password_hash`, `is_revoked` |
| `synchronize: true` in production | TypeORM migrations only: `npm run migration:generate` / `migration:run` |
| Raw SQL strings scattered in code | QueryBuilder in repository layer only |
| Circular feature dependencies | Use EventEmitter2 or restructure boundaries |

---

## 7. Logging

```typescript
private readonly logger = new Logger(OrderService.name);

// Levels
this.logger.error(`Checkout failed for user ${userId}`, error.stack);   // exceptions
this.logger.warn(`Cart is empty for user ${userId}`);                    // business rule violations
this.logger.log(`Order #${orderId} created, payment: ${method}`);        // key actions
```

**Never log:** `password_hash`, `token_hash`, full payment details, PII beyond user ID.

---

## 8. Git Workflow

### Branch Naming

`[type]/[feature]-[short-description]` — e.g. `feat/cart-guest-merge`, `fix/order-payment-status`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Commit Messages — Conventional Commits

```
feat(order): add checkout endpoint
fix(cart): handle guest merge on login
refactor(auth): extract token hashing to util
```

### PR Requirements

- Reference task/issue number
- At least 1 approval from another team member
- All tests pass, no lint errors
- Description includes: what changed, why, how to test
- **Max 400 lines** per PR — split larger work into stacked PRs

---

## 9. Testing

- **Location:** co-located in each feature's `tests/` folder
- **Naming:** `*.spec.ts` (unit), `*.e2e-spec.ts` (integration)
- **Structure:** Arrange → Act → Assert

```typescript
describe('OrderService', () => {
  describe('checkout', () => {
    it('should create order with snapshot data from cart items', async () => {
      // Arrange
      const cart = mockCartWithItems(2);
      // Act
      const order = await service.checkout(userId, dto);
      // Assert
      expect(order.order_items).toHaveLength(2);
      expect(order.order_items[0].product_name).toBe(cart.items[0].variant.product.name);
    });
  });
});
```

**Coverage:** 80% line coverage for services, 60% overall — focus on business logic, not boilerplate.