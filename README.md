# Peradaban — dunia otonom dengan warga yang belajar

Prototype **0.2**. Enam perintis memulai permukiman. Warga memilih kegiatan, mempelajari pekerjaan, membangun sesuai kebutuhan, dan membentuk generasi berikutnya. Pemain dapat mengamati sepenuhnya atau mengubah prioritas dan memasukkan objek melalui prompt.

## Warga, sifat, dan keahlian

Setiap warga memiliki dua sifat dasar:

| Sifat | Dampak |
|---|---|
| Rajin | Cenderung bekerja fisik/membangun, produksi +18% di bidang terkait, konsumsi energi -10% |
| Penasaran | Cenderung meneliti, penelitian +25%, eksplorasi +35% |
| Supel | Cenderung bersosialisasi, hasil sosial +15%, eksplorasi +10% |
| Hemat | Cenderung mencari pangan, hasil terkait +10%, makan memakai 0,8 makanan, eksplorasi -15% |
| Pemberani | Cenderung menebang, menambang, memancing; hasil terkait +18%, eksplorasi +20% |
| Hati-hati | Cenderung membangun, bertani, meneliti; hasil terkait +12%, konsumsi energi -15%, eksplorasi -30% |

Efek dua sifat dapat bergabung. Sifat menambahkan kecenderungan +1,2 per sifat pada skor pemilihan tindakan yang cocok, bukan mengunci karier. Pengetahuan dari pengalaman tetap memengaruhi keputusan.

Setiap pekerjaan yang dilakukan menambah satu poin keahlian di bidang itu. Tingkat keahlian: **Pemula**, **Terlatih** (20), **Terampil** (60), **Ahli** (150). Efisiensi dasar `1 + min(1.5, pengalaman/150)`; bonus sifat diterapkan setelahnya. Ini sistem latihan terpisah dari tabel Q yang belajar memilih tindakan.

## Pembangunan dan populasi otomatis

Tidak perlu merencanakan proyek manual. Warga memilih kebutuhan paling mendesak: pangan → ladang, kapasitas rumah → rumah, kesehatan → sumur, kemajuan ilmu → balai belajar. Urutan sebenarnya ditentukan skor kebutuhan; proyek menunggu bahan tersedia, membayar bahan sekali, lalu dikerjakan lewat tindakan warga. Aturan penentuan proyek adalah heuristik kebutuhan; pilihan kegiatan individu menggunakan Q-learning.

Rumah memberi kapasitas +3, ladang menghasilkan pangan pasif dan membuka bertani, sumur membantu pemulihan, balai belajar menaikkan hasil penelitian serta laju pembelajaran. Maksimal 8 bangunan per jenis dan 16 warga aktif.

- **Kelahiran:** diperiksa tiap tahun bila ada warga dewasa 18–45 tahun, pangan, keharmonisan, dan tempat tinggal cukup.
- **Anak:** tumbuh dari usia 0; hanya mencari pangan ringan, bermain/sosial, makan, istirahat sampai usia 16. Hasil kerja ringan 45% dari skala biasa.
- **Pendatang:** dapat hadir tiap 90 hari jika kondisi permukiman mendukung.
- **Pindah:** warga dewasa dapat pergi ketika pangan atau keharmonisan sangat buruk.
- **Kematian:** kesehatan habis atau peluang usia lanjut. Kematian dan perpindahan dicatat terpisah.

## Model self-learning

**Tabular Q-learning lokal**. Tiap warga memiliki tabel Q, pengalaman, eksplorasi, dan keahlian sendiri. Penduduk baru tidak langsung mewarisi model warga lain.

State terdiri dari lapar, energi rendah, kelangkaan pangan, proyek aktif, keharmonisan rendah, dan prioritas masyarakat. Tindakan tersedia: mencari makanan, menebang, menambang, bertani, membangun, meneliti, makan, istirahat, bersosialisasi, memancing bila ada sungai.

```text
Q(s,a) ← Q(s,a) + α [reward + 0.75 × max Q(s',a') − Q(s,a)]
α = 0.16, atau 0.22 bila ada balai belajar
Pilihan = argmax(Q + kecenderungan sifat), kecuali eksplorasi
```

Eksplorasi turun bertahap menuju 5%; sifat mengubah tingkat awalnya. Reward mengikuti hasil kerja, kebutuhan pribadi, kelangkaan, kebutuhan sosial, proyek, dan prioritas. Pengaman makan saat sangat lapar dan istirahat saat energi habis adalah aturan langsung, bukan hasil belajar. LLM tidak mengendalikan tiap keputusan warga; penggunaannya hanya untuk menerjemahkan prompt dunia.

## Prompt → rancangan → objek nyata

Panel **Intervensi dunia** membuat satu rancangan, menampilkan dampaknya, lalu tombol **Masukkan ke dunia** menerapkan perubahan sekali. Keluaran divalidasi; tidak ada kode LLM yang dieksekusi.

| Jenis | Efek simulasi |
|---|---|
| Sungai | Memancing, stok ikan pulih, peluang banjir tiap tahun |
| Hutan | Tambahan hasil menebang hingga stok habis |
| Tambang batu | Tambahan hasil menambang hingga stok habis |
| Reruntuhan | Tambahan hasil penelitian hingga stok habis |
| Bangunan | Hadiah 1–3 rumah, ladang, balai belajar, atau sumur tanpa biaya bahan |
| Peristiwa | Kekeringan menekan panen, banjir mengurangi pangan, festival menaikkan suasana/keharmonisan, wabah mengurangi kesehatan |

Contoh: **“Munculkan sungai di timur desa, banyak ikan tetapi bisa meluap.”** Warga mendapat tindakan memancing dan belajar nilainya lewat pengalaman. Posisi objek muncul pada peta dan tujuan animasi kegiatan; belum ada pathfinding atau biaya perjalanan berdasarkan jarak.

Objek dibatasi 24, kekayaan 1–10, intensitas 1–5, durasi peristiwa 10–180 hari. Event selesai dihapus dari daftar aktif. Semua mekanik berada dalam jenis yang didukung; permintaan mekanik yang benar-benar baru perlu pengembangan kode.

### Dua mode prompt

- **Mode lokal:** tanpa API. Pencocokan kata kunci untuk sungai, hutan, tambang batu, reruntuhan, rumah, ladang, balai belajar, sumur, kemarau, banjir, festival, wabah. Timur/barat/utara/selatan dikenali, parameter lain memakai default. UI secara jelas menandainya sebagai mode lokal, bukan LLM.
- **Mode LLM:** server memanggil OpenAI Responses API dengan Structured Outputs. Kunci API hanya ada di server. Dibutuhkan kode akses pemilik sebelum permintaan berbayar; batas default 20 permintaan/jam/server. Satu prompt membuat satu objek. Respons tidak lengkap, refusal, nilai di luar batas, dan kesalahan layanan ditolak.

Dokumentasi implementasi: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

## Menjalankan lokal

Node.js 20+; tanpa dependency npm:

```bash
npm start
```

Buka `http://localhost:8000`. Tanpa env, server memakai mode lokal. Untuk LLM, isi env sebelum menjalankan `node server.js`, atau gunakan Node yang mendukung:

```bash
node --env-file=.env server.js
```

Salin `.env.example` menjadi `.env` dan isi sendiri; jangan commit kunci. Keanggotaan ChatGPT dan akun API merupakan konfigurasi terpisah; gunakan kunci API milik pemilik deployment.

```bash
npm test
npm run build
```

Build menyalin lima file frontend ke `dist/`. Static Site tetap dapat menjalankan seluruh simulasi dan prompt lokal. Membuka `index.html` melalui `file://` tidak didukung karena JavaScript modules.

## Render: Web Service untuk LLM

Buat **Web Service**, runtime **Node**, dari repo ini. Pengaturan:

| Pengaturan | Nilai |
|---|---|
| Branch | `main` |
| Root Directory | Kosong |
| Build Command | `npm install` |
| Start Command | `npm start` |

Env:

| Env | Isi |
|---|---|
| `OPENAI_API_KEY` | Kunci API OpenAI pribadi; hanya di server |
| `WORLD_TOKEN` | Kode akses panjang yang kamu pilih; masukkan pada panel prompt game |
| `OPENAI_MODEL` | Opsional; default `gpt-4o-mini`, dapat diganti model yang mendukung Responses dan Structured Outputs |
| `MAX_PROMPTS_PER_HOUR` | Opsional; default `20`, rentang 1–100 |

`PORT` disediakan hosting. Jika `OPENAI_API_KEY` diisi tetapi `WORLD_TOKEN` kosong, endpoint LLM dinonaktifkan. Jangan memasukkan kunci API ke panel game. Endpoint tidak menyimpan token di localStorage atau file simpanan. API LLM memakai layanan eksternal dengan pemakaian API; game tanpa LLM tidak mengirim prompt ke OpenAI.

Static Site versi sebelumnya tidak dapat menjalankan backend ini. **Ekspor simpanan sebelum berpindah URL** ke Web Service, lalu impor pada URL baru. Deployment Web Service: https://render.com/docs/deploy-node-express-app

## Progres dan migrasi

Progres tetap di browser (autosave 5 detik), termasuk sifat, skill, tabel Q, penduduk, bangunan, dan objek dunia. Ekspor/impor JSON untuk cadangan atau pindah perangkat/domain. Tidak perlu database atau disk Render untuk progres pemain; belum ada sinkronisasi cloud.

Simpanan versi 0.1 dimigrasikan otomatis tanpa menghapus sumber daya, umur, model lama, proyek, atau waktu simpan. Warga lama mendapat dua sifat deterministik; tabel Q lama dipindahkan ke state dengan keharmonisan cukup, aksi memancing dimulai dengan nilai nol. Cadangan versi lama tetap dapat diimpor.

Satu hari = 4 detik; 60 hari = satu tahun. Saat kembali, game menghitung maksimal 8 jam waktu berlalu pada kecepatan normal. Simulasi tidak berjalan di server saat tab tertutup. Dunia dijeda tidak maju; warga tetap dapat meninggal selama perhitungan waktu berlalu. Menghapus data situs atau berpindah origin memutus akses simpanan lokal. Arsip maksimal 100 warga terbaru; warga aktif selalu dipertahankan. Simpanan rusak tidak ditimpa otomatis.

## Pengujian

27 pengujian mencakup Q-learning, sifat/efisiensi, pembangunan otonom, populasi, skill, efek objek, migrasi versi lama, waktu berlalu, storage gagal, ekspor/impor, preview/apply, endpoint backend, autentikasi, rate limit, serta kontrak Responses API dengan respons tiruan. Panggilan LLM sungguhan memerlukan kunci API dan belum diuji dalam lingkungan pengembangan ini. Smoke test UI memakai DOM minimal; verifikasi visual di browser belum dilakukan.
