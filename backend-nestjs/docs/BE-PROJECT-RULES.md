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

- ✅ Import the **module**, inject its **service**: `OrderModule imports [CartModule] → OrderService injects CartService`
- ❌ Never import another feature's repository, entity, or DTO directly

### Decoupled Side Effects

- Use `EventEmitter2` for async fire-and-forget: `this.eventEmitter.emit('order.created', payload)` → listener in another feature handles it
- Example: `order.created` → product deducts stock; `order.cancelled` → product restores stock

### Feature Dependency Map

- **auth** owns user identity — other features receive `user_id` from JWT guard, never query `users` table directly
- **product** owns stock — order emits `order.created`, product handles stock deduction
- **cart → order** — order imports CartModule to read cart at checkout, then clears it
- **review** depends on order + product — imports their modules to verify purchase & product existence
- **order_items** snapshots product data at checkout — reads from product once, then stores independently

---

## 5. Code Patterns

### Error Handling
- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`) or custom exceptions in `common/exceptions/`
- Never `throw new Error()` — always a typed HTTP exception

### Validation
- DTO-level only via `class-validator` decorators. Global `ValidationPipe` handles it (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).
- Services assume valid input — no re-validation.

### Response Format
- All responses wrapped by `TransformInterceptor`: `{ success, data, meta? }` or `{ success: false, error: { code, message } }`

### Auth
- `@Public()` to skip auth. `@Permissions(PERMISSIONS.X)` for admin endpoints. `@CurrentUser()` for user context.
- Never parse `req.user` manually. Permission strings: `resource:action` format in `common/constants/permissions.constant.ts`.

### Repository
- Always wrap `TypeORM Repository<Entity>` in an `@Injectable()` repository class
- Never inject `@InjectRepository()` directly in services

### Stock
- Atomic updates with guard clause: `SET stock = stock - :qty WHERE stock >= :qty`
- Never read-then-write (race condition)

### Logging
- `new Logger(ClassName.name)` — `.error()` for exceptions, `.warn()` for business rule violations, `.log()` for key actions
- Never log: `password_hash`, `token_hash`, payment details, PII beyond user ID

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

