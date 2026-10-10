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

## Pembaruan 0.7 — alat, demografi dan budaya

Alat lama sebelumnya disalin sebagai resep dan hanya diganti saat aus. Sekarang bahan, sambungan dan penggerak mengikuti penemuan; bahan/energi harus diperoleh dan dibayar. Alat terpakai dibedakan dari arsip. Peta menggambar setiap fasilitas, termasuk ladang.

Atribut individu memengaruhi hasil kerja. Pemerintahan mengikuti kebiasaan yang berkelanjutan, wilayah menghitung warga nyata, dan keluarga bahasa berasal dari planet asal serta berkembang melalui aktivitas. Penerjemahan/diplomasi memperbaiki pemahaman; salah paham memengaruhi hubungan dan memakai syarat perang yang sama.

Simulasi seed 1 selama 4.500 hari lolos validasi: 291 warga hidup = 12 warga awal + 291 kelahiran − 12 kematian; delapan permukiman, wilayah Negara, dan alat aktif di desa awal memakai paduan serta penggerak listrik. Ini contoh jalur satu seed, bukan jaminan semua masyarakat bertahan atau mencapai zaman yang sama. Pengujian visual browser/HP dan Gemini dengan kunci sungguhan belum dilakukan.

Optimasi pencarian alat dan penemuan mempertahankan hasil serta Q yang persis sama pada perbandingan seed 1 dan 42 selama 1.500 hari. Uji offline seed 44 selama 7.200 hari menghasilkan 1.175 warga dan lolos validasi; menghitung seluruh waktu offline masih berat untuk dunia besar. Batas/fraction waktu diuji langsung pada penjadwal, sedangkan simulasi demografi lintas seed tetap diuji terpisah.

Cakupan regresi demografi: seed 1 selama 7.200 hari dan enam seed lain selama 2.500 hari; uji terpisah seed 44 juga mencapai 7.200 hari. Cakupan tahun penuh tetap dipisahkan dari unit penjadwalan waktu offline agar perubahan ukuran penduduk tidak membuat tes batas waktu menjalankan dua simulasi besar yang identik.

Verifikasi akhir: 83 tes lulus tanpa kegagalan atau skip; build frontend berhasil. UI memakai pengujian DOM tiruan, bukan verifikasi visual browser/HP.


## Pembaruan 0.8 — riset bercabang dan geografi resource

Riset kini memiliki 40 penemuan/10 cabang, fasilitas per cabang, biaya bahan, dua peneliti per fasilitas/hari, maksimal enam proyek aktif dan penalti koordinasi paralel. Kajian dasar juga memakai kapasitas fasilitas. Perubahan umur, kecenderungan ideologi dan pekerjaan tidak membentuk pekerja/perwakilan baru. Awal dunia baru berisi 20 warga nyata per planet, masing-masing dengan profil unik; fixture kecil pengujian lama tetap memakai enam warga agar skenario regresi tidak bergantung pada sensus awal.

Geografi berisi 108 deposit dan 480 petak wilayah. Pengumpulan harus berangkat, mengambil stok dan pulang; senjata/kendaraan membutuhkan bahan serta pekerjaan. Riset memiliki manfaat yang ditampilkan di UI dan diterapkan dalam produksi, pertanian, perawatan, sihir, riset, diplomasi atau pemerintahan. Bijih menggantikan batu sebagai masukan peleburan.

Pengujian baru memeriksa konservasi stok/muatan termasuk penimbunan pribadi; regenerasi terbatas; pemakaian kendaraan satu per perjalanan; fasilitas, biaya sekali dan tenaga riset; perbedaan biaya koordinasi; eksplorasi sebelum penemuan resource; perang deposit sebelum/sesudah kedatangan pasukan; penangkapan petak wilayah; efek riset; migrasi simpanan/progres; penolakan data rusak; tombol lapisan peta tanpa membuka drawer; endpoint modul baru. Save v6 dari implementasi terdahulu juga dibaca dan divalidasi kembali.

Jarak masih garis lurus, bukan pathfinding medan. Perang selain sengketa deposit tetap memakai model pertahanan permukiman sebelumnya. Model penelitian/jalur penemuan dan skala pemerintahan adalah aturan permainan. UI diuji dengan DOM/canvas tiruan; verifikasi visual pada perangkat HP dan panggilan Gemini dengan API key nyata belum dilakukan. Perhitungan offline dunia besar masih dapat memerlukan waktu lama.

Verifikasi 0.8: seluruh 99 tes lulus pada pengujian regresi dan pengulangan tes yang disesuaikan; build frontend berhasil. Uji lintas seed mencakup satu dunia 7.200 hari dan enam dunia 2.500 hari. Skenario demografi tambahan memakai 3.000 hari; imigrasi/emigrasi dibandingkan antarseluruh permukiman dan sensus cocok dengan kelahiran/kematian. Dunia baru seed 42 dengan 40 warga dijalankan 1.500 hari: 123 warga hidup, empat permukiman dan 39/35/32/28 penemuan; seluruh save lolos validasi. Angka ini contoh seed, bukan jaminan perkembangan semua dunia.

## Pembaruan 0.9 — gudang nyata, awal tanpa bangunan, rumah dan equipment

Panel gudang kini mengikuti bangunan nyata yang dibayar serta dikerjakan warga. Persediaan tetap memakai satu balance; bagian terlindungi dibatasi kapasitas gudang, sisanya merupakan tumpukan di tanah. Kehilangan stok dan kerusakan equipment dihitung setiap hari, tanpa menambah stok pengganti. Barang yang sudah dibayar untuk proyek dan kargo perjalanan tidak dihitung ulang sebagai stok gudang.

Awal dunia baru: 20 warga per planet, 10 porsi bekal per permukiman, nol bahan bangunan dan nol bangunan. Pengumpulan dengan bekal terbatas dimungkinkan agar warga tidak terkunci sebelum bisa mencari makanan. Penempatan rumah memakai tempat tidur nyata; kru tetap mempunyai reservasi. Tanpa tempat tinggal, pemulihan tidur lebih rendah, mood lebih buruk dan risiko sakit lebih tinggi.

Alat kerja tetap memakai ketahanan rancangan dan sekarang mempunyai keausan sesuai beban pekerjaan. Slot senjata memiliki kepemilikan tunggal, kendaraan perjalanan terlihat pada warga; stok peralatan dibedakan antara gudang, tanah dan dibawa. Equipment yang rusak mengosongkan slot, perjalanan dengan kendaraan yang rusak beralih berjalan, serta arsip senjata/kendaraan rusak dipangkas pada batas simpanan. Warga yang pindah membawa equipment dan kehilangan reservasi rumah asal. Arsip warga yang meninggal melepaskan senjata dan mengembalikan bekal sebelum dipangkas; slot senjata tidak tercampur dengan ID alat kerja.

Verifikasi migrasi juga memakai simpanan asli dari commit v0.8, bukan hanya fixture: stok, alat, rumah dan Q dipertahankan, gudang tidak ditambahkan. Pengujian mekanik lama menggunakan fixture dengan rumah dan gudang agar skenario tetap mengisolasi mekaniknya; awal dunia tanpa bangunan diuji terpisah dengan beberapa seed. Verifikasi visual browser/HP belum dapat dilakukan di lingkungan ini.

Validasi terakhir: simulasi offline 7.200 hari dan enam seed lain selama 2.500 hari lolos validasi simpanan. Seluruh 113 skenario lolos setelah fixture uji upgrade alat diberi kapasitas gudang yang cukup untuk mengisolasi kebutuhan bahan alat. Build statis juga berhasil.
