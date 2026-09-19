# PLAN — Shop Decoration v2 (Templates · Best-Sellers block · Rich Preview)

> **Module:** 26 — Shop Decoration (mở rộng)
> **Trạng thái tổng:** ⬜ Chưa bắt đầu (0/…) — chưa commit
> **Nhánh đề xuất:** `feature/shop-decoration-v2` (ra từ `develop`)
> **Cập nhật lần cuối:** 2026-09-19

---

## 1. Context

Module 26 (Shop Decoration) đã xong: block builder cho seller (`hero` / `rich_text` / `image` / `product_grid`) render phía trên "All Products" ở trang shop công khai. Sau khi review màn builder, cần 3 nâng cấp:

1. **Quick-start templates** — bộ mẫu trang trí có sẵn, seller bấm 1 phát ra layout hoàn chỉnh. Áp mẫu = **thay toàn bộ config, có xác nhận** khi đang có block.
2. **Best-sellers block** — loại block mới **tự động** hiện top sản phẩm bán chạy của shop (không ghim tay).
3. **Rich preview** — panel "Storefront preview" dựng **mini-storefront**: dải header (banner+logo+tên shop mẫu) → block → "All Products" với product card mẫu; block chưa cấu hình hiện **placeholder** ảnh/sản phẩm mẫu.

Tất cả **tương thích ngược** (config cũ vẫn chạy), giữ kiến trúc extensible.

**Phát hiện then chốt (giảm mạnh scope BE):** `GET /products` **đã hỗ trợ sẵn** cả `shop_id` filter và `sort=best_selling`. ⇒ Best-sellers block **KHÔNG cần endpoint BE mới** — FE gọi `GET /products?shop_id=X&sort=best_selling&order=desc&limit=N` và render `ProductCard`. BE chỉ cần nhận diện block type mới để **lưu** được.

**Quyết định đã chốt với user:**
- Preview = **full mock storefront** (header giả + block + All Products mẫu; block trống → placeholder).
- Áp template = **thay toàn bộ, có hộp xác nhận** khi đang có block.
- Sample/placeholder **chỉ bật khi `preview===true`** — trang công khai không bao giờ lộ sản phẩm giả.

---

## 2. Bảng tiến độ (Progress)

| Phase | Nội dung | Trạng thái |
|:-----:|----------|:----------:|
| A | BE: cho phép lưu block `best_sellers` | ✅ |
| B | FE: schema + render context dùng chung | ✅ |
| C | FE: Best-sellers block (hook + block + editor + wiring) | ✅ |
| D | FE: Quick-start templates (presets + gallery + confirm) | ✅ |
| E | FE: Rich preview (mock storefront + placeholder) | ✅ |
| F | Barrel + Docs | ✅ |
| G | Verification (typecheck/lint + manual) | 🟡 |

**Chú thích trạng thái:** ⬜ chưa làm · 🟡 đang làm · ✅ xong · ⛔ blocked

---

## 3. Checklist task

### Phase A — BE (1 file): `backend-nestjs/src/features/shop/dto/decoration-config.dto.ts`
- [ ] Thêm `'best_sellers'` vào `BLOCK_TYPES`
- [ ] Thêm `BestSellersBlockDataDto`: `title?` (`@MaxLength(80)`), `limit?` (`@IsIn([4,8,12])`), `columns?` (`@IsIn([2,3,4])`), tất cả `@IsOptional`
- [ ] Đăng ký `best_sellers: BestSellersBlockDataDto` vào `BLOCK_DATA_DTOS`
- [ ] Thêm `DECORATION_LIMITS.BEST_SELLERS_LIMITS = [4, 8, 12]`
- [ ] Không migration / endpoint / service mới

### Phase B — FE schema + render context
- [ ] `types/decoration.types.ts`: `BLOCK_TYPES` += `'best_sellers'`; `BLOCK_TYPE_LABELS.best_sellers`
- [ ] `BestSellersBlockData { title?; limit?: 4|8|12; columns?: 2|3|4 }` + `BlockDataMap`
- [ ] Zod `bestSellersDataSchema` + entry trong `discriminatedUnion('type', …)`
- [ ] `DECORATION_LIMITS.BEST_SELLERS_LIMITS = [4,8,12] as const` (khớp BE)
- [ ] Định nghĩa `DecorationRenderContext { shopId?; shopSlug?; preview? }`
- [ ] `ShopDecorationRenderer.tsx`: nhận `context?: DecorationRenderContext = {}`, truyền làm tham số 2 cho registry; thêm entry `best_sellers`

### Phase C — Best-sellers block
- [ ] `hooks/useShopBestSellers.ts` — `GET /products?shop_id=&sort=best_selling&order=desc&limit=`; key `['shop','best-sellers',shopId,limit]`; `enabled:!!shopId`; staleTime 5'
- [ ] `components/decoration/blocks/BestSellersBlock.tsx` — props `{ data, shopId?, preview? }`; grid `ProductCard`/skeleton; preview no-data → `SAMPLE_PRODUCTS`; empty thật → empty-state
- [ ] `components/decoration/builder/BestSellersBlockEditor.tsx` — title + limit(4/8/12) + columns(2/3/4), style portal, KHÔNG picker
- [ ] `decoration.util.ts` — `createBlock('best_sellers')` default `{ title:'Best sellers', limit:4, columns:4 }`
- [ ] `BlockListEditor.tsx` — palette entry (icon `TrendingUp`)
- [ ] `BlockEditorPanel.tsx` — dispatch best_sellers editor
- [ ] `ShopProfilePage.tsx` — `<ShopDecorationRenderer … context={{ shopId: shop.id, shopSlug: shop.slug }} />`

### Phase D — Quick-start templates
- [ ] `utils/decoration-presets.ts` — `DECORATION_PRESETS[]` với `build(): DecorationConfig` (id qua `newBlockId()`, ảnh placeholder từ `public/images/products/*`)
  - [ ] Clean & Simple (product_grid "Featured")
  - [ ] Brand Story (hero → rich_text → best_sellers 8)
  - [ ] Big Sale (hero + CTA → best_sellers 4 → image banner)
  - [ ] Best-Seller Showcase (best_sellers 8 → product_grid rỗng)
  - [ ] Minimal Welcome (rich_text → best_sellers 4)
- [ ] `components/decoration/builder/PresetGallery.tsx` — lưới card; bấm → nếu đang có block, confirm "This replaces your current blocks" → `onApply(preset.build())`
- [ ] `SellerShopDecorationPage.tsx` — card "Quick-start templates" phía trên BlockListEditor; `onApply` set config + clear selection

### Phase E — Rich preview (full mock storefront)
- [ ] `utils/decoration-preview-samples.ts` — `SAMPLE_PRODUCTS: ProductListItem[]` (id âm, ảnh `/images/products/*`, đủ field ProductCard) + `PLACEHOLDER_HERO_IMAGE`
- [ ] `DecorationPreview.tsx` — nhận `shop`; luôn dựng: mock header (banner/logo/tên) → renderer `context={{ shopId, shopSlug, preview:true }}` → mock "All Products" (`SAMPLE_PRODUCTS`); bỏ nhánh "preview will appear here"
- [ ] `HeroBlock.tsx` — `preview` & images rỗng → `[PLACEHOLDER_HERO_IMAGE]`
- [ ] `ImageBlock.tsx` — `preview` & url rỗng → khung placeholder
- [ ] `ProductGridBlock.tsx` — `preview` & ids rỗng → `SAMPLE_PRODUCTS`
- [ ] `BestSellersBlock.tsx` — `preview` no-data → `SAMPLE_PRODUCTS` (đã ở Phase C)
- [ ] Guard: placeholder/sample **chỉ khi `preview===true`**

### Phase F — Barrel + Docs
- [x] `features/shop/index.ts` — export `BestSellersBlockData`, `DecorationRenderContext`, `BEST_SELLERS_LIMITS`
- [x] `share-docs/API_SPEC.md` — thêm `best_sellers` vào danh sách block types; ghi chú hydrate qua `GET /products?shop_id=&sort=best_selling`
- [x] `share-docs/DATABASE.md` §2.3 — cập nhật danh sách block types
- [x] `share-docs/PROJECT_MODULES.md` Module 26 — best_sellers + templates + rich preview
- [x] `context.md` (FE + BE shop) — best_sellers, presets, preview samples, render context

### Phase G — Verification
- [x] BE `tsc --noEmit` + `eslint` trên `decoration-config.dto.ts` → sạch
- [x] BE: DTO validate `best_sellers` (reproduce ValidationPipe: `plainToInstance`+`validateSync`) — limit 4/8/12 + data rỗng → hợp lệ (200-path); limit=5 / columns=5 / field lạ / title>80 → reject (422 VALIDATION_001). 8/8 PASS
- [x] FE `tsc --noEmit -p tsconfig.app.json` + `eslint` toàn bộ file mới/sửa → sạch
- [ ] Manual (runtime/browser): best-sellers hiện top bán chạy thật ở `/shops/:slug`; shop chưa có đơn → empty-state (không crash)
- [ ] Manual (runtime/browser): templates áp đúng + confirm khi có block; Reset về mặc định
- [ ] Manual (runtime/browser): preview luôn có header+block+All Products mẫu; block trống → placeholder
- [ ] Manual (runtime/browser): trang công khai block rỗng KHÔNG hiện sản phẩm giả
- [ ] Backward-compat (runtime): `decoration_config = null` → layout mặc định như cũ

---

## 4. Files

**BE (1 file):** `shop/dto/decoration-config.dto.ts`

**FE mới:**
- `shop/hooks/useShopBestSellers.ts`
- `shop/components/decoration/blocks/BestSellersBlock.tsx`
- `shop/components/decoration/builder/BestSellersBlockEditor.tsx`
- `shop/components/decoration/builder/PresetGallery.tsx`
- `shop/utils/decoration-presets.ts`
- `shop/utils/decoration-preview-samples.ts`

**FE sửa:**
- `shop/types/decoration.types.ts`
- `shop/components/decoration/ShopDecorationRenderer.tsx`
- `shop/components/decoration/builder/DecorationPreview.tsx`
- `shop/components/decoration/blocks/{HeroBlock,ImageBlock,ProductGridBlock}.tsx`
- `shop/components/decoration/builder/{BlockListEditor,BlockEditorPanel}.tsx`
- `shop/utils/decoration.util.ts`
- `shop/pages/ShopProfilePage.tsx`
- `shop/pages/SellerShopDecorationPage.tsx`

---

## 5. Rủi ro / lưu ý
- **Không rò rỉ sample sang khách**: placeholder/sample chỉ bật khi `context.preview === true` — guard kỹ từng block.
- **`ProductListItem` sample đủ field** `ProductCard` cần (id, name, slug, thumbnail_url, variants[].price…); id âm tránh trùng.
- **FE↔BE limit khớp**: `BEST_SELLERS_LIMITS` (Zod) = `@IsIn([4,8,12])` (DTO).
- **Thứ tự làm**: Phase A→B→C trước D (presets dùng best_sellers) và E (preview dùng samples + context).
- Presets tham chiếu ảnh `/images/products/*` (đã có trong `public/`) — không hardcode URL ngoài.
