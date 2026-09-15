import { SettingsService } from '../settings.service';
import { AppSettingRepository } from '../repositories/app-setting.repository';
import { CommissionCategoryRateRepository } from '../repositories/commission-category-rate.repository';
import { ProductService } from '../../product/product.service';
import { Category } from '../../product/entities/category.entity';
import { CommissionCategoryRate } from '../entities/commission-category-rate.entity';

/** Minimal category tree node builder for the cascade tests. */
function cat(id: number, children: Category[] = []): Category {
  return { id, children } as Category;
}

function rate(categoryId: number, ratePercent: number): CommissionCategoryRate {
  return { category_id: categoryId, rate_percent: ratePercent } as CommissionCategoryRate;
}

describe('SettingsService.getCommissionCategoryRateMap (cascade)', () => {
  let service: SettingsService;
  let categoryRateRepo: { findAll: jest.Mock };
  let productService: { getCategoryTree: jest.Mock };

  //  1 Điện tử
  //    11 Điện thoại
  //      111 iPhone
  //    12 Laptop
  //  2 Thời trang
  //    21 Áo
  const tree: Category[] = [
    cat(1, [cat(11, [cat(111)]), cat(12)]),
    cat(2, [cat(21)]),
  ];

  beforeEach(() => {
    categoryRateRepo = { findAll: jest.fn() };
    productService = { getCategoryTree: jest.fn().mockResolvedValue(tree) };
    service = new SettingsService(
      {} as AppSettingRepository,
      categoryRateRepo as unknown as CommissionCategoryRateRepository,
      productService as unknown as ProductService,
    );
  });

  it('returns an empty map (and skips the tree query) when there are no overrides', async () => {
    categoryRateRepo.findAll.mockResolvedValue([]);

    const map = await service.getCommissionCategoryRateMap();

    expect(map.size).toBe(0);
    expect(productService.getCategoryTree).not.toHaveBeenCalled();
  });

  it('cascades a parent override down to every descendant', async () => {
    categoryRateRepo.findAll.mockResolvedValue([rate(1, 5)]);

    const map = await service.getCommissionCategoryRateMap();

    // 1 and its whole subtree inherit 5%
    expect(map.get(1)).toBe(5);
    expect(map.get(11)).toBe(5);
    expect(map.get(111)).toBe(5);
    expect(map.get(12)).toBe(5);
    // The unrelated Thời trang subtree has no ancestor override → omitted
    expect(map.has(2)).toBe(false);
    expect(map.has(21)).toBe(false);
  });

  it("lets a child's own override win over the inherited parent rate", async () => {
    categoryRateRepo.findAll.mockResolvedValue([rate(1, 5), rate(11, 8)]);

    const map = await service.getCommissionCategoryRateMap();

    expect(map.get(1)).toBe(5); // parent
    expect(map.get(11)).toBe(8); // own override wins
    expect(map.get(111)).toBe(8); // grandchild inherits the nearer override
    expect(map.get(12)).toBe(5); // sibling still inherits the parent
  });

  it('covers a leaf-only override without cascading it upward', async () => {
    categoryRateRepo.findAll.mockResolvedValue([rate(111, 12)]);

    const map = await service.getCommissionCategoryRateMap();

    expect(map.get(111)).toBe(12);
    // Ancestors have no override of their own → not in the map (fall back to platform rate)
    expect(map.has(11)).toBe(false);
    expect(map.has(1)).toBe(false);
  });
});
