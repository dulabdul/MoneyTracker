import { describe, it, expect } from 'vitest';
import { formatIDR, formatCompact } from '../../src/lib/analytics';

describe('Analytics Formatters', () => {
  describe('formatIDR', () => {
    it('formats positive numbers as IDR currency', () => {
      expect(formatIDR(1500000)).toMatch(/Rp\s?1\.500\.000/);
    });

    it('formats zero as IDR currency', () => {
      expect(formatIDR(0)).toMatch(/Rp\s?0/);
    });

    it('formats negative numbers as IDR currency', () => {
      expect(formatIDR(-50000)).toMatch(/-Rp\s?50\.000/);
    });
  });

  describe('formatCompact', () => {
    it('formats billions', () => {
      expect(formatCompact(1500000000)).toBe('1.5M');
    });

    it('formats millions', () => {
      expect(formatCompact(1500000)).toBe('1.5jt');
    });

    it('formats thousands', () => {
      expect(formatCompact(50000)).toBe('50rb');
    });

    it('returns exact string for small numbers', () => {
      expect(formatCompact(500)).toBe('500');
    });

    it('handles negative numbers', () => {
      expect(formatCompact(-1500000)).toBe('-1.5jt');
    });
  });
});
