# Peradaban — dunia otonom dengan warga yang belajar

Prototype **0.12.0**. Bumi Aruna dimulai dengan empat desa manusia berisi lima warga per desa; Aster tetap satu desa berisi 20 warga alien. Setiap warga memiliki profil ideologi yang unik, atribut, sifat dan model belajar sendiri. Sumber sihir sudah ada sejak awal; warga perlu menemukan cara memakainya. Pemain mengamati dunia, memilih prioritas, atau memasukkan intervensi melalui prompt. Pembangunan berjalan otomatis sesuai kebutuhan.

Versi ini menghubungkan pekerjaan dengan persediaan, fasilitas, riset, konflik dan perjalanan. Temuan audit serta cakupan verifikasi ada di [AUDIT.md](AUDIT.md).

## Wilayah berbahaya dan perburuan

Dunia baru menempatkan empat desa manusia pada jarak 1.500–2.122 satuan: **15–22 hari berjalan kaki** dengan kecepatan dasar 100/hari, dalam rentang permintaan 15–25 hari. Setiap desa pendiri memiliki keluarga bahasa sendiri. Koloni dan pemekaran tetap mewarisi bahasa induknya. Simpanan lama mempertahankan posisi desa, bahasa, deposit dan perjalanan; wilayah berbahaya tidak ditambahkan saat migrasi.

Setiap planet memiliki dua wilayah teritorial: **Hutan Lebat** dan **Pegunungan Logam**, masing-masing radius 250. Deposit di dalamnya berisi 1.000–3.000 pangan liar, kayu atau bijih. Bijih tetap tidak terbarukan. Deposit biasa tetap kecil dan tersebar; sedikit bijih di wilayah aman memungkinkan persiapan peralatan sebelum mendatangi deposit besar. Area ditampilkan setelah teramati; ketuk deposit untuk membaca jenis, jumlah dan statistik hewan buasnya.

Tiap wilayah menampung enam satwa: dua rusa yang merumput dekat permukiman, dua serigala, satu babi hutan dan satu beruang dengan statistik berbeda. Rusa dapat diburu menggunakan senjata batu tanpa pelindung dan tidak menyerang pelintas. Hewan tidak menyerbu desa. Pelintas wilayahnya dapat diserang, termasuk pada perjalanan pulang; penilaian jalur menggunakan segmen perjalanan sehingga kendaraan cepat tidak melewati bahaya dengan teleportasi. Populasi yang masih memiliki minimal dua hewan mendapat satu satwa pengganti setiap 120 hari sampai enam per wilayah; rusa mengisi kembali padang rumput yang kosong pada dunia baru. Hewan mati tidak hidup kembali.

**Serangan, pertahanan dan kecepatan warga** dihitung dari kekuatan, ketahanan, disiplin, kesehatan, energi, latihan bertahan/berburu/menghindar, serta kondisi senjata dan pelindung. Kecepatan menentukan siapa menyerang dahulu saat menghadapi hewan buas dan peluang warga kabur. Rusa hanya membalas setelah pemburu menyerang. Serangan dibandingkan dengan pertahanan lawan; pertarungan dapat berlangsung beberapa hari dan menyebabkan luka parah atau kematian. Senjata dan pelindung aus saat digunakan. Pemburu dapat melawan atau kabur; hewan yang kalah menghasilkan muatan pangan dan tulang yang masuk stok setelah pulang, dibatasi kapasitas angkut.

Satwa memiliki tingkat kesulitan: rusa (1), serigala dan babi hutan (2), serta beruang (3). Setiap serangan menggunakan senjata melatih kemampuan berburu dan mengurangi ketahanan senjata; berangkat saja tidak menambah latihan. Hasil dan luka perjalanan masuk pembelajaran keputusan warga. Save lama mempertahankan jenis satwanya.

Senjata batu sederhana dapat dibuat di gudang dari kayu dan batu; senjata lanjut tetap membutuhkan arsenal dan penemuan. Pelindung serat/tulang dibuat dari 12 serat, 3 tulang dan 4 kayu; pelindung logam dan paduan membutuhkan penemuan serta bahan industrinya. Setiap warga memiliki satu slot pelindung; statistik dan latihan tampil pada Detail penduduk. Pelindung mengikuti aturan gudang, tanah, kerusakan dan perpindahan pemilik.

Warga mempersiapkan perlengkapan dan memperkirakan risiko sebelum sengaja berburu. Mereka menghindari jalur **yang sudah diketahui** berbahaya jika belum siap; wilayah yang belum diketahui tetap berisiko saat dijelajahi. Keputusan melawan/kabur memiliki konteks Q tersendiri, dan luka/hasil buruan tetap memperbarui keputusan perjalanan awal.

Penilaian pemerintahan tidak lagi menyamakan kemiskinan dengan kebersamaan: kebiasaan komunal terutama berasal dari ideologi warga dan tindakan berbagi. Skor komunis lebih bergantung pada kebiasaan tersebut; liberal mempertimbangkan kebebasan, autokrasi mempertimbangkan otoritas, dan hive mind memerlukan kecenderungan komunal selain koordinasi serta penemuannya. Perubahan memerlukan 90 hari kandidat yang jelas, sehingga desa dapat tetap berupa dewan warga ketika bukti belum kuat. Cadangan pangan juga memperhitungkan kebutuhan kelahiran jika ada tempat tidur dan calon orang tua, supaya penambahan pekerjaan tidak menghentikan regenerasi penduduk.

## Riset, perjalanan dan lapisan dunia (0.8)

Dunia baru berisi 40 warga nyata dengan 20 profil ideologi unik per planet. Profil memakai lima kecenderungan (kebersamaan, kebebasan, otoritas, teknologi, ekologi); kebiasaan kerja tetap menjadi dasar utama pemerintahan. Profesi bersifat generik dan mengikuti kegiatan serta penemuan: pekerja pengumpulan, operator lapangan, perajin, teknisi produksi, peneliti cabang, tenaga medis, petugas diplomasi dan personel militer.

Ada **40 penemuan dalam 10 cabang**, dengan prasyarat lintas cabang. Sihir memakai Sanggar arkanum; mekanik Laboratorium mekanik; biotik Kebun simbiosis; bioengineering Laboratorium hayati; mental Balai mental; lingkungan Stasiun ekologi; peperangan Arsenal; sosial Balai masyarakat; diplomatis Balai diplomasi; pemerintahan Balai pemerintahan. Biotik melatih tubuh/simbiosis, sedangkan bioengineering mengembangkan pengobatan, gen dan pertanian. Dampak tiap penemuan ditampilkan pada panel riset.

Setiap fasilitas menampung dua peneliti per hari. Maksimal enam proyek dapat aktif bersamaan. Bahan dibayar sekali saat proyek dimulai; tidak ada progres jika tidak dikerjakan. Kecepatan per peneliti dibagi `1 + 0,15 × (jumlah proyek aktif − 1)`, sehingga paralelisme membagi tenaga dan menambah biaya koordinasi. Proyek dapat berhenti sementara karena peneliti sedang makan, istirahat atau bepergian.

Dunia baru memiliki 56 deposit: 20 di Bumi Aruna dan 18 per planet lainnya. Deposit biasa berisi 100–300 unit, sedangkan deposit di wilayah berbahaya berisi 1.000–3.000 unit. Sumber pangan dan kayu dasar berada dekat desa, sedangkan sebagian batu serta bijih perlu dicari lebih jauh. Pangan liar dan hutan pulih perlahan dalam kapasitasnya; batu dan bijih tidak tumbuh kembali. Warga harus berangkat, mengambil stok, lalu pulang. Hasil baru masuk persediaan setelah tiba; kepemilikan pribadi tetap mengikuti sifat/pemerintahan. Pengumpulan tidak bisa melebihi stok deposit. Peleburan kini membutuhkan bijih dan bahan bakar.

Kereta, kendaraan bermotor dan kendaraan biotik membutuhkan penemuan, fasilitas, bahan dan perakitan. Kendaraan dipakai satu perjalanan pada satu waktu, mempercepat jarak tempuh, meningkatkan muatan dan aus. Kendaraan bermotor membayar lima bahan bakar per keberangkatan. Bekal diambil saat berangkat dan sisanya dikembalikan setelah pulang. Senjata juga dibuat dengan bahan, dipakai satu penjaga per hari dan aus.

Kelangkaan mendorong eksplorasi. Deposit milik pemerintahan lain membutuhkan hubungan bersahabat untuk diakses dengan pembayaran pangan. Jika akses tertutup, kebutuhan resource dapat memperburuk hubungan dan memicu perang, setelah syarat populasi/logistik terpenuhi. Pasukan harus berjalan ke deposit; sepuluh hari keunggulan kumulatif di front memindahkan petak wilayah beserta depositnya. Gencatan senjata membuat pasukan pulang. Konflik tidak dijamin terjadi pada setiap seed.

Tombol **Batas**, **Bahasa**, **Deposit** tersedia langsung pada layar dunia. Batas mengikuti petak yang dimiliki peradaban/polity; label menampilkan jenis serta kekuatan pemerintahan. Lapisan bahasa menampilkan nama dan tahap bahasanya. Deposit yang sudah ditemukan dapat diketuk untuk melihat stok, sifat terbarukan dan pemilik. Posisi warga/perjalanan terlihat di peta.

Simpanan versi 1–9 dimigrasikan ke versi 10 tanpa mengulang populasi. Proyek lama mempertahankan persentase progres serta alokasi bahan; jalur baru memerlukan fasilitas untuk pekerjaan selanjutnya. Pengetahuan terdahulu tetap diakui dengan melengkapi prasyarat baru. Untuk mendapatkan empat desa manusia dan sebaran deposit yang baru, pilih Dunia baru setelah mengunduh cadangan bila diperlukan. Simpanan lama mempertahankan desa dan depositnya.

## Empat desa dan tabel penduduk (0.10)

Lembah Asal, Lembah Timur, Lembah Seberang dan Lembah Selatan merupakan empat permukiman mandiri di Bumi Aruna. Dua puluh pendiri dibagi tanpa menggandakan orang, bekal atau ideologi. Masing-masing desa menyimpan stok, kebutuhan bangunan, bahasa dan pemerintahan sendiri. Kaum Aster tetap berisi 20 warga. Lima desa awal ikut bergiliran dalam simulasi dunia.

Daftar penduduk memakai tabel **Nama, Sedang apa, Pekerjaan, Umur, Info**. Tombol **Detail** membuka kondisi kesehatan, energi, mood, rumah, sakit, sifat, kemampuan dan slot equipment warga yang dipilih. Detail ditutup saat memilih desa lain; pembelajaran individu tetap dapat dibuka dari detail.

Desa dan deposit yang sudah ada pada simpanan lama dipertahankan. Pengurangan deposit, stok awal dan pembagian desa hanya diterapkan pada dunia baru; versi format simpanan kini 10.

## Awal tanpa bangunan, rumah dan gudang (0.9)

Empat desa manusia dimulai dengan lima warga dan **2,5 porsi pangan per desa**, total 10 porsi. Kaum Aster tetap 20 warga dengan 10 porsi pangan: setengah porsi per warga, tanpa kayu, batu, alat, rumah, ladang maupun gudang. Warga mengumpulkan bahan dan membangun sendiri. Tanpa bekal cukup, perjalanan pengumpulan tetap boleh dimulai dengan bekal yang tersedia; perjalanan pasukan tetap membutuhkan logistik penuh. Stok tidak pernah dibuat gratis untuk menolong warga.

Rumah menampung tiga warga, habitat empat; tidak ada tiga tempat tinggal gratis. Setiap warga mendapatkan rumah dan tempat tidur tertentu saat tersedia. Tempat kru tetap dipesan selama mereka pergi. Warga tanpa rumah atau sedang bepergian tidur di luar: istirahat memulihkan 18 energi dibanding 27 di rumah; suasana hati menurun lebih cepat, pemulihan kesehatan lebih rendah dan peluang sakit lebih tinggi. Warga yang kesal lebih mudah berselisih. Kondisi rumah, sakit dan suasana hati terlihat di kartu warga.

**Gudang** membutuhkan 30 kayu, 5 batu dan 30 kerja. Sebelum selesai, seluruh bahan tetap menjadi tumpukan di tanah. Gudang melindungi per jenis: 300 pangan, 500 kayu, 500 batu, 300 bijih, 150 serat, 100 tulang, 250 logam, 250 bahan bakar, 200 paduan serta 150 per resource khusus. Kelebihan tetap di tanah dan tetap bisa digunakan. Pangan di tanah rusak 4% per hari, dalam gudang 0,2%; bahan lain memiliki laju kerusakan/kehilangan yang lebih rendah. Penemuan ekologi tertutup memperlambat pembusukan. Energi dan mana tetap memakai penyimpanan abstrak sistem industrinya. Bekal pribadi juga dapat membusuk; stok deposit tidak terpengaruh aturan penyimpanan.

Satu gudang melindungi 40 peralatan, termasuk prototipe. Alat idle dikembalikan ke gudang tanpa menghapus kepemilikan atau slot warga. Saat dipakai atau bepergian alat dibawa warga. Peralatan di tanah lebih cepat rusak daripada barang dalam gudang; barang yang dibawa juga terpapar. Bahan dan rancangan menentukan ketahanan alat. Beban penggalian mengauskan alat lebih cepat daripada pertanian; senjata batu/logam/balistik dan kendaraan mempunyai daya tahan berbeda. Penggunaan senjata dan jarak perjalanan kendaraan mengurangi kondisi. Peralatan rusak tidak dapat dipakai; slotnya dibersihkan. Kendaraan yang rusak di perjalanan membuat warga melanjutkan dengan berjalan, tanpa menggandakan atau membuang muatan yang sudah diambil.

Kartu warga menampilkan slot penebangan, penggalian, pertanian, senjata dan kendaraan perjalanan: nama, kondisi, daya tahan, pemakaian serta lokasi **Di gudang / Di tanah / Dibawa / Digunakan**. Satu senjata hanya boleh terpasang pada satu warga. Equipment ikut pindah saat warga bermigrasi, memisahkan diri atau mendirikan koloni; ID disesuaikan jika masuk permukiman lain.

Panel **Gudang & peralatan** menyatukan bahan dengan tabel per jenis, menampilkan jumlah di gudang, di tanah dan dibawa; prototipe serta arsip/rusak juga dicatat. Pilihan **Gudang / tanah / Per pemerintah / Sembunyikan stok** berada langsung di layar dunia. Kartu peta dapat diketuk untuk rincian; mode pemerintah menjumlahkan semua permukiman dengan `polityId` yang sama, termasuk planet lain, tanpa menghitung muatan perjalanan, bahan proyek atau milik pribadi. Angka besar di peta disingkat; panel memberi angka penuh. Kartu yang tidak muat tanpa bertumpuk disembunyikan dengan prioritas pada permukiman terpilih. Layar terlalu pendek tetap dapat memakai panel gudang.

Save versi 1–9 dimigrasikan ke versi 10. Rumah, persediaan, alat, proyek dan Q lama dipertahankan; gudang tidak dihadiahkan saat migrasi. Aturan mulai tanpa bangunan hanya berlaku pada **Dunia baru**.

## Tampilan utama untuk HP

Dunia memenuhi layar. Kontrol jeda/kecepatan berada di atas, zoom/fokus di sisi peta, dan empat tombol di bawah: Menu, Jelajah, Intervensi, Catatan. Semua detail berada pada menu accordion yang tertutup saat pertama dibuka. Di HP menu muncul dari bawah; desktop menggunakan panel samping. Tombol tutup, area di luar panel, atau Escape mengembalikan peta. Kontrol sentuh mempunyai area tekan minimal 44 piksel.

Event penting, bangunan selesai, penemuan, sihir, kontak, perpecahan, perang, perjalanan dan koloni ditampilkan sebagai kartu di atas dunia. Ketuk kartu untuk melihat catatan peradaban terkait; tutup dengan × atau tunggu 10 detik. Antrean dibatasi 12 notifikasi terbaru, ditampilkan satu per satu. Log aktivitas rutin tidak memunculkan popup. Riwayat saat membuka/mengimpor simpanan tidak diputar ulang, dan event yang terjadi ketika menu terbuka menunggu tampilan dunia.

## Siklus simulasi

**Kebutuhan → pilihan pekerjaan → penggunaan bahan → hasil → kebutuhan berikutnya.** Semua peradaban memakai kalender yang sama. Setiap warga yang hidup dan berada di desa mendapat satu tindakan per hari; kru ekspedisi tidak bekerja di desa. Proyek baru, riset dan wahana membayar bahan sekali. Tidak ada panen, peleburan, listrik atau mana otomatis dari warga yang beristirahat.

| Sistem | Hubungannya dengan sistem lain |
|---|---|
| Pangan | Foraging, memancing dan petani menghasilkan pangan; ladang membutuhkan petani, maksimal tiga pekerja per ladang sehari. Pertanian meningkatkan hasil. Pangan untuk makan, kelahiran, penjagaan dan bekal ekspedisi. Gudang melindungi pangan sesuai kapasitas; stok di tanah lebih cepat rusak. |
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

Model keputusan adalah **tabular Q-learning lokal**, dibantu aturan kebutuhan dan pengaman bertahan hidup. State mencakup lapar, energi rendah, kesehatan, rumah, ladang, kelangkaan/jarak sumber pangan, proyek, keharmonisan, kebutuhan masyarakat dan prioritas pemain. State perjalanan terpisah mencakup fase, lapar, energi, kesehatan dan makanan yang benar-benar dibawa. Pilihan menggunakan Q + kecenderungan sifat + urgensi kebutuhan; eksplorasi tetap memungkinkan tindakan lain. Warga tidak merupakan agen LLM.

```text
Q(s,a) ← Q(s,a) + α [reward + 0.75 × max Q(s',a') − Q(s,a)]
α = 0.16; dengan balai belajar 0.22
```

Perjalanan memberi hadiah berdasarkan muatan yang benar-benar tiba; berangkat, bergerak dan memanen tidak otomatis diberi hadiah. Waktu perjalanan dan kehilangan kesehatan dikenai penalti. Keputusan awal juga diperbarui saat pulang atau meninggal dengan akumulasi hasil dibagi akar durasi, α=0.24 dan nilai lanjutan didiskonto 0.75^durasi. Catatan perjalanan ikut tersimpan. Memori warga dibatasi 512 state untuk dunia baru (arsip lama hingga 1.000 state tetap dapat dimuat); Q lama dipakai sebagai nilai awal untuk konteks yang lebih rinci.

Warga dapat makan dari bekal/muatan/pribadi di perjalanan, beristirahat dan membatalkan perjalanan untuk pulang. Stok desa tidak dapat dimakan dari jauh. Tanpa bekal, kerusakan kesehatan tambahan terkait kelaparan; tanpa rumah tetap lebih mudah sakit, kurang pulih dan lebih mudah marah. Ladang pertama lebih mendesak saat pangan tipis; proyek terjangkau tidak lagi tertahan oleh bangunan lain yang kekurangan bahan. Eksplorasi bahan ladang bisa menjadi prioritas ketika pangan sementara cukup.

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

Render: gunakan Web Service Node dari branch `main`, Root Directory kosong, Build Command `npm install`, Start Command `npm start`. Versi 0.10 tidak menambah env. Deploy commit terbaru bila deployment belum mengikuti main. Jika berpindah URL/domain, ekspor simpanan dahulu lalu impor pada URL baru.

## Simpanan dan batas model

Autosave browser tiap lima detik; ekspor/impor JSON untuk cadangan dan pindah perangkat. Semua dunia, warga, kemampuan, Q, bahan dan perjalanan ikut disimpan. Tidak ada sinkronisasi cloud atau penyimpanan progres pemain di server.

Save versi 1–9 dimigrasikan ke versi 10, mempertahankan progres dan bobot Q. Tindakan baru dimulai dari nol. Ekspedisi versi 1–4 yang tidak mempunyai kru nyata dibatalkan dengan pengembalian bahan peluncuran dan catatan penjelasan. Penerbangan versi 5 beserta kru dan kargo tetap dipertahankan. Ekspor cadangan sebelum pembaruan tetap disarankan.

Satu hari = empat detik; 60 hari = satu tahun. Saat kembali, maksimal delapan jam dihitung pada kecepatan normal. Tab tertutup tidak menjalankan server simulasi; dunia dijeda tidak maju. Simpanan rusak tidak ditimpa otomatis. Dunia dengan ribuan warga dapat memerlukan beberapa menit untuk menghitung delapan jam offline; perhitungan ini masih berjalan pada thread utama browser.

Batas: tiga planet, delapan peradaban, 256 warga hidup per peradaban termasuk kru, 128 fasilitas per jenis, 16 resource khusus per peradaban, 24 sumber sihir dan 24 event dunia. Maksimal 2.048 rekaman alat per peradaban. Arsip warga/alat dipangkas agar simpanan tidak tumbuh tanpa batas. Fisika alat memakai besaran relatif sederhana. Jarak perjalanan memakai garis lurus, belum memakai pathfinding atau orbit fisik. Perang deposit menghitung pasukan yang sudah tiba di front, dengan model kendali wilayah sederhana.

Pengujian meliputi keputusan/keahlian, ekonomi dan bukti praktik, sihir, perang, demografi, perpindahan nyata, kru/koloni, migrasi, UI, backend serta kontrak Gemini dengan respons tiruan. Gemini dengan kunci sungguhan dan penampilan visual browser belum diuji di lingkungan ini.
