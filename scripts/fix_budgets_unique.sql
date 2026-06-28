-- ============================================================
-- FIX: Multi-Tenant Unique Constraint on Budgets Table
-- This script safely replaces the legacy global unique constraint
-- with a tenant-isolated constraint to prevent UPSERT RLS collisions.
-- ============================================================

-- 1. Drop the old flawed unique constraint (which only checked category_id, month, year)
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS unique_category_budget_per_month;

-- 2. Add the correct tenant-isolated unique constraint
ALTER TABLE public.budgets ADD CONSTRAINT unique_category_budget_per_month UNIQUE (user_id, category_id, month, year);

-- 3. Update the index to match the new constraint pattern
DROP INDEX IF EXISTS idx_budgets_lookup;
CREATE INDEX idx_budgets_lookup ON public.budgets(user_id, category_id, month, year);

-- Note: The front-end Supabase JS upsert clause MUST now specify:
-- { onConflict: 'user_id, category_id, month, year' }
