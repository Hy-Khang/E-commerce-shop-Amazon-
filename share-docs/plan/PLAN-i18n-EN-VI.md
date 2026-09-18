# PLAN — Đa ngôn ngữ EN ⇄ VI (frontend-react)

> **Mục tiêu:** Toàn bộ `frontend-react` song ngữ Anh–Việt qua `react-i18next`, tự động nhận diện ngôn ngữ trình duyệt (mặc định EN), nhớ lựa chọn thủ công. Có công tắc chuyển ngôn ngữ ở cả storefront lẫn portal.
>
> **Cập nhật lần cuối:** 2026-09-19
> **Bảng theo dõi này = nguồn chân lý về tiến độ.** Mỗi lần làm xong 1 "slice" → tick vào đây.

---

## 0. Quyết định đã chốt

- **Phạm vi:** Tất cả — storefront + portal (admin/seller/shipper) + thông báo lỗi Zod + thông báo lỗi API.
- **Ngôn ngữ:** EN + VI, auto-detect (fallback EN), nhớ override thủ công (localStorage key `i18nextLng`).
- **Cơ chế:** `react-i18next` (thay scaffold tự viết cũ). Typed keys qua TS module augmentation (`i18next.d.ts`).
- **Lỗi API:** map FE `error.code → message` (`errors.json`), fallback về `error.message` gốc nếu chưa map.
- **KHÔNG động vào 2 design language** (storefront semantic tokens vs portal slate/teal) — i18n chỉ đụng text.

## Kiến trúc & quy ước (tóm tắt)

- Thư mục: `src/common/i18n/` — `config.ts`, `resources.ts`, `i18next.d.ts`, `zodErrorMap.ts`, `resolveApiErrorMessage.ts`, `useFormat.ts`, `LanguageSwitcher.tsx`, `enumLabel.ts`, `locales/{en,vi}/<ns>.json`.
- Dùng trong component: `const { t } = useTranslation('<ns>')` → `t('key')`.
- Enum/status/label maps: `useEnumLabel()` / `enumLabel(group, value)` → `enums.json`.
- Giá/ngày theo locale: `useFormat()` (reactive) — giá luôn VND, chỉ đổi cách nhóm số (`vi-VN` chấm vs `en-US` phẩy).
- Số nhiều: EN `_one`/`_other`, VI chỉ `_other`. Nội suy `{{var}}`.
- **Sub-component trong cùng file:** truyền `t` xuống dạng prop `t: TFunction<'ns'>` (import từ `i18next`), không gọi lại hook.
- **Kiểm tra EN/VI đồng bộ key:** script diff key theo namespace (bỏ hậu tố plural) — chạy lại sau mỗi slice.
- **Quy tắc "hardcode English" cũ đã bị thay thế** — UI mới/sửa phải dùng `t()`.

---

## Bảng tiến độ tổng quan

| Phase | Nội dung | Trạng thái |
|:-----:|----------|:----------:|
| 0 | Nền tảng (deps, config, typed, switcher, format, toast) | ✅ Xong |
| 1 | Enum/label maps (`enums.json` + component hiển thị dùng chung) | ✅ Xong (phần page-inline hoãn theo từng page) |
| 2 | Storefront (khách hàng) | ✅ Xong (16/16 feature) |
| 3 | Portal (admin/seller/shipper) | ⬜ Chưa |
| 4 | Zod validation messages (strip literal trong ~35 `types/*.types.ts`) | ⬜ Chưa (hạ tầng đã có) |
| 5 | Nối ~35 banner lỗi form/mutation vào `resolveApiErrorMessage` | ⬜ Chưa (hạ tầng đã có, toast đã nối) |

**Namespaces đang có:** `common, nav, toast, validation, errors, enums, cart, product, order, wishlist, review, notification, userProfile, recentlyViewed, shop` (15).

---

## Phase 0 — Nền tảng ✅ XONG (đã verify: tsc ✓, lint ✓, toast test 15/15)

- [x] Thêm deps `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- [x] `config.ts` (supportedLngs, fallbackLng EN, detector localStorage→navigator)
- [x] `i18next.d.ts` module augmentation (typed keys off EN `resources.ts`)
- [x] Wire provider + `<html lang>` sync (pre-paint script `index.html` + `languageChanged`)
- [x] `LanguageSwitcher` — đặt ở Header (storefront) + `PortalAccountDropdown` (portal)
- [x] Di dời 65 toast call-site sang `useTranslation('toast')`; `toast.util` dùng `i18n.t`
- [x] `formatPrice`/`formatDate` theo locale + hook `useFormat()`
- [x] Zod v4 error map (`zodErrorMap.ts` + `z.config`), `resolveApiErrorMessage`
- [x] Xóa scaffold cũ (`i18n.ts`, `i18n.store.ts`, selector `t((m)=>…)`)

## Phase 1 — Enum/label maps ✅ XONG

- [x] `enums.json` (EN+VI) đầy đủ: orderStatus, paymentStatus, paymentMethod, actorType, shopStatus, blockType, transaction…
- [x] `useEnumLabel()` / `enumLabel(group,value)`
- [x] Component hiển thị dùng chung: `OrderStatusBadge`, `OrderTimeline`, `OrderCard`
- [~] **Page-inline enum lookups** (Admin/Seller/Shipper order pages, `ShopFilters`, coupon/flash-sale/payment/decoration `*_LABELS`): giải quyết dần khi extract từng page. Order storefront + wishlist/review storefront đã chuyển xong phần của mình.

---

## Phase 2 — STOREFRONT (khách hàng) — ✅ XONG (16/16 feature)

### Đã xong ✅
- [x] **Chrome điều hướng** (`nav`): Header/NavBar/PortalLinks, MobileNav, UserDropdown, Footer, PortalAccountDropdown
- [x] **cart** (`cart`): CartPage, CartSummary, CartItemRow, CartShopGroup, AddToCartButton
- [x] **product — storefront** (`product`): HomePage/ProductListPage/ProductDetailPage/CategoryPage + toàn bộ component trưng bày (ProductCard, các section trang chủ, FilterSidebar, SortDropdown, ImageGallery, SearchBar, VisualSearchModal…)
- [x] **order/checkout — storefront** (`order`): CheckoutPage, CheckoutSuccessPage, OrderDetailPage, OrderHistoryPage + OrderStatusTabs/OrderCard/OrderItemRow/CheckoutShopGroup/CheckoutShopBreakdown/OrderTrackingMap. (CheckoutPage.test 5/5 ✓)
- [x] **wishlist — storefront** (`wishlist`): WishlistPage, WishlistItemCard, WishlistButton (WishlistBadge không có text)
- [x] **review — storefront** (`review`): MyReviewsPage, ReviewForm, ReviewList (ReviewCard chỉ render data — không cần đổi)
- [x] **notification** (`notification`): NotificationBell, NotificationDropdown, NotificationItem, NotificationPageItem, NotificationPage + `notification.util` (`formatRelativeTime` nhận `t`). Dùng chung cho cả storefront + portal (customer/seller/shipper/admin — text theo `context`)
- [x] **user-profile** (`userProfile`): ProfilePage, ProfileForm, AddressListPage, AddressCard, AddressForm, LocationPicker (tab labels → `labelKey` module-scope), AddressMapPicker (tọa độ nội suy `mapPicker.selected`). Banner lỗi form vẫn render `error.message` gốc → Phase 5 nối `resolveApiErrorMessage`
- [x] **recently-viewed** (`recentlyViewed`): RecentlyViewedCarousel (1 key `title` — carousel dùng lại ProductCard nên chỉ có tiêu đề section)
- [x] **shop — storefront công khai** (`shop`): ShopProfilePage (loading/notFound/allProducts/noProducts/pagination), ShopHeader (stats products/rating/sold — plural), ShopInfoCard (visitShop), decoration blocks HeroBlock (`hero.goToSlide` aria-label) + ProductGridBlock (empty state). RichTextBlock/ImageBlock/ShopDecorationRenderer/BlockErrorBoundary không có literal. **ShopFilters + ShopStatusBadge + AdminShop* + SellerShopSettings/Decoration + builder → Phase 3 (portal).**

### Đã xong ✅ (các feature storefront còn lại - Antigravity hoàn thành)
- [x] **coin** (Hoàn Xu) — trang ví Xu, CoinRedeemCard, lịch sử giao dịch
- [x] **compare** — CompareBar, trang so sánh sản phẩm
- [x] **recommendations** — các carousel "Gợi ý cho bạn" / "Tương tự" / "Mua kèm"
- [x] **payment** — trang kết quả thanh toán (PaymentResult), PaymentTransactionList (phần khách)
- [x] **seller-application** — form đăng ký bán hàng (phía khách)
- [x] **ai-chat** — widget chatbox nổi (storefront): khung chat, mini-checkout, quick replies

---

## Phase 3 — PORTAL (admin/seller/shipper) — ⬜ CHƯA (~90 file)

- [ ] **Chrome portal:** AdminLayout/SellerLayout/ShipperLayout, AdminGlobalSearch/SellerGlobalSearch
- [ ] **dashboard** — toàn bộ (admin/seller/shipper): thẻ thống kê, bảng, nhãn trục/legend/tooltip Recharts
- [ ] **product — portal:** trang admin/seller CRUD + Category*/Variants*/Images*/ProductDetailsForm/ImageUpload
- [ ] **order — portal:** AdminOrder*/SellerOrder*/Shipper* + ShipperLocationUpdater
- [ ] **shop — portal:** SellerShopSettingsPage/ShopSettingsForm, SellerShopDecorationPage + builder trang trí (BlockEditorPanel, HeroBlockEditor, …), AdminShop*
- [ ] **coupon — portal:** admin/seller CRUD, CouponFormModal, SCOPE_LABELS…
- [ ] **flash-sale — portal:** admin campaign + seller registration
- [ ] **seller-finance — portal:** ví/hoa hồng/rút tiền, WithdrawalRequestForm
- [ ] **review — portal:** ReviewFilters, ReviewsTable, AdminReviewListPage, SellerReviewListPage
- [ ] **wishlist — portal:** AdminWishlistPopularPage, SellerWishlistPopularPage
- [ ] **auth — RBAC:** quản lý role/permission/user
- [ ] **chat — seller inbox**
- [ ] **ai-chat — admin:** xem hội thoại + settings
- [ ] **coin — admin settings**, **seller-application — admin review**

## Phase 4 — Zod validation ⬜ CHƯA

- [x] Hạ tầng: `validation.json` + `zodErrorMap.ts` + `z.config` (đã có từ Phase 0)
- [ ] Strip literal inline trong ~35 `types/*.types.ts` (auth, product, user-profile, review, coupon, order, flash-sale…) + các form inline (RegisterForm, AddressForm, WithdrawalRequestForm, CouponFormModal, ShopSettingsForm) để global map cấp message

## Phase 5 — Lỗi API ⬜ CHƯA (phần lớn)

- [x] `errors.json` (map ~90 code) + `resolveApiErrorMessage` + đã nối vào `toast.util`
- [ ] Nối ~35 banner lỗi form/mutation `onError` đang render `error.message` sang `resolveApiErrorMessage`

---

## Sau khi hoàn tất toàn bộ
- [ ] Cập nhật `frontend-react/CLAUDE.md` (đảo quy ước: UI mới dùng `t()`)
- [ ] Cập nhật memory `feedback_ui_strings_english` (đã bị thay thế)

## Kiểm thử (chạy lại mỗi phase)
1. `npx tsc -b` — augmentation biến key sai thành lỗi biên dịch.
2. `npm run lint` + `npm run test` (đặc biệt CheckoutPage.test — đã khóa `i18n.changeLanguage('en')`).
3. Script diff key EN/VI theo namespace (bỏ hậu tố plural) → không thiếu/thừa.
4. E2E thủ công: auto-detect ngôn ngữ; toggle EN⇄VI ở header + portal; kiểm tra nav, luồng product→cart→checkout, 1 trang portal, status chip, form lỗi validate, lỗi API (coupon hết hạn); `<html lang>` đổi + nhớ qua reload; giá vẫn VND, ngày theo locale.
