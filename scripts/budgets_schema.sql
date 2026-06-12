-- ============================================================
-- FinGram — Budgets Module Schema & Initial Seed
-- ============================================================

-- 1. Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(15, 2) NOT NULL CHECK (limit_amount >= 0),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2026),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Mencegah duplikasi anggaran untuk kategori yang sama di bulan yang sama
    CONSTRAINT unique_category_budget_per_month UNIQUE (category_id, month, year)
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_budgets_lookup ON public.budgets(category_id, month, year);

-- 3. Row Level Security (RLS)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 4. Permissive policy for local/demo prototype
DROP POLICY IF EXISTS allow_all_budgets ON public.budgets;
CREATE POLICY "allow_all_budgets"
  ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed initial budgets for June 2026
-- We query the UUIDs dynamically from the categories table based on their names.
INSERT INTO public.budgets (category_id, limit_amount, month, year)
SELECT id, 2500000, 6, 2026 FROM public.categories WHERE name = 'Makanan & Minuman'
UNION ALL
SELECT id, 1000000, 6, 2026 FROM public.categories WHERE name = 'Transportasi'
UNION ALL
SELECT id, 1200000, 6, 2026 FROM public.categories WHERE name = 'Hiburan'
UNION ALL
SELECT id, 2000000, 6, 2026 FROM public.categories WHERE name = 'Tagihan'
ON CONFLICT ON CONSTRAINT unique_category_budget_per_month DO UPDATE 
SET limit_amount = EXCLUDED.limit_amount;
