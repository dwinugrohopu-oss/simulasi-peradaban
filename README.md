# Peradaban — idle game dengan penduduk yang belajar

Prototype 0.1, dibuat untuk layar komputer dan HP. Enam penduduk beraktivitas otomatis sementara pemain memilih prioritas masyarakat dan proyek pembangunan. Peta bergerak, statistik sumber daya, kartu penduduk, model belajar, serta catatan dunia disajikan dalam dashboard grid.

## Bermain

1. Biarkan penduduk mencari makanan, kayu, batu, dan pengetahuan.
2. Pilih arah peradaban: seimbang, ketahanan pangan, pembangunan, atau pengetahuan.
3. Rencanakan rumah, ladang, balai belajar, atau sumur saat bahan cukup. Bahan dibayar saat proyek dimulai; penduduk memilih sendiri kapan mengerjakannya.
4. Rumah menambah kapasitas penduduk. Ladang memberi panen pasif dan tindakan bertani. Balai belajar mempercepat penelitian serta pembelajaran. Sumur memulihkan kesehatan.
5. Klik **Lihat pembelajaran** untuk melihat nilai tindakan dalam situasi penduduk saat ini. Nilai Q dan eksplorasi membuat keputusan bisa berbeda antarpenduduk.
6. Pengetahuan 60 membuka era desa agraris; 200 membuka peradaban berkembang. Setiap tahun ada peristiwa dunia. Penduduk menua; pendatang bergabung bila tersedia rumah dan makanan, maksimal 16 penduduk aktif.

Satu hari simulasi = 4 detik; 60 hari = satu tahun. Kecepatan 1×, 4×, atau 16× berlaku saat bermain aktif. Tidak ada pembelian dengan uang nyata.

## Self-learning yang digunakan

**Tabular Q-learning**, dijalankan lokal di JavaScript tanpa server pelatihan, API berbayar, atau chatbot. Ini model reinforcement learning sederhana dengan state dan reward yang dirancang untuk game, bukan kecerdasan umum. Setiap penduduk memiliki tabel Q, pengalaman, keterampilan, dan hasil eksplorasinya sendiri; pendatang mulai dari nol.

State menggabungkan lapar/tidak lapar, energi rendah/cukup, makanan langka/cukup, proyek aktif/tidak, dan prioritas pemain. Penduduk memilih dari tindakan yang tersedia: mencari makanan, menebang kayu, menambang batu, bertani, membangun, meneliti, makan, istirahat, bersosialisasi.

Pembaruan:

```text
Q(s,a) ← Q(s,a) + α [reward + 0.75 × max Q(s',a') − Q(s,a)]
α = 0.16, atau 0.22 jika ada balai belajar
```

Eksplorasi turun secara bertahap dari 28% menuju 5%. Hadiah memperhitungkan sumber daya yang dihasilkan, kelangkaan pangan, kebutuhan individu, proyek, dan prioritas masyarakat. Tindakan yang dilakukan juga meningkatkan keterampilan produksi. Ada pengaman kebutuhan dasar yang **bukan hasil belajar**: makan saat sangat lapar bila tersedia makanan dan istirahat saat energi habis. Kebijakan memengaruhi reward; adaptasi memerlukan pengalaman, bukan perintah langsung ke semua penduduk. Game belum menggunakan neural network, LLM, transfer model antarpemain, atau simulasi ekonomi kompleks.

## Progres dan waktu saat ditutup

- Autosave setiap 5 detik dan saat meninggalkan halaman memakai `localStorage` pada browser/origin yang sama.
- Simpanan mencakup dunia, RNG, penduduk, keterampilan, dan tabel Q. Gunakan **Unduh simpanan** dan **Impor simpanan** untuk cadangan atau pindah perangkat.
- Saat kembali, simulasi menghitung waktu berlalu maksimal **8 jam**, pada kecepatan normal. Penduduk tetap membutuhkan pangan dan bisa meninggal dalam simulasi ini. Dunia yang dijeda tidak maju saat ditutup.
- Simulasi tidak benar-benar berjalan di server saat browser tertutup; hasil dihitung ketika kembali.
- Menghapus data situs, memakai mode privat, atau pindah URL/domain dapat menghilangkan akses ke simpanan lokal. Ekspor dahulu. Tidak ada sinkronisasi akun/cloud.
- Arsip penduduk dibatasi hingga 100 catatan terbaru (penduduk aktif selalu dipertahankan) agar ukuran simpanan stabil. Jumlah keputusan dan kematian total tetap dicatat.
- Simpanan rusak tidak ditimpa otomatis; unduh arsip lama lalu impor cadangan atau mulai dunia baru. File impor divalidasi sebelum mengganti dunia.

## Jalankan lokal

Diperlukan Node.js 20+ untuk pengujian/build; game sendiri hanya memerlukan browser modern.

```bash
python3 -m http.server 8000
```

Buka `http://localhost:8000`. Jangan membuka `index.html` melalui `file://` karena game memakai JavaScript modules.

```bash
npm test
node build.mjs
```

Tidak ada dependency npm. Build menyalin empat file game ke `dist/`.

## Pasang di Render

Buat layanan **Static Site** dari repo ini:

| Pengaturan | Nilai |
|---|---|
| Branch | `main` |
| Root Directory | Kosong |
| Build Command | `node build.mjs` |
| Publish Directory | `dist` |

Tidak perlu Start Command, database, secret key, atau disk persisten. Progres disimpan di perangkat pemain. Render mendukung deployment situs statis dari repo Git dan pembaruan saat branch mendapat push: https://render.com/docs/static-sites

## Struktur

- `engine.js`: simulasi, RNG deterministik, Q-learning, proyek, waktu berlalu, validasi simpanan.
- `app.js`: UI, peta Canvas, grafik, kontrol, autosave dan ekspor/impor.
- `index.html`, `style.css`: dashboard responsif.
- `tests/engine.test.js`: reproduksibilitas, pembaruan Q, pemilihan tindakan, kebutuhan dasar, waktu berlalu, pembangunan, validasi, simulasi panjang.

Semua grafis peta digambar dengan Canvas; tidak ada aset pihak ketiga atau layanan gambar saat bermain.
