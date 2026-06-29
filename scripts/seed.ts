/**
 * FinGram — Supabase Seed Script
 * Usage: npx tsx scripts/seed.ts
 *
 * Creates wallets, categories, and 30 realistic transactions spanning Jan–Jun 2026.
 * Safe to run multiple times: uses upsert so it won't duplicate data.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env from project root
dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl     = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const wallets = [
  { id: "a1b2c3d4-0001-0001-0001-000000000001", name: "BCA Utama",    balance: 12_850_000 },
  { id: "a1b2c3d4-0001-0001-0001-000000000002", name: "GoPay",         balance:  1_240_000 },
  { id: "a1b2c3d4-0001-0001-0001-000000000003", name: "Mandiri",       balance: 22_500_000 },
];

const categories = [
  { id: "b2c3d4e5-0002-0002-0002-000000000001", name: "Gaji",              type: "INCOME"         },
  { id: "b2c3d4e5-0002-0002-0002-000000000002", name: "Freelance",         type: "INCOME"         },
  { id: "b2c3d4e5-0002-0002-0002-000000000003", name: "Investasi Saham",   type: "INCOME"         },
  { id: "b2c3d4e5-0002-0002-0002-000000000004", name: "Makanan & Minuman", type: "EXPENSE"        },
  { id: "b2c3d4e5-0002-0002-0002-000000000005", name: "Transportasi",      type: "EXPENSE"        },
  { id: "b2c3d4e5-0002-0002-0002-000000000006", name: "Hiburan",           type: "EXPENSE"        },
  { id: "b2c3d4e5-0002-0002-0002-000000000007", name: "Tagihan",           type: "EXPENSE"        },
  { id: "b2c3d4e5-0002-0002-0002-000000000008", name: "Reksa Dana",        type: "INVESTMENT_BUY" },
];

const W1 = wallets[0].id, W2 = wallets[1].id, W3 = wallets[2].id;
const C1 = categories[0].id, C2 = categories[1].id, C3 = categories[2].id;
const C4 = categories[3].id, C5 = categories[4].id, C6 = categories[5].id;
const C7 = categories[6].id, C8 = categories[7].id;

const transactions = [
  // ── January 2026 ──
  { wallet_id: W3, category_id: C1, amount: 8_500_000, type: "INCOME",         description: "Gaji Bulan Januari",                created_at: "2026-01-01T08:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount: 1_200_000, type: "INCOME",         description: "Freelance — Dashboard Design",       created_at: "2026-01-05T14:00:00+07:00" },
  { wallet_id: W1, category_id: C4, amount:   320_000, type: "EXPENSE",        description: "Groceries Weekly",                  created_at: "2026-01-07T10:00:00+07:00" },
  { wallet_id: W1, category_id: C5, amount:    85_000, type: "EXPENSE",        description: "Bensin + Parkir",                   created_at: "2026-01-08T08:00:00+07:00" },
  { wallet_id: W1, category_id: C7, amount:   450_000, type: "EXPENSE",        description: "Tagihan PLN Bulan Januari",          created_at: "2026-01-10T09:00:00+07:00" },
  { wallet_id: W3, category_id: C8, amount: 2_000_000, type: "INVESTMENT_BUY", description: "Beli Reksa Dana Pendapatan Tetap",   created_at: "2026-01-15T10:00:00+07:00" },
  // ── February 2026 ──
  { wallet_id: W3, category_id: C1, amount: 8_500_000, type: "INCOME",         description: "Gaji Bulan Februari",               created_at: "2026-02-01T08:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount:   750_000, type: "INCOME",         description: "Freelance — Logo Redesign",          created_at: "2026-02-06T14:00:00+07:00" },
  { wallet_id: W1, category_id: C6, amount:   250_000, type: "EXPENSE",        description: "Nonton Bioskop (2 tiket)",           created_at: "2026-02-14T19:00:00+07:00" },
  { wallet_id: W2, category_id: C4, amount:   145_000, type: "EXPENSE",        description: "Makan di Restoran",                 created_at: "2026-02-18T13:00:00+07:00" },
  { wallet_id: W1, category_id: C7, amount:   425_000, type: "EXPENSE",        description: "Tagihan BPJS + PLN",                created_at: "2026-02-20T09:00:00+07:00" },
  { wallet_id: W3, category_id: C8, amount: 1_500_000, type: "INVESTMENT_BUY", description: "Top Up Reksa Dana Saham",           created_at: "2026-02-25T10:00:00+07:00" },
  // ── March 2026 ──
  { wallet_id: W3, category_id: C1, amount: 8_500_000, type: "INCOME",         description: "Gaji Bulan Maret",                  created_at: "2026-03-01T08:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount: 2_100_000, type: "INCOME",         description: "Upwork — Mobile App UI",             created_at: "2026-03-04T16:00:00+07:00" },
  { wallet_id: W1, category_id: C4, amount:   290_000, type: "EXPENSE",        description: "Belanja Bulanan Alfamart",           created_at: "2026-03-05T11:00:00+07:00" },
  { wallet_id: W1, category_id: C5, amount:    65_000, type: "EXPENSE",        description: "Grab ke Kantor (5 hari)",           created_at: "2026-03-10T08:00:00+07:00" },
  { wallet_id: W2, category_id: C6, amount:   119_900, type: "EXPENSE",        description: "Perpanjang YouTube Premium",         created_at: "2026-03-15T10:00:00+07:00" },
  { wallet_id: W3, category_id: C8, amount: 3_000_000, type: "INVESTMENT_BUY", description: "Beli Reksa Dana Campuran",           created_at: "2026-03-20T09:00:00+07:00" },
  // ── April 2026 ──
  { wallet_id: W3, category_id: C1, amount: 8_500_000, type: "INCOME",         description: "Gaji Bulan April",                  created_at: "2026-04-01T08:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount:   900_000, type: "INCOME",         description: "Freelance — Branding Kit",           created_at: "2026-04-08T14:00:00+07:00" },
  { wallet_id: W1, category_id: C4, amount:   280_000, type: "EXPENSE",        description: "Makan Siang Tim (4 orang)",          created_at: "2026-04-10T12:30:00+07:00" },
  { wallet_id: W1, category_id: C7, amount:   450_000, type: "EXPENSE",        description: "Tagihan Listrik & Air April",        created_at: "2026-04-12T09:00:00+07:00" },
  { wallet_id: W3, category_id: C3, amount: 1_200_000, type: "INCOME",         description: "Dividen Saham BBRI",                 created_at: "2026-04-20T10:00:00+07:00" },
  // ── May 2026 ──
  { wallet_id: W3, category_id: C1, amount: 8_500_000, type: "INCOME",         description: "Gaji Bulan Mei",                    created_at: "2026-05-01T08:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount: 1_650_000, type: "INCOME",         description: "Upwork — SaaS Landing Page",         created_at: "2026-05-06T15:00:00+07:00" },
  { wallet_id: W1, category_id: C5, amount:    95_000, type: "EXPENSE",        description: "Bensin & Tol Mingguan",             created_at: "2026-05-08T07:30:00+07:00" },
  { wallet_id: W2, category_id: C4, amount:   185_000, type: "EXPENSE",        description: "Dinner Anniversary",               created_at: "2026-05-20T19:00:00+07:00" },
  // ── June 2026 ──
  { wallet_id: W3, category_id: C1, amount: 8_500_000, type: "INCOME",         description: "Gaji Bulan Juni",                   created_at: "2026-06-01T08:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount: 1_850_000, type: "INCOME",         description: "Upwork — UI Design Project",         created_at: "2026-06-04T14:30:00+07:00" },
  { wallet_id: W1, category_id: C4, amount:   285_000, type: "EXPENSE",        description: "Makan Siang Bersama Tim",           created_at: "2026-06-05T12:00:00+07:00" },
  { wallet_id: W1, category_id: C5, amount:    85_000, type: "EXPENSE",        description: "Grab ke Kantor",                    created_at: "2026-06-06T07:45:00+07:00" },
  { wallet_id: W2, category_id: C6, amount:   119_900, type: "EXPENSE",        description: "Langganan YouTube Premium",          created_at: "2026-06-07T10:00:00+07:00" },
  { wallet_id: W3, category_id: C8, amount: 2_000_000, type: "INVESTMENT_BUY", description: "Beli Reksa Dana Pendapatan Tetap",   created_at: "2026-06-08T09:00:00+07:00" },
  { wallet_id: W2, category_id: C2, amount:   650_000, type: "INCOME",         description: "Freelance — Desain Logo",            created_at: "2026-06-10T15:00:00+07:00" },
  { wallet_id: W1, category_id: C7, amount:   450_000, type: "EXPENSE",        description: "Tagihan Listrik Bulan Juni",         created_at: "2026-06-11T08:30:00+07:00" },
];

// ─── Runner ───────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting FinGram seed...\n");

  const isProd = process.env.PUBLIC_SUPABASE_URL?.includes('supabase.co');
  if (isProd && !process.argv.includes('--danger-allow-production')) {
    console.error("❌ SAFETY LOCK: This script is destructive and cannot be run against production!");
    console.error("❌ If you absolutely must run this, pass the '--danger-allow-production' flag.");
    process.exit(1);
  }

  // 1. Upsert wallets
  console.log("📦 Upserting wallets...");
  const { error: walletErr } = await supabase.from("wallets").upsert(wallets, { onConflict: "id" });
  if (walletErr) { console.error("  ❌ Wallets error:", walletErr.message); process.exit(1); }
  console.log(`  ✅ ${wallets.length} wallets seeded`);

  // 2. Upsert categories
  console.log("📦 Upserting categories...");
  const { error: catErr } = await supabase.from("categories").upsert(categories, { onConflict: "id" });
  if (catErr) { console.error("  ❌ Categories error:", catErr.message); process.exit(1); }
  console.log(`  ✅ ${categories.length} categories seeded`);

  // 3. Insert transactions (no upsert — delete first for clean seed)
  console.log("📦 Clearing old transactions and inserting fresh data...");
  const { error: delErr } = await supabase.from("transactions").delete().gte("created_at", "2026-01-01");
  if (delErr) console.warn("  ⚠️ Could not delete old transactions:", delErr.message);

  const { error: txErr } = await supabase.from("transactions").insert(transactions);
  if (txErr) { console.error("  ❌ Transactions error:", txErr.message); process.exit(1); }
  console.log(`  ✅ ${transactions.length} transactions seeded`);

  console.log("\n✅ Seed complete! Open http://localhost:4321 to see live data.\n");
}

seed().catch((e) => { console.error("Fatal:", e); process.exit(1); });
