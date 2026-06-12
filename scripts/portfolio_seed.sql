-- ============================================================
-- FinGram — Asset Portfolio Schema + Seed Script (v2)
-- UNIT SEMANTICS:
--   Stocks  : total_units = LOT (1 lot = 100 lembar),  average_buy_price = IDR/lembar
--   Crypto  : total_units = jumlah koin (desimal),     average_buy_price = IDR/koin
--   Gold    : total_units = gram,                      average_buy_price = IDR/gram
--   Mutual  : total_units = unit reksa dana,           average_buy_price = NAV/unit
-- ============================================================

-- 1. Drop existing table
DROP TABLE IF EXISTS public.assets_portfolio CASCADE;

-- 2. Create table
CREATE TABLE public.assets_portfolio (
  id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name        text           NOT NULL,
  asset_type        text           NOT NULL CHECK (asset_type IN ('Gold', 'Stocks', 'Crypto', 'Mutual_Funds')),
  total_units       numeric(18, 8) NOT NULL DEFAULT 0,
  average_buy_price numeric(18, 2) NOT NULL DEFAULT 0,
  current_value     numeric(18, 2) NOT NULL DEFAULT 0,
  updated_at        timestamptz    NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_portfolio_type    ON public.assets_portfolio(asset_type);
CREATE INDEX idx_portfolio_updated ON public.assets_portfolio(updated_at DESC);

-- 4. RLS
ALTER TABLE public.assets_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_portfolio"
  ON public.assets_portfolio FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. Seed Data
-- ============================================================

INSERT INTO public.assets_portfolio
  (asset_name, asset_type, total_units, average_buy_price, current_value)
VALUES

-- ────────────────────────────────────────────────────────────
-- STOCKS (Saham IDX)
-- total_units = LOT, average_buy_price = IDR per LEMBAR
-- modal = total_units × 100 × average_buy_price
-- ────────────────────────────────────────────────────────────
--  BBRI: 15 lot → 1500 lembar, beli @4800/lembar → modal 7.200.000
--         current price ~5.300/lembar → nilai = 1500 × 5300 = 7.950.000
('BBRI',  'Stocks', 15,  4800,  7950000),

--  BMRI: 10 lot → 1000 lembar, beli @6200/lembar → modal 6.200.000
--         current price ~6600/lembar → nilai = 1000 × 6600 = 6.600.000
('BMRI',  'Stocks', 10,  6200,  6600000),

--  TLKM: 20 lot → 2000 lembar, beli @3500/lembar → modal 7.000.000
--         current price ~3400/lembar → nilai = 2000 × 3400 = 6.800.000
('TLKM',  'Stocks', 20,  3500,  6800000),

--  ASII: 5 lot → 500 lembar, beli @4900/lembar → modal 2.450.000
--         current price ~5200/lembar → nilai = 500 × 5200 = 2.600.000
('ASII',  'Stocks',  5,  4900,  2600000),

--  GOTO: 100 lot → 10.000 lembar, beli @120/lembar → modal 1.200.000
--         current price ~95/lembar → nilai = 10.000 × 95 = 950.000
('GOTO',  'Stocks', 100,  120,   950000),

-- ────────────────────────────────────────────────────────────
-- CRYPTO
-- total_units = jumlah koin, average_buy_price = IDR per koin
-- ────────────────────────────────────────────────────────────
--  BTC: 0.2 BTC, beli @850jt/BTC → modal 170jt
--         current ~1.015M/BTC → nilai = 0.2 × 1.015.000.000 = 203.000.000
('Bitcoin (BTC)',   'Crypto', 0.20000000, 850000000, 203000000),

--  ETH: 1.5 ETH, beli @45jt/ETH → modal 67.5jt
--         current ~48.75jt/ETH → nilai = 1.5 × 48.750.000 = 73.125.000
('Ethereum (ETH)',  'Crypto', 1.50000000,  45000000,  73125000),

--  SOL: 10 SOL, beli @2.2jt/SOL → modal 22jt
--         current ~2.75jt/SOL → nilai = 10 × 2.750.000 = 27.500.000
('Solana (SOL)',    'Crypto', 10.00000000,  2200000,  27500000),

--  BNB: 2 BNB, beli @8.5jt/BNB → modal 17jt
--         current ~9.5jt/BNB → nilai = 2 × 9.500.000 = 19.000.000
('BNB',             'Crypto',  2.00000000,  8500000,  19000000),

-- ────────────────────────────────────────────────────────────
-- GOLD (Emas)
-- total_units = GRAM, average_buy_price = IDR per gram
-- ────────────────────────────────────────────────────────────
--  Antam batangan: 30 gram, beli @1.050.000/gram → modal 31.500.000
--         current ~1.185.000/gram → nilai = 30 × 1.185.000 = 35.550.000
('Antam Batangan',        'Gold', 30.00, 1050000, 35550000),

--  Pegadaian Tabungan Emas: 15.5 gram, beli @1.050.000/gram → modal 16.275.000
--         current ~1.185.000/gram → nilai = 15.5 × 1.185.000 = 18.367.500
('Pegadaian Tabungan Emas', 'Gold', 15.50, 1050000, 18367500),

-- ────────────────────────────────────────────────────────────
-- MUTUAL FUNDS (Reksa Dana)
-- total_units = unit reksa dana, average_buy_price = NAV/unit saat beli
-- ────────────────────────────────────────────────────────────
--  Batavia Dana Saham: 15.000 unit, beli @8.500 NAV → modal 127.500.000
--         current NAV ~9.050 → nilai = 15.000 × 9.050 = 135.750.000
('Batavia Dana Saham',         'Mutual_Funds', 15000.00,  8500, 135750000),

--  Schroder Dana Istimewa: 8.000 unit, beli @12.000 NAV → modal 96.000.000
--         current NAV ~12.800 → nilai = 8.000 × 12.800 = 102.400.000
('Schroder Dana Istimewa',     'Mutual_Funds',  8000.00, 12000, 102400000),

--  Manulife Obligasi Negara: 20.000 unit, beli @4.500 NAV → modal 90.000.000
--         current NAV ~4.800 → nilai = 20.000 × 4.800 = 96.000.000
('Manulife Obligasi Negara',   'Mutual_Funds', 20000.00,  4500,  96000000),

--  Syailendra Equity Opportunity: 5.000 unit, beli @7.800 NAV → modal 39.000.000
--         current NAV ~8.450 → nilai = 5.000 × 8.450 = 42.250.000
('Syailendra Equity Opportunity', 'Mutual_Funds', 5000.00, 7800,  42250000);

-- ============================================================
-- Verification Query (run after seed to check)
-- ============================================================
-- SELECT
--   asset_type,
--   COUNT(*) as jumlah_aset,
--   SUM(current_value) as total_nilai_pasar,
--   CASE
--     WHEN asset_type = 'Stocks' THEN SUM(total_units * 100 * average_buy_price)
--     ELSE SUM(total_units * average_buy_price)
--   END as total_modal_awal
-- FROM public.assets_portfolio
-- GROUP BY asset_type
-- ORDER BY total_nilai_pasar DESC;
