# GIT_WORKFLOW.md — Quy trình nhánh (Git Flow rút gọn)

> **Chốt ngày 2026-08-23.** Dự án theo **Git Flow rút gọn** với 2 nhánh sống lâu dài: `main` và `develop`.
> Trước đó (PR #1–#4: OrderTracking, shop-coupons, category-filters, admin-crud-modals) lỡ merge thẳng vào `main`
> nên `develop` từng bị bỏ lại. Từ nay **feature phải ra từ `develop` và PR về `develop`**, không đẩy thẳng vào `main`.

## Mô hình

```
main     ──●────────────────────────●──────────────▶   chỉ nhích khi RELEASE (nhận từ develop)
            \                       /
develop  ────●──●──●──●──●──●──●──●──●───────────────▶   nhánh tích hợp — mọi feature gộp vào đây
                \    /    \    /
feature/A ───────●──●      │             ra TỪ develop, PR VỀ develop
feature/B ──────────────────●──●          ra TỪ develop, PR VỀ develop
```

| Nhánh | Vai trò | Ai đụng vào |
|---|---|---|
| `main` | Bản ổn định đã release. Chỉ nhận từ `develop`, gắn tag version. | Chỉ lúc release |
| `develop` | Nhánh tích hợp, "bản mới nhất đang phát triển". Mọi feature merge vào đây. | Thường xuyên (qua PR) |
| `feature/*` | 1 nhánh / 1 feature. Ra từ `develop`, PR về `develop`, xong thì xóa. | Trong lúc code |

**Hướng chảy (điểm hay nhầm):** feature ⟶ develop (thường xuyên) · develop ⟶ main (chỉ khi release).
Chỉ đồng bộ **xuôi** từ `develop` xuống feature. **Không bao giờ** đẩy feature thẳng lên `main`.

## Vòng đời 1 feature (lặp mỗi lần)

```bash
# 1. Luôn bắt đầu từ develop mới nhất
git switch develop
git pull origin develop

# 2. Tạo feature branch TỪ develop
git switch -c feature/ten-tinh-nang

# 3. ...code, commit...

# 4. TRƯỚC KHI mở PR: đồng bộ feature với develop mới nhất (phòng người khác đã merge)
git switch develop && git pull origin develop
git switch feature/ten-tinh-nang && git merge develop   # xử lý conflict Ở ĐÂY

# 5. Push + mở PR:  feature/ten-tinh-nang  ──▶  develop   (KHÔNG phải main)
git push -u origin feature/ten-tinh-nang

# 6. PR duyệt → merge vào develop → xóa feature branch (local + remote)
```

**Mỗi lần làm feature chỉ cần đồng bộ 2 chỗ:**
1. Trước khi bắt đầu → `git pull origin develop` (base từ dev mới nhất).
2. Trước khi merge PR → gộp dev mới nhất vào feature để giải conflict.

`main` để yên giữa các feature — không đụng tới.

## Release (khi nào `main` mới nhích)

Gom đủ vài feature trong `develop`, chạy ổn, muốn ra bản chính thức:

```bash
# PR: develop ──▶ main  (trên GitHub), rồi:
git switch main && git pull origin main
git tag -a v1.1.0 -m "release: mô tả ngắn"
git push origin v1.1.0
```

Đây là lần **duy nhất** `develop → main`. Xong release, feature tiếp theo lại ra từ `develop`.

## Checklist nhanh trước khi tạo branch mới

- [ ] Đang đứng ở `develop` và đã `git pull origin develop`?
- [ ] Base có chứa code mình cần sửa/kế thừa không? (nếu code chỉ có trên nhánh chưa merge → branch từ nhánh đó, không phải develop)
- [ ] Tên nhánh theo `feature/*` (tính năng) hoặc `chore/*` / `fix/*` (dọn dẹp / sửa lỗi)?

## Lưu ý lịch sử (một lần)

`develop` từng lạc hậu 18 commit so với `main`. Đã fast-forward `develop` lên ngang `main` để lấy điểm xuất phát sạch:

```bash
git switch develop
git merge --ff-only origin/main
git push origin develop
```

Từ mốc này trở đi, tuân thủ quy trình trên — **không merge feature thẳng vào `main` nữa**.
