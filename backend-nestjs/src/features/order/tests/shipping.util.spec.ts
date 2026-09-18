import {
  haversineKm,
  calcDistanceShippingFee,
  isValidGeoPoint,
} from '../utils/shipping.util';
import {
  SHIPPING_MIN_FEE,
  SHIPPING_MAX_FEE,
} from '../types/order.types';

describe('shipping.util', () => {
  describe('haversineKm', () => {
    it('is 0 for the same point', () => {
      const p = { latitude: 21.0278, longitude: 105.8342 };
      expect(haversineKm(p, p)).toBeCloseTo(0, 5);
    });

    it('matches the Hà Nội ↔ TP.HCM great-circle distance (~1140 km)', () => {
      const hanoi = { latitude: 21.0278, longitude: 105.8342 };
      const hcm = { latitude: 10.8231, longitude: 106.6297 };
      const km = haversineKm(hanoi, hcm);
      expect(km).toBeGreaterThan(1100);
      expect(km).toBeLessThan(1200);
    });

    it('is symmetric', () => {
      const a = { latitude: 21.0278, longitude: 105.8342 };
      const b = { latitude: 20.8449, longitude: 106.6881 };
      expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
    });
  });

  describe('calcDistanceShippingFee', () => {
    it('charges the minimum within the base radius', () => {
      expect(calcDistanceShippingFee(0)).toBe(SHIPPING_MIN_FEE);
      expect(calcDistanceShippingFee(2)).toBe(SHIPPING_MIN_FEE);
      expect(calcDistanceShippingFee(5)).toBe(SHIPPING_MIN_FEE);
    });

    it('adds a per-km fee beyond the base radius', () => {
      // base 15000 + (10 - 5) * 3000 = 30000
      expect(calcDistanceShippingFee(10)).toBe(30000);
    });

    it('caps at the maximum for long distances', () => {
      expect(calcDistanceShippingFee(100)).toBe(SHIPPING_MAX_FEE);
      expect(calcDistanceShippingFee(2000)).toBe(SHIPPING_MAX_FEE);
    });

    it('rounds to the nearest 1.000 ₫', () => {
      const fee = calcDistanceShippingFee(7.3);
      expect(fee % 1000).toBe(0);
    });
  });

  describe('isValidGeoPoint', () => {
    it('rejects null / missing coordinates', () => {
      expect(isValidGeoPoint(null)).toBe(false);
      expect(isValidGeoPoint({ latitude: null, longitude: 105 })).toBe(false);
      expect(isValidGeoPoint({ latitude: 21, longitude: null })).toBe(false);
    });

    it('rejects the (0, 0) placeholder', () => {
      expect(isValidGeoPoint({ latitude: 0, longitude: 0 })).toBe(false);
    });

    it('accepts a real coordinate pair', () => {
      expect(isValidGeoPoint({ latitude: 21.0278, longitude: 105.8342 })).toBe(
        true,
      );
    });
  });
});
