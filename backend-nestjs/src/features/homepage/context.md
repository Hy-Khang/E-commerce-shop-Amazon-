# Homepage Feature

## Purpose
Public endpoint that aggregates product data for the storefront homepage. Read-only analytics — no owned entities.

## Endpoint
- `GET /api/v1/homepage` — returns 4 product sections (special offers, best sellers, trending, discover more)

## Design Decisions
- **Flat DTO**: Pre-computes `price`, `originalPrice`, `maxDiscountPercent`, `inStock` via SQL GROUP BY. No variants array in response.
- **Promise.allSettled**: Each section fails independently — partial failures return `[]` without breaking other sections.
- **Best Sellers**: Uses `status IN ('delivered', 'completed')` for volume accuracy (not just `completed`).
- **Trending**: 30-day wishlist count. Includes `wishlistCount` in response for display.
- **Discover More**: Daily-seeded deterministic shuffle via `CHECKSUM(id + dateString)`.

## Dependencies
- `TypeOrmModule.forFeature([Order])` — for EntityManager access to cross-table queries.
