# Audit keterhubungan mekanik — 0.5.0

Permintaan audit: mekanik terasa tidak saling terhubung. Pemeriksaan menemukan masalah nyata pada implementasi 0.4, bukan hanya cara tampilannya.

| Temuan | Perbaikan dan bukti regresi |
|---|---|
| Industri menambah stok tanpa operator; peleburan mengikuti kerja umum | Tindakan bahan bakar, peleburan, paduan dan listrik dipisahkan; pengetahuan, fasilitas dan input wajib. Uji semua warga istirahat tidak menghasilkan stok. |
| Ambang riset membuka penemuan seketika; kegagalan alat dihitung sebagai bukti sukses | Peneliti yang memenuhi syarat membayar bahan sekali dan menyelesaikan pekerjaan riset. Bukti memakai alat berhasil, pemakaian serta peleburan aktual. |
| Peneliti mengambil alat meskipun pekerja lain membutuhkan; material industri tidak masuk rancangan | Pembuat dan pengguna dibedakan. Logam/paduan menjadi material sesudah penemuan; alat aus dan harus diganti. |
| Resource khusus memberikan banyak bonus otomatis sekaligus dan racun menyakiti semua orang | Ekstraksi dan pemakaian terpisah; satu rute pengolahan sesuai kebutuhan. Fasilitas tetap berlaku, toksisitas diarahkan ke pelaku/pasien. |
| Mana, penyembuhan dan kemajuan bangunan pasif; proyek sihir bisa melampaui ambang tanpa selesai | Belajar, channel, heal dan enchantBuild merupakan tindakan dengan biaya; penyelesaian proyek memakai jalur yang sama dengan kerja biasa. |
| Kru ekspedisi hanya angka; koloni mendapat penduduk/rumah gratis; survei berulang | Kru berupa warga asli yang berhenti bekerja, mengonsumsi ransum, kembali atau menetap. Planet tersurvei dicatat. Koloni menerima kru/kargo dan membayar habitat. |
| Pendatang dibuat dari luar dunia dan emigran hilang | Perpindahan ke permukiman nyata membawa warga, pengalaman, alat serta bekal; jumlah penduduk dunia tetap. Ingatan asing mempunyai scope untuk mencegah salah sasaran dendam. |
| Perpecahan memilih reputasi rendah dan membuang ingatan kelompok | Keluhan pribadi, hubungan dan korban yang mempunyai keluhan bersama menentukan kelompok; pengalaman, alat dan ingatan dipertahankan, rumah memakai bahan yang dibawa. |
| Perang berupa pengurangan kesehatan pasif yang bisa tertutup pemulihan | Penjagaan menghabiskan kerja/pangan/energi dan memberi kekuatan pertahanan. Kedua pihak bertindak sebelum penyelesaian pertempuran; luka mengurangi produktivitas. |
| Kalender/pemrosesan berurutan memberi keuntungan peradaban pertama | Kalender disinkronkan; semua pekerjaan selesai dahulu, kemudian perjalanan/kontak/perang/perpindahan. Permukiman baru mulai bekerja hari berikutnya. |
| State Q dan tampilan skor tidak mengenal kebutuhan baru; stok melimpah tanpa tujuan | Kebutuhan masyarakat masuk state/skor Q dan UI. Produksi dasar dibatasi cadangan; surplus pangan dapat rusak. Panel alur menampilkan pekerjaan dan transaksi sebenarnya. |
| Klaim zaman di log berbeda dari penemuan di UI | Semua tampilan zaman mengikuti discovery selesai dari aturan bersama. |

## Verifikasi

- Pengujian operasi industri membuktikan bahan benar-benar berkurang dan produksi tidak muncul saat istirahat.
- Pengujian sihir membuktikan pengamatan saja tidak cukup: perlu aksi, mana dan pasien/proyek.
- Pengujian perjalanan membuktikan kru tidak mendapat giliran desa; survei membawa pulang warga dan sisa bekal, koloni memindahkan warga tanpa duplikasi, kematian kru tidak menyisakan status perjalanan yatim.
- Pengujian perpindahan memastikan barang/alat/Q/kemampuan dibawa; jumlah penduduk bukan bertambah atau hilang.
- Simulasi otonom seed 1 selama 4.500 hari mencapai antariksa dan koloni. Sensus akhir diuji dengan `penduduk awal 12 + kelahiran − kematian = seluruh warga hidup`, termasuk kru.
- Uji lintas seed dan perhitungan waktu offline tetap dijalankan bersama pengujian lama; UI memakai DOM minimal. Backend menggunakan Gemini tiruan untuk memeriksa autentikasi, keluaran dan kesalahan API.
- State baru menyalin baseline Q lama ketika pertama dipakai, tanpa menimpa tabel asal. Migrasi save lama mempertahankan stok/model, mengisi aksi baru dan membatalkan/refund perjalanan lama tanpa kru. Save dengan kalender tidak sinkron, kru fiktif atau biaya wahana palsu ditolak.

## Batas hasil audit

Ini masih model permainan: pembangunan kolektif memakai heuristik dan pilihan individu memakai Q-learning. Perkembangan teknologi memakai jalur yang telah didefinisikan. Alat mempunyai fisika relatif, bukan simulasi rekayasa; map belum menentukan jarak perjalanan warga. Gemini menambah objek/peristiwa berparameter, bukan aturan bebas. Dunia dapat gagal berkembang atau kehilangan sebuah permukiman karena kondisi populasi.

Verifikasi visual di browser dan panggilan Gemini dengan API key sungguhan belum dilakukan. Pembaruan tidak mengubah env Render dan tidak menyediakan sinkronisasi cloud.
