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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("🔄 Starting self-healing restore and test seeding script...\n");

  // 1. Dapatkan user_id aktif dari transaksi ril user
  const { data: userTxs, error: txError } = await supabase
    .from("transactions")
    .select("user_id, description")
    .not("user_id", "is", null)
    .not("description", "like", "TEST_ANOMALY%")
    .limit(20);

  if (txError) {
    console.error("❌ Gagal membaca transaksi:", txError.message);
    process.exit(1);
  }

  // Cari user_id yang paling sering muncul
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

  // Jika tidak ditemukan dari transaksi, ambil user pertama dari auth.users
  if (!activeUserId) {
    console.log("⚠️ Tidak menemukan user_id dari transaksi aktif. Mencari di tabel auth...");
    // Gunakan query manual karena auth.users tidak bisa diakses langsung via client standard .from() tanpa RPC
    const { data: authUsers, error: authError } = await supabase.rpc("get_all_users_temp_debug");
    // Jika rpc tidak ada, kita coba select langsung via custom query sql, tapi kita bisa coba RPC default auth.users
    // Mari kita coba select user_id pertama dari wallets/goals dulu
    const { data: walletsData } = await supabase.from("wallets").select("user_id").not("user_id", "is", null).limit(1);
    if (walletsData && walletsData.length > 0) {
      activeUserId = walletsData[0].user_id;
    }
  }

  if (!activeUserId) {
    // Sebagai fallback terakhir, mari buat RPC sederhana atau query profiles
    console.log("⚠️ Mencari user_id dari profiles/users...");
    // Coba query langsung dari metadata auth
    const { data: profiles, error: profErr } = await supabase.from("profiles").select("id").limit(1);
    if (profiles && profiles.length > 0) {
      activeUserId = profiles[0].id;
    }
  }

  if (!activeUserId) {
    console.error("❌ Gagal mendeteksi User ID aktif Anda. Harap buat minimal satu transaksi atau wallet terlebih dahulu.");
    process.exit(1);
  }

  console.log(`🎯 Terdeteksi User ID Aktif Anda: ${activeUserId}\n`);

  // 2. Kembalikan kategori agar memiliki user_id = NULL (Global/Shared)
  console.log("🔓 Memulihkan kategori menjadi Global (user_id = NULL)...");
  const { error: catError } = await supabase
    .from("categories")
    .update({ user_id: null })
    .is("user_id", activeUserId); // hanya kembalikan yang tadinya ter-update

  if (catError) {
    // Fallback: update semua kategori sistem saja
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
    await supabase.from("categories").update({ user_id: null }).in("id", defaultCatIds);
  }
  console.log("✅ Kategori berhasil dipulihkan menjadi Global.");

  // 3. Pastikan wallet default terhubung ke user_id aktif agar terlihat di dashboard
  console.log("💼 Menghubungkan wallet default ke user_id aktif...");
  const defaultWalletIds = [
    "a1b2c3d4-0001-0001-0001-000000000001",
    "a1b2c3d4-0001-0001-0001-000000000002",
    "a1b2c3d4-0001-0001-0001-000000000003"
  ];
  await supabase
    .from("wallets")
    .update({ user_id: activeUserId })
    .in("id", defaultWalletIds);
  console.log("✅ Wallet default telah dihubungkan.");

  // 4. Masukkan data transaksi uji coba anomali
  console.log("⚙️ Menyiapkan data uji coba anomali (Juni 2026)...");

  // Cari/Buat Wallet BCA Utama
  let targetWalletId = "a1b2c3d4-0001-0001-0001-000000000001";
  const { data: walletCheck } = await supabase.from("wallets").select("id").eq("id", targetWalletId).single();
  if (!walletCheck) {
    const { data: anyWallet } = await supabase.from("wallets").select("id").eq("user_id", activeUserId).limit(1);
    if (anyWallet && anyWallet.length > 0) {
      targetWalletId = anyWallet[0].id;
    } else {
      const { data: newW } = await supabase
        .from("wallets")
        .insert({ name: "BCA Utama", balance: 12850000, user_id: activeUserId })
        .select()
        .single();
      targetWalletId = newW.id;
    }
  }

  // Dapatkan ID kategori
  let tagihanCatId = "b2c3d4e5-0002-0002-0002-000000000007"; // Tagihan
  let makananCatId = "b2c3d4e5-0002-0002-0002-000000000004"; // Makanan & Minuman

  // Hapus data uji coba lama agar tidak duplikat
  await supabase
    .from("transactions")
    .delete()
    .in("description", [
      "TEST_ANOMALY: Tagihan Bulanan (May)",
      "TEST_ANOMALY: Tagihan Bulanan (June)",
      "TEST_ANOMALY: Makan Malam Mewah"
    ])
    .eq("user_id", activeUserId);

  // A. TES 1: Subscription Price Hike (Kenaikan Harga Tagihan > 5%)
  // Mei 2026: Rp 500.000
  await supabase.from("transactions").insert({
    wallet_id: targetWalletId,
    category_id: tagihanCatId,
    amount: 500000,
    type: "EXPENSE",
    description: "TEST_ANOMALY: Tagihan Bulanan (May)",
    created_at: "2026-05-15T10:00:00+07:00",
    user_id: activeUserId
  });

  // Juni 2026: Rp 550.000 (+10% kenaikan, memicu status 'Critical')
  await supabase.from("transactions").insert({
    wallet_id: targetWalletId,
    category_id: tagihanCatId,
    amount: 550000,
    type: "EXPENSE",
    description: "TEST_ANOMALY: Tagihan Bulanan (June)",
    created_at: "2026-06-15T10:00:00+07:00",
    user_id: activeUserId
  });

  // B. TES 2: Category Daily Spending Spike (Lonjakan Pengeluaran Harian > 250% rata-rata 3 bulan)
  // Masukkan pengeluaran Rp 1.500.000 di bulan Juni (memicu status 'Warning')
  await supabase.from("transactions").insert({
    wallet_id: targetWalletId,
    category_id: makananCatId,
    amount: 1500000,
    type: "EXPENSE",
    description: "TEST_ANOMALY: Makan Malam Mewah",
    created_at: "2026-06-20T19:30:00+07:00",
    user_id: activeUserId
  });

  console.log("✅ Berhasil menyisipkan data uji coba anomali!");
  console.log("\n🎉 Selesai! Silakan refresh halaman Analytics dan pilih bulan Juni 2026.\n");
}

run().catch((e) => {
  console.error("Fatal error:", e);
});
