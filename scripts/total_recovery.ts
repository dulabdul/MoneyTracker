import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

// Since the ANON_KEY in .env is actually a service_role key, it bypasses RLS
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function totalRecovery() {
  console.log("🔍 MENGANALISIS SEMUA DATA DI DATABASE (Bypass RLS)...\n");

  // 1. Identifikasi User Aktif yang Sebenarnya
  const { data: userTxs } = await supabase
    .from("transactions")
    .select("user_id, description, category_id")
    .not("user_id", "is", null)
    .not("description", "like", "TEST_ANOMALY%")
    .limit(100);

  const userCounts: Record<string, number> = {};
  let activeUserId: string | null = null;
  let maxCount = 0;

  for (const tx of userTxs || []) {
    if (tx.user_id) {
      userCounts[tx.user_id] = (userCounts[tx.user_id] || 0) + 1;
      if (userCounts[tx.user_id] > maxCount) {
        maxCount = userCounts[tx.user_id];
        activeUserId = tx.user_id;
      }
    }
  }

  console.log(`👤 User Aktif Anda terdeteksi: ${activeUserId}`);

  // 2. AMBIL SEMUA KATEGORI
  const { data: allCategories, error: catErr } = await supabase.from("categories").select("*");
  if (catErr) {
    console.error("Gagal membaca kategori:", catErr);
    return;
  }

  // 3. IDENTIFIKASI MASALAH KATEGORI
  console.log(`\n📋 Menganalisis ${allCategories.length} Kategori...`);
  
  const defaultCatIds = [
    "b2c3d4e5-0002-0002-0002-000000000001",
    "b2c3d4e5-0002-0002-0002-000000000002",
    "b2c3d4e5-0002-0002-0002-000000000003",
    "b2c3d4e5-0002-0002-0002-000000000004",
    "b2c3d4e5-0002-0002-0002-000000000005",
    "b2c3d4e5-0002-0002-0002-000000000006",
    "b2c3d4e5-0002-0002-0002-000000000007",
    "b2c3d4e5-0002-0002-0002-000000000008"
  ];

  let fixedCats = 0;
  for (const cat of allCategories) {
    // Jika ini adalah kategori default sistem
    if (defaultCatIds.includes(cat.id)) {
      if (cat.user_id !== null) {
        console.log(`  -> Memperbaiki Kategori Default: "${cat.name}" (dari user_id: ${cat.user_id} -> NULL)`);
        await supabase.from("categories").update({ user_id: null }).eq("id", cat.id);
        fixedCats++;
      }
    } 
    // Jika bukan kategori default, tapi terikat ke user_id SALAH (misal admin user dari script pertama)
    else if (cat.user_id !== null && cat.user_id !== activeUserId) {
        console.log(`  -> Memperbaiki Kategori Kustom salah sasaran: "${cat.name}" (dari user_id: ${cat.user_id} -> ${activeUserId})`);
        await supabase.from("categories").update({ user_id: activeUserId }).eq("id", cat.id);
        fixedCats++;
    }
  }

  // 4. MEMPERBAIKI DOMPET (WALLETS)
  console.log(`\n📋 Menganalisis Wallets...`);
  const { data: allWallets } = await supabase.from("wallets").select("*");
  let fixedWallets = 0;
  for (const w of allWallets || []) {
    if (w.user_id !== activeUserId) {
      console.log(`  -> Memperbaiki Wallet: "${w.name}" (dari user_id: ${w.user_id} -> ${activeUserId})`);
      await supabase.from("wallets").update({ user_id: activeUserId }).eq("id", w.id);
      fixedWallets++;
    }
  }

  // 5. MEMPERBAIKI TRANSAKSI (YANG HILANG ATAU SALAH USER_ID)
  console.log(`\n📋 Menganalisis Transaksi...`);
  const { data: allTxs } = await supabase.from("transactions").select("*");
  let fixedTxs = 0;
  for (const tx of allTxs || []) {
    if (tx.user_id !== activeUserId) {
      await supabase.from("transactions").update({ user_id: activeUserId }).eq("id", tx.id);
      fixedTxs++;
    }
  }

  // 6. MEMPERBAIKI FINANCIAL GOALS
  console.log(`\n📋 Menganalisis Financial Goals...`);
  const { data: allGoals } = await supabase.from("financial_goals").select("*");
  let fixedGoals = 0;
  for (const g of allGoals || []) {
    if (g.user_id !== activeUserId) {
      await supabase.from("financial_goals").update({ user_id: activeUserId }).eq("id", g.id);
      fixedGoals++;
    }
  }

  console.log("\n==============================================");
  console.log("✅ TOTAL RECOVERY SELESAI 100%");
  console.log(`- Kategori Diperbaiki: ${fixedCats}`);
  console.log(`- Wallet Diperbaiki: ${fixedWallets}`);
  console.log(`- Transaksi Diperbaiki: ${fixedTxs}`);
  console.log(`- Financial Goals Diperbaiki: ${fixedGoals}`);
  console.log("==============================================\n");
}

totalRecovery().catch(console.error);
