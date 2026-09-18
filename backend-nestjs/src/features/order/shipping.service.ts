import { Injectable, Logger } from '@nestjs/common';
import { ShopService } from '../shop/shop.service';
import { DEFAULT_SHIPPING_FEE } from './types/order.types';
import {
  calcDistanceShippingFee,
  haversineKm,
  isValidGeoPoint,
  IGeoPoint,
} from './utils/shipping.util';

/**
 * Shipping fee resolver (Module: Shipping — H1 distance-based).
 *
 * Computes a per-shop fee from the great-circle distance between the shop's
 * pickup coordinates (`shops.latitude/longitude`) and the delivery address
 * (`addresses.latitude/longitude`). Falls back to the flat `DEFAULT_SHIPPING_FEE`
 * whenever a distance can't be computed (either side missing coordinates), so
 * legacy/manual addresses and un-located shops still check out.
 *
 * Designed as the single strategy entry point: a carrier-API strategy (GHN/GHTK)
 * can later wrap this — try the provider, fall back to distance, fall back to
 * flat — without touching checkout/preview, which both call this one method so
 * their totals always match.
 */
@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly shopService: ShopService) {}

  /**
   * Resolve the shipping fee (₫) for each shop given the delivery destination.
   * A missing/invalid destination or shop pickup point → flat fallback for that
   * shop. Every requested shopId is present in the returned map.
   */
  async computeShippingByShop(
    destination: IGeoPoint | null,
    shopIds: number[],
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    const validDestination = isValidGeoPoint(destination);

    for (const shopId of shopIds) {
      result.set(shopId, await this.resolveFeeForShop(shopId, destination, validDestination));
    }
    return result;
  }

  private async resolveFeeForShop(
    shopId: number,
    destination: IGeoPoint | null,
    validDestination: boolean,
  ): Promise<number> {
    if (!validDestination || !destination) return DEFAULT_SHIPPING_FEE;

    let origin: { latitude?: number | null; longitude?: number | null } | null;
    try {
      origin = await this.shopService.findShopById(shopId);
    } catch {
      // Shop deleted/unreadable — fall back to flat.
      return DEFAULT_SHIPPING_FEE;
    }

    if (!isValidGeoPoint(origin)) return DEFAULT_SHIPPING_FEE;

    const distanceKm = haversineKm(
      { latitude: Number(origin.latitude), longitude: Number(origin.longitude) },
      destination,
    );
    return calcDistanceShippingFee(distanceKm);
  }
}
