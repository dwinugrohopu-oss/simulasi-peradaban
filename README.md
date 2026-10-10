# Peradaban — dunia otonom dengan warga yang belajar

Prototype **0.8.0**. Dua planet dimulai dengan masing-masing 20 warga nyata: manusia dan alien. Setiap warga memiliki profil ideologi yang unik, atribut, sifat dan model belajar sendiri. Sumber sihir sudah ada sejak awal; warga perlu menemukan cara memakainya. Pemain mengamati dunia, memilih prioritas, atau memasukkan intervensi melalui prompt. Pembangunan berjalan otomatis sesuai kebutuhan.

Versi ini menghubungkan pekerjaan dengan persediaan, fasilitas, riset, konflik dan perjalanan. Temuan audit serta cakupan verifikasi ada di [AUDIT.md](AUDIT.md).

## Riset, perjalanan dan lapisan dunia (0.8)

Dunia baru berisi 40 warga nyata dengan 20 profil ideologi unik per planet. Profil memakai lima kecenderungan (kebersamaan, kebebasan, otoritas, teknologi, ekologi); kebiasaan kerja tetap menjadi dasar utama pemerintahan. Profesi bersifat generik dan mengikuti kegiatan serta penemuan: pekerja pengumpulan, operator lapangan, perajin, teknisi produksi, peneliti cabang, tenaga medis, petugas diplomasi dan personel militer.

Ada **40 penemuan dalam 10 cabang**, dengan prasyarat lintas cabang. Sihir memakai Sanggar arkanum; mekanik Laboratorium mekanik; biotik Kebun simbiosis; bioengineering Laboratorium hayati; mental Balai mental; lingkungan Stasiun ekologi; peperangan Arsenal; sosial Balai masyarakat; diplomatis Balai diplomasi; pemerintahan Balai pemerintahan. Biotik melatih tubuh/simbiosis, sedangkan bioengineering mengembangkan pengobatan, gen dan pertanian. Dampak tiap penemuan ditampilkan pada panel riset.

Setiap fasilitas menampung dua peneliti per hari. Maksimal enam proyek dapat aktif bersamaan. Bahan dibayar sekali saat proyek dimulai; tidak ada progres jika tidak dikerjakan. Kecepatan per peneliti dibagi `1 + 0,15 × (jumlah proyek aktif − 1)`, sehingga paralelisme membagi tenaga dan menambah biaya koordinasi. Proyek dapat berhenti sementara karena peneliti sedang makan, istirahat atau bepergian.

Sebanyak 108 deposit tersebar di tiga planet. Pangan liar dan hutan pulih perlahan dalam kapasitasnya; batu dan bijih tidak tumbuh kembali. Warga harus berangkat, mengambil stok, lalu pulang. Hasil baru masuk gudang setelah tiba; kepemilikan pribadi tetap mengikuti sifat/pemerintahan. Pengumpulan tidak bisa melebihi stok deposit. Peleburan kini membutuhkan bijih dan bahan bakar.

Kereta, kendaraan bermotor dan kendaraan biotik membutuhkan penemuan, fasilitas, bahan dan perakitan. Kendaraan dipakai satu perjalanan pada satu waktu, mempercepat jarak tempuh, meningkatkan muatan dan aus. Kendaraan bermotor membayar lima bahan bakar per keberangkatan. Bekal diambil saat berangkat dan sisanya dikembalikan setelah pulang. Senjata juga dibuat dengan bahan, dipakai satu penjaga per hari dan aus.

Kelangkaan mendorong eksplorasi. Deposit milik pemerintahan lain membutuhkan hubungan bersahabat untuk diakses dengan pembayaran pangan. Jika akses tertutup, kebutuhan resource dapat memperburuk hubungan dan memicu perang, setelah syarat populasi/logistik terpenuhi. Pasukan harus berjalan ke deposit; sepuluh hari keunggulan kumulatif di front memindahkan petak wilayah beserta depositnya. Gencatan senjata membuat pasukan pulang. Konflik tidak dijamin terjadi pada setiap seed.

Tombol **Batas**, **Bahasa**, **Deposit** tersedia langsung pada layar dunia. Batas mengikuti petak yang dimiliki peradaban/polity; label menampilkan jenis serta kekuatan pemerintahan. Lapisan bahasa menampilkan nama dan tahap bahasanya. Deposit yang sudah ditemukan dapat diketuk untuk melihat stok, sifat terbarukan dan pemilik. Posisi warga/perjalanan terlihat di peta.

Simpanan versi 1–6 dimigrasikan ke versi 7 tanpa mengulang populasi. Proyek lama mempertahankan persentase progres serta alokasi bahan; jalur baru memerlukan fasilitas untuk pekerjaan selanjutnya. Pengetahuan terdahulu tetap diakui dengan melengkapi prasyarat baru. Untuk mendapatkan awal 20 warga per planet, pilih Dunia baru setelah mengunduh cadangan bila diperlukan.

## Tampilan utama untuk HP

Dunia memenuhi layar. Kontrol jeda/kecepatan berada di atas, zoom/fokus di sisi peta, dan empat tombol di bawah: Menu, Jelajah, Intervensi, Catatan. Semua detail berada pada menu accordion yang tertutup saat pertama dibuka. Di HP menu muncul dari bawah; desktop menggunakan panel samping. Tombol tutup, area di luar panel, atau Escape mengembalikan peta. Kontrol sentuh mempunyai area tekan minimal 44 piksel.

Event penting, bangunan selesai, penemuan, sihir, kontak, perpecahan, perang, perjalanan dan koloni ditampilkan sebagai kartu di atas dunia. Ketuk kartu untuk melihat catatan peradaban terkait; tutup dengan × atau tunggu 10 detik. Antrean dibatasi 12 notifikasi terbaru, ditampilkan satu per satu. Log aktivitas rutin tidak memunculkan popup. Riwayat saat membuka/mengimpor simpanan tidak diputar ulang, dan event yang terjadi ketika menu terbuka menunggu tampilan dunia.

## Siklus simulasi

**Kebutuhan → pilihan pekerjaan → penggunaan bahan → hasil → kebutuhan berikutnya.** Semua peradaban memakai kalender yang sama. Setiap warga yang hidup dan berada di desa mendapat satu tindakan per hari; kru ekspedisi tidak bekerja di desa. Proyek baru, riset dan wahana membayar bahan sekali. Tidak ada panen, peleburan, listrik atau mana otomatis dari warga yang beristirahat.

| Sistem | Hubungannya dengan sistem lain |
|---|---|
| Pangan | Foraging, memancing dan petani menghasilkan pangan; ladang membutuhkan petani, maksimal tiga pekerja per ladang sehari. Pertanian meningkatkan hasil. Pangan untuk makan, kelahiran, penjagaan dan bekal ekspedisi. Surplus di atas kapasitas penyimpanan berangsur rusak. |
| Rumah dan kesehatan | Rumah menyediakan tiga tempat; habitat menyediakan empat. Tempat kru tetap dihitung agar tidak terisi kelahiran saat mereka pergi. Sumur membantu pemulihan; kesehatan rendah mengurangi efisiensi pekerjaan. |
| Alat | Warga merancang dan menguji prototipe dengan bahan nyata. Dua alat berhasil membuka bukti metalurgi; pemakaian alat dan peleburan membuka bukti mesin. Alat diberikan kepada pekerja yang membutuhkan, aus dan dapat rusak. Logam serta paduan menjadi pilihan material setelah ditemukan. |
| Industri | Tungku + metalurgi: kayu → bahan bakar; batu + bahan bakar → logam. Bengkel + mesin: logam + bahan bakar → paduan. Pembangkit + listrik: bahan bakar → energi. Setiap tahap perlu operator. |
| Penelitian | Pengetahuan, keahlian, penemuan terdahulu, bukti praktik dan bahan harus cukup. Peneliti memenuhi pekerjaan riset bertahap; bahan dibayar saat riset dimulai. Setiap cabang membutuhkan fasilitasnya sendiri. Balai belajar mempercepat penelitian dan memungkinkan mengajar generasi berikutnya. |
| Sihir | Warga berbakat dengan kepekaan ≥75, penelitian ≥20 dan pengetahuan desa ≥40 mempelajari sumber dekat desa sampai proyek Dasar arkanum di Sanggar arkanum selesai. Riset sihir juga memakai biaya bahan dan tenaga kerja. Setelah ditemukan, warga mengumpulkan mana, menyembuhkan seorang pasien atau membantu proyek dengan tindakan terpisah. Warga lain bisa berlatih lewat sumber/mentor. |
| Masyarakat | Sifat, persediaan pribadi, reputasi, hubungan dan ingatan memengaruhi berbagi, pencurian, manipulasi, intimidasi, dendam dan kerja sama. Kelompok yang mempunyai keluhan bersama dapat memisahkan diri sambil membawa bekal, pengalaman, alat dan ingatan. |
| Perang | Hubungan buruk, kedekatan wilayah, warga dan logistik memungkinkan perang. Penjaga memakai hari kerja, pangan dan energi; pertempuran melukai warga serta memengaruhi produktivitas dan suasana. Kedua pihak menyelesaikan giliran sebelum pertempuran. |
| Perpindahan | Pendatang berasal dari peradaban lain yang benar-benar ada. Warga, bekal, alat dan kemampuan berpindah; mereka tidak dibuat atau dihapus begitu saja. Tidak ada tujuan yang cocok berarti warga tetap tinggal. |
| Antariksa | Observasi radio memakai energi dan observatorium. Wahana membutuhkan bahan, galangan, perakitan dan kru nyata. Survei menempuh 40 hari pergi dan 40 hari pulang, memakai ransum serta mencatat planet yang dikunjungi. Koloni memindahkan kru dan kargo; habitat dibangun dengan bahan kargo. |

Kelahiran diperiksa tiap tahun jika ada dua orang dewasa usia 18–45, tempat, pangan dan keharmonisan cukup. Anak mempunyai kegiatan ringan sampai usia 16. Kematian terjadi akibat kesehatan atau peluang usia lanjut. Koloni memilih calon orang tua dan menyisakan calon orang tua di desa asal. Tidak semua permukiman akan bertahan; perkembangan dipengaruhi sifat, pekerjaan, konflik dan kondisi generasi berikutnya.

## Self-learning dan sifat

Setiap warga memiliki dua dari 12 sifat: rajin, penasaran, supel, hemat, pemberani, hati-hati, egois, serakah, pendendam, agresif, kejam dan manipulatif. Sifat memberi kecenderungan pekerjaan dan dapat mengubah efisiensi, penggunaan energi atau eksplorasi. Setiap tindakan meningkatkan keahlian terkait. Tingkatan: Pemula, Terlatih (20), Terampil (60), Ahli (150).

Model keputusan adalah **tabular Q-learning lokal**, dibantu aturan kebutuhan dan pengaman bertahan hidup. State mencakup lapar, energi rendah, pangan langka, proyek, keharmonisan, kebutuhan masyarakat saat ini dan prioritas pemain. Pilihan menggunakan Q + kecenderungan sifat + urgensi kebutuhan; eksplorasi tetap memungkinkan tindakan lain. Warga tidak merupakan agen LLM.

```text
Q(s,a) ← Q(s,a) + α [reward + 0.75 × max Q(s',a') − Q(s,a)]
α = 0.16; dengan balai belajar 0.22
```

Aturan kolektif memilih kebutuhan/proyek; Q-learning mempelajari keputusan individu. Ini bukan klaim bahwa warga menemukan aturan fisika atau teknologi baru tanpa batas.

## Perkembangan zaman

Jalur inti mekanik/antariksa (ditambah cabang pendukung hayati dan lingkungan): pertanian → metalurgi → mesin → astronomi → listrik → elektronika → roket → penunjang kehidupan → penerbangan antariksa → habitat planet. Syarat rinci dan pekerjaan riset ditampilkan pada panel penemuan. Zaman mengikuti penemuan yang benar-benar selesai, bukan angka pengetahuan saja.

Panel **Kebutuhan → pekerjaan → hasil** menunjukkan sasaran desa, pekerjaan hari terakhir, bahan masuk/keluar, penerima manfaat serta alokasi proyek. Pilih permukiman untuk melihat ekonomi dan penduduknya. Geser peta, gunakan roda mouse, dua jari atau ± untuk zoom. Tampilan tata surya memperlihatkan planet dan perjalanan. Pengamat dapat melihat alien sejak awal; peradaban harus mencapai kontak sendiri.

## Warga, pemerintahan, wilayah dan bahasa

Setiap warga memiliki kekuatan, kecerdasan, daya tahan, karisma, empati dan disiplin (0–100). Atribut memengaruhi pekerjaan terkait dan bertambah lewat latihan; anak mewarisi variasi atribut calon orang tua. Pertumbuhan memakai warga nyata, bukan angka populasi perwakilan. Kelahiran tahunan dapat melibatkan beberapa pasangan jika tempat dan pangan cukup.

Pemerintahan muncul dari kebiasaan berbagi, menimbun, merawat, memaksa, keberagaman pekerjaan dan koordinasi yang bertahan 90 hari. Bentuknya dewan, komunis, sosialis, liberal, kapitalis, hive mind atau otokrasi. Hive mind memerlukan penemuan rekayasa rune atau jejaring pikiran. Legitimasi, kohesi, administrasi, ekonomi, militer, stabilitas dan kekuatan dihitung dari kondisi warga/fasilitas; ideologi sendiri tidak otomatis membuat negara kuat. Sistem distribusi memengaruhi bagian hasil yang disimpan pribadi, stabilitas memengaruhi kerja sama, dan militer memengaruhi pertempuran. Ini model permainan sederhana, bukan prediksi politik dunia nyata.

Permukiman menjadi **Kota pada 30 warga** dan **Kota besar pada 100**. Permukiman yang makmur dapat mendirikan kota baru dengan memindahkan delapan warga nyata beserta kargo. Wilayah dalam satu pemerintahan menjadi **Negara pada 250 warga dan dua permukiman hidup**. Pada 500 warga dan tiga permukiman, otokrasi menjadi Empire, liberal menjadi Federasi, hive mind menjadi Kolektif, dan bentuk lain menjadi Union. Kontak bersahabat yang saling memahami dapat menyatukan pemerintahan. Perpecahan membentuk pemerintahan terpisah.

Bahasa berasal dari keluarga bahasa planet asal: isyarat → lisan sederhana → tulis → matang. Kemajuan memerlukan aktivitas sosial, mengajar, diplomasi, riset atau penerjemahan; tulisan memerlukan sekolah dan keahlian. Koloni mewarisi bahasa asal, penduduk asli planet berbeda mempunyai kosakata berbeda. Delapan konsep dan pola pesan dibentuk secara prosedural; ini belum mesin tata bahasa lengkap. Diplomasi dan penerjemahan menggunakan hari kerja serta bahan dan meningkatkan pemahaman. Pesan dengan pemahaman rendah dapat menurunkan hubungan; perang tetap membutuhkan permusuhan, kedekatan dan logistik.

Panel **Pemerintahan, wilayah & bahasa** menampilkan kondisi tersebut. Statistik individu berada di kartu warga. Peta menggambar satu simbol untuk setiap bangunan, termasuk ladang, sumur dan sekolah, dengan jumlah per jenis. Alat lama tetap terlihat sebagai arsip: alat yang sedang dipakai ditandai. Setelah metalurgi/mesin/listrik, alat sehat yang tertinggal juga diganti melalui prototipe berbayar. Penggerak listrik memakai energi setiap penggunaan; tanpa energi alat bekerja secara manual.

## Intervensi dunia dan Gemini

Prompt → pratinjau → **Masukkan ke dunia**. Satu prompt menghasilkan satu deskripsi yang divalidasi. Tidak ada kode hasil LLM yang dieksekusi. Pratinjau tetap terikat kepada peradaban asal meskipun pemain beralih tampilan.

Objek didukung: sungai, hutan, tambang, reruntuhan, hadiah bangunan, sumber sihir, sumber daya bernama bebas, dan peristiwa dengan pemicu. Peristiwa dapat memengaruhi pangan, kesehatan, keharmonisan, penelitian, energi atau mana; perang/pemberontakan/kontak memengaruhi kondisi pemicu sistem tersebut. Hadiah bangunan dan efek peristiwa merupakan intervensi pemain yang eksplisit, berbeda dari produksi kerja biasa.

Sumber daya baru mempunyai stok dan sifat seperti kekerasan, kekuatan, energi, penelitian, penyembuhan, sihir serta toksisitas. Warga **mengumpulkan lalu memprosesnya menjadi satu hasil yang sedang diperlukan**. Logam/listrik/sihir tetap membutuhkan fasilitas dan pengetahuan terkait. Racun memengaruhi pengumpul atau pengguna/pasien, bukan otomatis seluruh desa. Resource tidak memberikan semua bonus sekaligus.

Mode lokal memakai kata kunci tanpa API. Mode Gemini memanggil `generateContent` dengan keluaran terstruktur melalui server. LLM menerjemahkan prompt menjadi parameter mekanik yang tersedia; permintaan aturan baru tetap memerlukan perubahan kode.

## Menjalankan

Node.js 20+, tanpa dependency npm:

```bash
npm start
npm test
npm run build
```

Buka `http://localhost:8000`. Tanpa env, prompt memakai mode lokal. Build menyediakan frontend di `dist/` untuk hosting statis; mode Gemini membutuhkan Web Service. Jangan membuka modul langsung melalui `file://`.

Untuk Gemini, salin `.env.example` ke `.env` dan isi sendiri. Jangan commit kunci. Server tidak membaca `.env` secara otomatis; injeksikan env atau gunakan Node yang mendukung `node --env-file=.env server.js`.

| Env | Fungsi |
|---|---|
| `GEMINI_API_KEY` | Kunci di server, bukan di panel game |
| `WORLD_TOKEN` | Kode akses pemilik yang dimasukkan pada panel prompt; wajib bila API aktif |
| `GEMINI_MODEL` | Opsional; default kode saat ini `gemini-3.5-flash-lite` |
| `MAX_PROMPTS_PER_HOUR` | Opsional; default 20, rentang 1–100 |
| `PORT` | Default 8000; disediakan hosting |

Render: gunakan Web Service Node dari branch `main`, Root Directory kosong, Build Command `npm install`, Start Command `npm start`. Versi 0.8 tidak menambah env. Deploy commit terbaru bila deployment belum mengikuti main. Jika berpindah URL/domain, ekspor simpanan dahulu lalu impor pada URL baru.

## Simpanan dan batas model

Autosave browser tiap lima detik; ekspor/impor JSON untuk cadangan dan pindah perangkat. Semua dunia, warga, kemampuan, Q, bahan dan perjalanan ikut disimpan. Tidak ada sinkronisasi cloud atau penyimpanan progres pemain di server.

Save versi 1–6 dimigrasikan ke versi 7, mempertahankan progres dan bobot Q. Tindakan baru dimulai dari nol. Ekspedisi versi 1–4 yang tidak mempunyai kru nyata dibatalkan dengan pengembalian bahan peluncuran dan catatan penjelasan. Penerbangan versi 5 beserta kru dan kargo tetap dipertahankan. Ekspor cadangan sebelum pembaruan tetap disarankan.

Satu hari = empat detik; 60 hari = satu tahun. Saat kembali, maksimal delapan jam dihitung pada kecepatan normal. Tab tertutup tidak menjalankan server simulasi; dunia dijeda tidak maju. Simpanan rusak tidak ditimpa otomatis. Dunia dengan ribuan warga dapat memerlukan beberapa menit untuk menghitung delapan jam offline; perhitungan ini masih berjalan pada thread utama browser.

Batas: tiga planet, delapan peradaban, 256 warga hidup per peradaban termasuk kru, 128 fasilitas per jenis, 16 resource khusus per peradaban, 24 sumber sihir dan 24 event dunia. Maksimal 2.048 rekaman alat per peradaban. Arsip warga/alat dipangkas agar simpanan tidak tumbuh tanpa batas. Fisika alat memakai besaran relatif sederhana. Jarak perjalanan memakai garis lurus, belum memakai pathfinding atau orbit fisik. Perang deposit menghitung pasukan yang sudah tiba di front, dengan model kendali wilayah sederhana.

Pengujian meliputi keputusan/keahlian, ekonomi dan bukti praktik, sihir, perang, demografi, perpindahan nyata, kru/koloni, migrasi, UI, backend serta kontrak Gemini dengan respons tiruan. Gemini dengan kunci sungguhan dan penampilan visual browser belum diuji di lingkungan ini.
