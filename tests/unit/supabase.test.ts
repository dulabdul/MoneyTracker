import { describe, it, expect } from 'vitest';
import { 
  isCreditAccount, 
  getCreditUsed, 
  getCreditAvailable, 
  getCreditUsagePercent,
  type Wallet
} from '../../src/lib/supabase';

describe('Supabase Utilities', () => {
  const cashWallet: Wallet = {
    id: '1',
    name: 'Dompet Tunai',
    balance: 500000,
    account_type: 'cash',
    credit_limit: 0,
    billing_date: null,
    billing_month_offset: 0,
    due_date: null,
    due_month_offset: 0,
  };

  const creditWallet: Wallet = {
    id: '2',
    name: 'Kartu Kredit BCA',
    balance: -2000000, // 2 million used
    account_type: 'credit_card',
    credit_limit: 10000000, // 10 million limit
    billing_date: 20,
    billing_month_offset: 0,
    due_date: 10,
    due_month_offset: 1,
  };

  describe('isCreditAccount', () => {
    it('returns true for credit_card', () => {
      expect(isCreditAccount(creditWallet)).toBe(true);
    });

    it('returns false for cash', () => {
      expect(isCreditAccount(cashWallet)).toBe(false);
    });
  });

  describe('getCreditUsed', () => {
    it('returns positive debt for negative balance', () => {
      expect(getCreditUsed(creditWallet)).toBe(2000000);
    });

    it('returns 0 if balance is positive', () => {
      expect(getCreditUsed(cashWallet)).toBe(0);
    });
  });

  describe('getCreditAvailable', () => {
    it('calculates available credit correctly', () => {
      expect(getCreditAvailable(creditWallet)).toBe(8000000);
    });

    it('returns 0 if no credit limit', () => {
      expect(getCreditAvailable(cashWallet)).toBe(0);
    });
  });

  describe('getCreditUsagePercent', () => {
    it('calculates usage percentage correctly', () => {
      expect(getCreditUsagePercent(creditWallet)).toBe(20);
    });

    it('returns 0 if no credit limit', () => {
      expect(getCreditUsagePercent(cashWallet)).toBe(0);
    });
  });
});
