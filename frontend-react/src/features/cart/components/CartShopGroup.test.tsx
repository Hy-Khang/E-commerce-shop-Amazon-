import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppliedCouponEntry } from '@/features/coupon';
import { CartShopGroup } from './CartShopGroup';
import type { CartShopGrouping } from '../utils/cart.util';

function grouping(): CartShopGrouping {
  return {
    shop_id: 1,
    shop_name: 'Shop One',
    items: [
      {
        id: 11,
        product_variant_id: 101,
        quantity: 2,
        shop_id: 1,
        shop_name: 'Shop One',
        variant: {
          sku: 'S1',
          option1: null,
          option2: null,
          option1_label: null,
          option2_label: null,
          price: 100000,
          sale_price: null,
          flash_price: null,
          stock_quantity: 10,
          product_name: 'Product One',
          thumbnail_url: null,
        },
      },
    ],
  };
}

function renderGroup(over: Partial<Parameters<typeof CartShopGroup>[0]> = {}) {
  const props = {
    group: grouping(),
    showVoucher: true,
    onOpenVoucher: vi.fn(),
    onRemoveCoupon: vi.fn(),
    onUpdateQuantity: vi.fn(),
    onRemove: vi.fn(),
    isUpdating: false,
    ...over,
  };
  render(<CartShopGroup {...props} />);
  return props;
}

describe('CartShopGroup', () => {
  it('renders the shop name, its items and a voucher button', () => {
    renderGroup();
    expect(screen.getByText('Shop One')).toBeInTheDocument();
    expect(screen.getByText('Product One')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Select shop voucher/i }),
    ).toBeInTheDocument();
  });

  it('opens the voucher picker for its shop id', async () => {
    const user = userEvent.setup();
    const { onOpenVoucher } = renderGroup();
    await user.click(screen.getByRole('button', { name: /Select shop voucher/i }));
    expect(onOpenVoucher).toHaveBeenCalledWith(1);
  });

  it('shows an applied shop coupon instead of the select button', () => {
    const applied: AppliedCouponEntry = {
      code: 'SHOP1-SALE',
      validation: {
        valid: true,
        code: 'SHOP1-SALE',
        discount_type: 'fixed',
        discount_value: 20000,
        max_discount_amount: null,
        min_order_amount: null,
        scope: 'all',
        applicable_category_ids: null,
        applicable_product_ids: null,
        shop_id: 1,
      },
    };
    renderGroup({ appliedShopCoupon: applied });
    expect(screen.getByText('SHOP1-SALE')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Select shop voucher/i }),
    ).not.toBeInTheDocument();
  });

  it('hides the voucher row for guests (showVoucher=false)', () => {
    renderGroup({ showVoucher: false });
    expect(
      screen.queryByRole('button', { name: /Select shop voucher/i }),
    ).not.toBeInTheDocument();
    // items still render
    expect(screen.getByText('Product One')).toBeInTheDocument();
  });
});
