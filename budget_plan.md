# Documentation: FinGram Budgeting Module

Dokumen ini berisi Rencana Pengembangan (Milestone Plan) dan Spesifikasi Kebutuhan Produk (PRD) untuk implementasi modul **Budgets** pada aplikasi manajemen kekayaan FinGram.

---

## 1. Rencana Pengembangan (Milestone Plan)

Rencana eksekusi ini dibagi menjadi 5 fase atomik untuk memastikan stabilitas kode, kemudahan proses *debugging*, dan integrasi yang lancar dengan komponen existing.

### [Fase 1] — Database & Schema Preparation
- [ ] Eksekusi DDL script untuk tabel `budgets` di Supabase SQL Editor.
- [ ] Tambahkan unique constraint pada kombinasi `(category_id, month, year)`.
- [ ] Daftarkan tipe data/interface TypeScript baru untuk entitas Budget di *codebase* (`src/types/`).

### [Fase 2] — Backend & Server-Side Aggregation (Astro SSR)
- [ ] Buat file halaman baru di `src/pages/budgets.astro` dengan konfigurasi SSR (`output: 'server'`).
- [ ] Tulis query Supabase untuk menarik data batas anggaran bulan berjalan.
- [ ] Tulis query agregasi untuk menjumlahkan pengeluaran (`SUM(amount)`) dari tabel `transactions` berdasarkan `category_id` untuk bulan berjalan.
- [ ] Integrasikan logika kalkulasi matematika untuk menghitung persentase penggunaan dan sisa anggaran.

### [Fase 3] — Frontend UI & Component Development
- [ ] Bangun layout dasar dengan membungkus halaman menggunakan Layout Wrapper existing (Sidebar & Navbar tetap aktif).
- [ ] Implementasikan 3 Top Metric Cards (Total Budget, Total Spent, Remaining Budget).
- [ ] Buat komponen kartu anggaran per kategori menggunakan varian kartu dari shadcn/ui.
- [ ] Terapkan logika pewarnaan kondisional Tailwind CSS v4 pada progress bar (Hijau, Kuning, Merah).
- [ ] Sematkan mikro-teks kalkulasi "Safe-to-Spend" harian pada masing-masing kartu.

### [Fase 4] — Interaktivitas & Mutasi Data (CRUD Modals)
- [ ] Integrasikan tombol "+ Set Budget" di area header halaman.
- [ ] Hubungkan tombol tersebut dengan modul Dialog/Modal shadcn/ui yang berisi form validasi.
- [ ] Implementasikan fitur "Edit Anggaran" dan "Hapus Anggaran" langsung pada kartu kategori.
- [ ] Pasang library toast notification untuk memunculkan alert sukses/gagal setiap ada mutasi data ke Supabase.

### [Fase 5] — Sinkronisasi Akhir & Verifikasi
- [ ] Validasi kecocokan data antara halaman Dashboard Overview (YTD Budget Summary) dengan akumulasi di halaman Budgets.
- [ ] Uji coba skenario *edge-case*: ketika pengeluaran melebihi 100% (pastikan progress bar tidak hancur secara visual).

---

## 2. Product Requirement Document (PRD)

### 2.1 Ringkasan Proyek & Tujuan
Modul **Budgets** berfungsi sebagai sistem pengendali finansial pada aplikasi FinGram. Fitur ini memecah target agregat tahunan/bulanan global menjadi batas operasional taktis per kategori transaksi. Pengguna dapat memantau kesehatan pengeluaran mereka secara *real-time* melalui visualisasi indikator warna yang intuitif serta mencegah pengeluaran berlebih sebelum terjadi.

### 2.2 Alur Kerja Pengguna (User Workflow)
1. **Penetapan Anggaran:** Pengguna membuka menu *Budgets* -> Mengeklik "+ Set Budget" -> Memilih Kategori (misal: Makanan) -> Memasukkan batas nominal (misal: Rp 3.000.000) -> Menyimpan data.
2. **Pemantauan Otomatis:** Setiap kali pengguna memasukkan transaksi pengeluaran baru di menu *Ledger* atau melalui Bot Telegram, batas kuota anggaran pada kategori terkait di menu *Budgets* akan otomatis berkurang secara *real-time*.

### 2.3 Kebutuhan Fungsional (Functional Requirements)

| ID | Komponen | Fitur | Deskripsi | Prioritas |
| :--- | :--- | :--- | :--- | :--- |
| **BR-01** | Backend (SSR) | Agregasi Data Bulanan | Sistem harus mampu menjumlahkan seluruh transaksi dengan tipe `EXPENSE` dari tabel `transactions` berdasarkan `category_id` pada bulan dan tahun berjalan, lalu membandingkannya dengan data di tabel `budgets`. | **P0** |
| **BR-02** | Frontend UI | Top Summary Cards | Menampilkan tiga metrik akumulasi tingkat tinggi: Total Budget, Total Spent, dan Remaining Budget untuk bulan aktif. | **P0** |
| **BR-03** | Visualisasi | Progress Bar Kondisional | Menampilkan bar kemajuan visual untuk setiap kategori dengan perubahan warna dinamis berbasis persentase penggunaan. | **P0** |
| **BR-04** | Fitur Pintar | Kalkulator Safe-to-Spend | Menampilkan estimasi kuota aman pengeluaran harian agar pengguna tidak melampaui batas anggaran sebelum akhir bulan. | **P1** |
| **BR-05** | Interaktivitas | CRUD Dialog Forms | Menyediakan form di dalam modal dialog untuk menambah, mengubah, atau menghapus alokasi anggaran tanpa memuat ulang seluruh halaman (*zero reload*). | **P1** |

### 2.4 Spesifikasi Teknis & Model Data

#### A. Skema Tabel Supabase PostgreSQL (`budgets`)
Untuk mendukung pelacakan berbasis waktu (bulan dan tahun), tabel `budgets` didesain terpisah dengan relasi kunci asing (*foreign key*) ke tabel `categories`.

```sql
CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(15, 2) NOT NULL CHECK (limit_amount >= 0),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2026),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Mencegah duplikasi anggaran untuk kategori yang sama di bulan yang sama
    CONSTRAINT unique_category_budget_per_month UNIQUE (category_id, month, year)
);

B. Logika Rumus Matematis (TypeScript Layer)
Persentase Penggunaan (P):
Plaintext
   P = (Total Spent / Limit Amount) * 100
Kalkulasi Safe-to-Spend Harian (S):
Dihitung dengan membagi sisa anggaran dengan jumlah hari tersisa di bulan berjalan (Days_Remaining).
Plaintext
   S = (Limit Amount - Total Spent) / Days_Remaining
2.5 Spesifikasi Antarmuka (UI/UX Design Rules)
Konsistensi Visual: Menggunakan warna dasar putih/abu-abu terang netral dengan sudut membulat tinggi (rounded-2xl atau rounded-3xl) yang identik dengan kartu pada komponen dashboard utama.
Logika Warna Progress Bar:
Hijau (bg-emerald-500): Penggunaan di bawah 70%. Menandakan kondisi keuangan aman.
Kuning (bg-amber-500): Penggunaan antara 70% hingga 90%. Bertindak sebagai status peringatan (warning).
Merah (bg-destructive atau bg-red-500): Penggunaan di atas 90% atau melampaui batas (> 100%). Menandakan kondisi kritis/kebocoran anggaran.
Feedback System: Setiap mutasi data (sukses menyimpan anggaran baru atau menghapusnya) wajib memicu komponen Toast Notification yang muncul di sudut layar dengan animasi halus dan teks konfirmasi yang jelas.
2.6 Kebutuhan Non-Fungsional (Non-Functional Requirements)
Sinkronisasi Data Mutlak: Agregasi matematika antara halaman Dashboard utama dan halaman Budgets tidak boleh memiliki selisih angka karena keduanya merujuk pada satu data source yang sama di Supabase.
Kecepatan Akses: Proses kalkulasi server-side (SSR) untuk data agregasi transaksi bulanan harus dioptimalkan menggunakan indeks database pada kolom category_id, month, dan year agar halaman dapat dimuat dalam waktu kurang dari 1.5 detik.