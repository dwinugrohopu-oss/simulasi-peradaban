# Peradaban — dunia otonom dengan warga yang belajar

Prototype **0.5.0**. Enam manusia memulai permukiman dan enam alien hidup mandiri di planet lain. Sumber sihir sudah ada sejak awal; warga perlu menemukan cara memakainya. Pemain mengamati dunia, memilih prioritas, atau memasukkan intervensi melalui prompt. Pembangunan berjalan otomatis sesuai kebutuhan.

Versi ini menghubungkan pekerjaan dengan persediaan, fasilitas, riset, konflik dan perjalanan. Temuan audit serta cakupan verifikasi ada di [AUDIT.md](AUDIT.md).

## Siklus simulasi

**Kebutuhan → pilihan pekerjaan → penggunaan bahan → hasil → kebutuhan berikutnya.** Semua peradaban memakai kalender yang sama. Setiap warga yang hidup dan berada di desa mendapat satu tindakan per hari; kru ekspedisi tidak bekerja di desa. Proyek baru, riset dan wahana membayar bahan sekali. Tidak ada panen, peleburan, listrik atau mana otomatis dari warga yang beristirahat.

| Sistem | Hubungannya dengan sistem lain |
|---|---|
| Pangan | Foraging, memancing dan petani menghasilkan pangan; ladang membutuhkan petani, maksimal tiga pekerja per ladang sehari. Pertanian meningkatkan hasil. Pangan untuk makan, kelahiran, penjagaan dan bekal ekspedisi. Surplus di atas kapasitas penyimpanan berangsur rusak. |
| Rumah dan kesehatan | Rumah menyediakan tiga tempat; habitat menyediakan empat. Tempat kru tetap dihitung agar tidak terisi kelahiran saat mereka pergi. Sumur membantu pemulihan; kesehatan rendah mengurangi efisiensi pekerjaan. |
| Alat | Warga merancang dan menguji prototipe dengan bahan nyata. Dua alat berhasil membuka bukti metalurgi; pemakaian alat dan peleburan membuka bukti mesin. Alat diberikan kepada pekerja yang membutuhkan, aus dan dapat rusak. Logam serta paduan menjadi pilihan material setelah ditemukan. |
| Industri | Tungku + metalurgi: kayu → bahan bakar; batu + bahan bakar → logam. Bengkel + mesin: logam + bahan bakar → paduan. Pembangkit + listrik: bahan bakar → energi. Setiap tahap perlu operator. |
| Penelitian | Pengetahuan, keahlian, penemuan terdahulu, bukti praktik dan bahan harus cukup. Peneliti memenuhi pekerjaan riset bertahap; bahan dibayar saat riset dimulai. Balai belajar mempercepat penelitian dan memungkinkan mengajar generasi berikutnya. |
| Sihir | Warga berbakat dengan kepekaan ≥75, penelitian ≥20 dan pengetahuan desa ≥40 mempelajari sumber dekat desa sampai pengamatan 60. Setelah ditemukan, warga mengumpulkan mana, menyembuhkan seorang pasien atau membantu proyek dengan tindakan terpisah. Warga lain bisa berlatih lewat sumber/mentor. |
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

Urutan riset: pertanian → metalurgi → mesin → astronomi → listrik → elektronika → roket → penunjang kehidupan → penerbangan antariksa → habitat planet. Syarat rinci dan pekerjaan riset ditampilkan pada panel penemuan. Zaman mengikuti penemuan yang benar-benar selesai, bukan angka pengetahuan saja.

Panel **Kebutuhan → pekerjaan → hasil** menunjukkan sasaran desa, pekerjaan hari terakhir, bahan masuk/keluar, penerima manfaat serta alokasi proyek. Pilih permukiman untuk melihat ekonomi dan penduduknya. Geser peta, gunakan roda mouse, dua jari atau ± untuk zoom. Tampilan tata surya memperlihatkan planet dan perjalanan. Pengamat dapat melihat alien sejak awal; peradaban harus mencapai kontak sendiri.

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

Render: gunakan Web Service Node dari branch `main`, Root Directory kosong, Build Command `npm install`, Start Command `npm start`. Versi 0.5 tidak menambah env. Deploy commit terbaru bila deployment belum mengikuti main. Jika berpindah URL/domain, ekspor simpanan dahulu lalu impor pada URL baru.

## Simpanan dan batas model

Autosave browser tiap lima detik; ekspor/impor JSON untuk cadangan dan pindah perangkat. Semua dunia, warga, kemampuan, Q, bahan dan perjalanan ikut disimpan. Tidak ada sinkronisasi cloud atau penyimpanan progres pemain di server.

Save versi 1–4 dimigrasikan ke versi 5, mempertahankan progres dan bobot Q. Tindakan baru dimulai dari nol. Ekspedisi versi lama yang tidak mempunyai kru nyata dibatalkan dengan pengembalian bahan peluncuran dan catatan penjelasan. Ekspor cadangan sebelum pembaruan tetap disarankan.

Satu hari = empat detik; 60 hari = satu tahun. Saat kembali, maksimal delapan jam dihitung pada kecepatan normal. Tab tertutup tidak menjalankan server simulasi; dunia dijeda tidak maju. Simpanan rusak tidak ditimpa otomatis.

Batas: tiga planet, delapan peradaban, 16 warga hidup per peradaban termasuk kru, delapan fasilitas per jenis, 16 resource khusus per peradaban, 24 sumber sihir dan 24 event dunia. Arsip warga/alat dipangkas agar simpanan tidak tumbuh tanpa batas. Fisika alat memakai besaran relatif sederhana. Peta belum memakai pathfinding, medan tempur spasial atau orbit fisik.

Pengujian meliputi keputusan/keahlian, ekonomi dan bukti praktik, sihir, perang, demografi, perpindahan nyata, kru/koloni, migrasi, UI, backend serta kontrak Gemini dengan respons tiruan. Gemini dengan kunci sungguhan dan penampilan visual browser belum diuji di lingkungan ini.
