-- =========================================================================
-- Monty Anomaly Engine — Test Data Seeding Script (Self-Healing / Dynamic)
-- =========================================================================
--
-- CARA PENGGUNAAN:
-- 1. Buka SQL Editor di Dashboard Supabase Anda.
-- 2. Salin dan jalankan seluruh query di bawah ini.
-- 3. Buka halaman Analytics di Monty (pastikan memilih bulan Juni 2026).
--

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: Hubungkan Semua Data Seed Sebelumnya ke User ID Anda
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Mengambil user pertama dari auth.users (user Anda yang sedang login)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Tidak ada user ditemukan di auth.users. Silakan register/login terlebih dahulu di aplikasi.';
  ELSE
    RAISE NOTICE '🔗 Menghubungkan data seed ke User ID: %', v_user_id;
    
    UPDATE public.wallets SET user_id = v_user_id WHERE user_id IS NULL;
    UPDATE public.categories SET user_id = v_user_id WHERE user_id IS NULL;
    UPDATE public.transactions SET user_id = v_user_id WHERE user_id IS NULL;
    UPDATE public.financial_goals SET user_id = v_user_id WHERE user_id IS NULL;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: Cari/Buat Wallet dan Kategori Secara Dinamis Lalu Sisipkan Data Tes
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id uuid;
  v_wallet_id uuid;
  v_tagihan_cat_id uuid;
  v_makanan_cat_id uuid;
BEGIN
  -- 1. Dapatkan User ID yang aktif
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '⚠️ Tidak ada user ditemukan. Silakan register/login terlebih dahulu.';
  END IF;

  -- 2. Cari wallet milik user, jika belum ada, buat baru
  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_user_id LIMIT 1;
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (name, balance, user_id)
    VALUES ('BCA Utama', 12850000, v_user_id)
    RETURNING id INTO v_wallet_id;
    RAISE NOTICE 'Created test wallet: %', v_wallet_id;
  ELSE
    RAISE NOTICE 'Using existing wallet: %', v_wallet_id;
  END IF;

  -- 3. Cari/buat kategori 'Tagihan'
  SELECT id INTO v_tagihan_cat_id 
  FROM public.categories 
  WHERE name = 'Tagihan' AND type = 'EXPENSE' AND (user_id = v_user_id OR user_id IS NULL)
  LIMIT 1;
  
  IF v_tagihan_cat_id IS NULL THEN
    INSERT INTO public.categories (name, type, user_id)
    VALUES ('Tagihan', 'EXPENSE', v_user_id)
    RETURNING id INTO v_tagihan_cat_id;
  END IF;

  -- 4. Cari/buat kategori 'Makanan & Minuman'
  SELECT id INTO v_makanan_cat_id 
  FROM public.categories 
  WHERE name = 'Makanan & Minuman' AND type = 'EXPENSE' AND (user_id = v_user_id OR user_id IS NULL)
  LIMIT 1;
  
  IF v_makanan_cat_id IS NULL THEN
    INSERT INTO public.categories (name, type, user_id)
    VALUES ('Makanan & Minuman', 'EXPENSE', v_user_id)
    RETURNING id INTO v_makanan_cat_id;
  END IF;

  -- 5. Hapus data transaksi uji coba lama agar tidak duplikat
  DELETE FROM public.transactions 
  WHERE description IN ('TEST_ANOMALY: Tagihan Bulanan (May)', 'TEST_ANOMALY: Tagihan Bulanan (June)', 'TEST_ANOMALY: Makan Malam Mewah')
    AND user_id = v_user_id;

  -- 6. A. TES 1: Subscription Price Hike (Kenaikan Harga Tagihan > 5%)
  -- Mei 2026: Rp 500.000
  INSERT INTO public.transactions (wallet_id, category_id, amount, type, description, created_at, user_id)
  VALUES (v_wallet_id, v_tagihan_cat_id, 500000, 'EXPENSE', 'TEST_ANOMALY: Tagihan Bulanan (May)', '2026-05-15 10:00:00+07', v_user_id);
  
  -- Juni 2026: Rp 550.000 (+10% kenaikan, memicu status 'Critical')
  INSERT INTO public.transactions (wallet_id, category_id, amount, type, description, created_at, user_id)
  VALUES (v_wallet_id, v_tagihan_cat_id, 550000, 'EXPENSE', 'TEST_ANOMALY: Tagihan Bulanan (June)', '2026-06-15 10:00:00+07', v_user_id);

  -- 7. B. TES 2: Category Daily Spending Spike (Lonjakan Pengeluaran Harian > 250% rata-rata 3 bulan)
  -- Rata-rata harian 3 bulan untuk Makanan & Minuman berkisar ~Rp 8.388.
  -- Kita masukkan pengeluaran Rp 1.500.000 di bulan Juni (memicu status 'Warning')
  INSERT INTO public.transactions (wallet_id, category_id, amount, type, description, created_at, user_id)
  VALUES (v_wallet_id, v_makanan_cat_id, 1500000, 'EXPENSE', 'TEST_ANOMALY: Makan Malam Mewah', '2026-06-20 19:30:00+07', v_user_id);

  RAISE NOTICE '✅ Berhasil menambahkan data uji coba anomali untuk User ID: %', v_user_id;
END $$;
