# 🚀 STARHOP — Pixel Arcade Adventure

<div align="center">

![Phaser 3](https://img.shields.io/badge/Phaser-3.88.2-00f0ff?style=for-the-badge&logo=phaser&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646cff?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![Node Test Runner](https://img.shields.io/badge/Tests-17%20Passed-39ff14?style=for-the-badge&logo=node.js&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20PWA-ff007a?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-ffd700?style=for-the-badge)

**STARHOP** adalah game arcade retro platformer 2D bertema eksplorasi luar angkasa yang dibangun menggunakan **Phaser 3**, **Vite**, **Modern JavaScript (ES Modules)**, dan **HTML5/CSS3**.

Jelajahi 10 sektor pulau melayang kosmik, hindari jebakan mematikan, injak drone patroli, picu kemampuan aktif aksesoris unik, manfaatkan *power-up*, dan tembus portal antardimensi!

[Fitur Utama](#-fitur-utama) • [Panduan Kontrol](#-panduan-kontrol) • [Karakter & Sinergi](#-karakter--sinergi-hangar) • [Instalasi](#-cara-menjalankan-proyek) • [Deploy ke GitHub Pages](#-deploy-ke-github-pages)

</div>

---

## 🌟 Cuplikan Gameplay & Sorotan

* **100% Prosedural Tanpa Aset Eksternal**: Seluruh sprite pixel art dibuat secara dinamis menggunakan HTML5 Canvas saat inisialisasi (`TextureGenerator.js`), dan seluruh efek suara maupun musik ambient disintesis langsung secara real-time via Web Audio API (`AudioManager.js`).
* **Sistem Kemampuan Aktif (Active Abilities)**: Setiap aksesori kosmetik memiliki tombol jurus aktif dengan *cooldown bar* visual di layar.
* **Pertarungan Drone (Stompable Drones)**: Drone patroli dapat diinjak dari atas untuk mendapatkan loncatan pantul tinggi, ledakan renyah, dan jatuhan koin emas bonus.
* **Penyelamatan Malaikat (Angel Wings Rescue)**: Jatuh ke jurang saat perisai aktif memanggil Sayap Malaikat Surgawi untuk mengangkut pemain kembali ke platform dengan selamat.
* **Dukungan Penuh Layar Sentuh Mobile**: *Smart sliding D-pad*, *pointer capture*, dan respon getar haptic yang responsif di smartphone dan tablet.

---

## 🎮 Fitur Utama

### 1. Platforming Modern & Responsif
- **Akselerasi & Deselerasi Halus**: Kontrol inersia presisi dengan batas kecepatan yang dinamis.
- **Variable Jump Height**: Ketinggian lompatan ditentukan secara fleksibel oleh durasi menekan tombol loncat.
- **Coyote Time (~160ms) & Jump Buffer (~250ms)**: Menjamin input loncat tidak pernah hilang meski tombol ditekan sesaat sebelum mendarat atau sesaat setelah melangkah dari tepi platform.
- **Dynamic Camera Look-Ahead**: Kamera secara cerdas mengantisipasi arah gerak horizontal robot dan menyesuaikan offset pandangan.
- **POV Camera Zoom Toggle**: Pilihan mode pandangan *Close* (1.35x — optimal untuk layar smartphone) dan *Normal* (1.0x — bidang pandang luas).

### 2. Entitas & Mekanik Tahapan Dinamis
- ⚡ **Timed Laser Gates**: Menara laser dengan fase kedipan peringatan kuning aman sebelum menembakkan sinar cyan-putih mematikan.
- 🚀 **Kinetic Bounce Pads**: Pegas peluncur kinetik yang melecutkan robot melambung tinggi (`BOOST! ▲`) melintasi jurang angkasa.
- 🌀 **Zero-G Gravity Distortion Rifts**: Anomali medan gravitasi rendah (potongan gravitasi 60%) untuk melayang seperti di bulan (*moon-jump float physics*).
- ⏩ **Maglev Conveyor Belts**: Sabuk konveyor elektromagnetik beranimasi panah yang mendorong pergerakan pemain ke kiri/kanan secara dinamis.
- 🛸 **Aerial Patrol Sentry Drones**: Drone patroli udara dengan baling-baling berputar dan mata siklop. **Bisa diinjak (*stomped*) dari atas** untuk loncatan pantulan tinggi dan koin bonus, atau dihancurkan sekaligus dengan *Plasma Blast*.

### 3. Sistem Kemampuan Aktif Aksesoris (Active Ability)
Gunakan tombol `E` pada keyboard atau tombol `⚡` pada layar sentuh mobile:
- 🪽 **Phase Dash** (*Photon Wings*): Melesat secepat kilat searah hadap robot (`3.2x speed`) dengan kekebalan benturan selama 0.35 detik dan bayangan foton cyan.
- ✨ **Halo Barrier** (*Cosmic Halo*): Memunculkan perisai cincin emas suci yang memberikan kekebalan total selama 3 detik.
- 🔥 **Jetpack Hover** (*Cyber Jetpack*): Melayang bebas di udara selama 2.5 detik saat menahan tombol loncat diiringi semburan api roket ganda.
- 👑 **Plasma Blast** (*Plasma Crown*): Memancarkan gelombang kejut energi ungu radius 120px yang menghancurkan semua drone patroli terdekat seketika.
- 🌌 **Comet Glide** (*Nebula Cape*): Meluncur perlahan di udara (*slow-fall glide*) disertai daya hisap magnet koin ekstra kuat selama 3 detik.

---

## 🤖 Karakter & Sinergi Hangar

Tersedia 5 robot penjelajah luar angkasa dengan statistik unik dan sinergi khusus (*Signature Synergy*) jika dipasangkan dengan perlengkapan kanoniknya:

| Karakter | Gelar | Harga | Aksesori Kanonik | Efek Sinergi Khusus (*Signature Perk*) |
| :--- | :--- | :--- | :--- | :--- |
| **NOVA** | *The Stellar Scout* | **Gratis** | 🪽 Photon Wings | **Stellar Archangel**: Daya loncat bertambah +6% & jejak stardust foton cyan. |
| **BYTE** | *Cyber Specialist* | 45 ● | 🔥 Cyber Jetpack | **Cyber Infiltrator**: Kecepatan lari bertambah +8% overdrive & semburan api roket super. |
| **COMET** | *Astral Voyager* | 90 ● | 🌌 Nebula Cape | **Astral Knight**: Magnet koin pasif permanen & jubah konstelasi bintang hidup. |
| **VORTEX** | *Quantum Champion* | *Tamat Lvl 3* | 👑 Plasma Crown | **Quantum Warlord**: Bonus skor +25% untuk setiap kristal yang dikumpulkan. |
| **SOLARIS** | *Cosmic Emperor* | *Tamat Lvl 10* | ✨ Cosmic Halo | **Ascended Solar Deity**: Ekstra +1 Nyawa Maksimum (**4 Hati**) & aura mahkota matahari. |

---

## 🪐 10 Level Kampanye Luar Angkasa

1. **Level 1: First Orbit** — Pengenalan lompatan dasar, pengumpulan koin emas, serta power-up Magnet & Perisai.
2. **Level 2: Neon Drift** — Koridor jurang luas dengan platform antar-jemput bergerak (*moving platforms*).
3. **Level 3: Gravity Garden** — Rangkaian pulau asteroid rapuh (*crumbling platforms*) dan plasma orb berdenyut. (Membuka robot **VORTEX**).
4. **Level 4: Cosmic Core** — Memperkenalkan rintangan **Timed Laser Gates** yang menuntut ketepatan waktu.
5. **Level 5: Asteroid Belt** — Memperkenalkan peluncur **Kinetic Bounce Pads** di atas jurang jurang tinggi.
6. **Level 6: Nebula Storm** — Memperkenalkan **Zero-G Gravity Distortion Rifts** dengan fisika melayang bebas.
7. **Level 7: Solar Flare** — Memperkenalkan sabuk dorong **Maglev Conveyor Belts** di atas ventilasi termal surya.
8. **Level 8: Vortex Depths** — Memperkenalkan kawanan **Aerial Patrol Sentry Drones** di atas platform bergerak.
9. **Level 9: Supernova Remnant** — *The Master Gauntlet*! Kombinasi Bounce Pads, Konveyor, Laser Gates, dan Patrol Drones.
10. **Level 10: The Cosmic Throne** — *Grand Finale Apex Citadel* megah yang menyatukan seluruh mekanik game menuju singgasana Kaisar Kosmik! (Membuka robot **SOLARIS**).

---

## 🕹️ Panduan Kontrol

### Keyboard (Desktop)
| Tombol | Fungsi |
| :--- | :--- |
| `A` / `←` | Bergerak ke Kiri |
| `D` / `→` | Bergerak ke Kanan |
| `W` / `↑` / `Space` | Melompat (tahan untuk lompatan lebih tinggi) |
| `E` | Mengaktifkan **Kemampuan Aksesori** (*Active Ability*) |
| `R` | Memulai Ulang Level (*Quick Restart*) |
| `Esc` / `P` | Jeda Permainan (*Pause Menu*) |

### Layar Sentuh (Mobile / Tablet)
| Tombol UI | Fungsi |
| :--- | :--- |
| **D-Pad ◀ / ▶** | Smart sliding D-Pad (geser jempol kiri ke kiri/kanan tanpa perlu mengangkat jari). |
| **Tombol ▲ (JUMP)** | Melompat antarplatform (didukung *jump queue* instan). |
| **Tombol ⚡ (ABILITY)** | Mengaktifkan kemampuan aktif aksesori yang sedang dipakai. |
| **Tombol ⏸ (PAUSE)** | Membuka jendela menu jeda di pojok kanan atas. |
| **Ketuk Layar** | Melewati (*skip*) cutscene animasi pesawat dropship di awal level. |

---

## 📁 Struktur Proyek

```
starhop/
├── index.html                 # Entry point HTML & container UI overlay
├── style.css                  # Desain visual neon arcade, glassmorphism, & tombol 3D
├── package.json               # Dependensi proyek & script runner
├── README.md                  # Dokumentasi proyek
├── dist/                      # Hasil bundel production siap deploy
├── test/
│   └── game-tests.js          # Unit & integration test suite (17 tes otomatis)
└── src/
    ├── main.js                # Inisialisasi engine Phaser Game
    ├── data/
    │   ├── characters.js      # Definisi 5 robot, statistik, harga, & sinergi
    │   ├── accessories.js     # Definisi 6 aksesori kosmetik & kemampuan
    │   └── levels.js          # Layout 10 level, koordinat platform, & hazard
    ├── entities/
    │   ├── Player.js          # Logika robot, jurus aktif, fisika, nyawa, & respawn
    │   ├── Platforms.js       # Platform statis, bergerak, runtuh, laser, & drone
    │   └── Collectibles.js    # Koin berputar, kristal, power-up magnet/shield/2x, portal
    ├── scenes/
    │   ├── BootScene.js       # Registrasi generator tekstur prosedural
    │   ├── MenuScene.js       # Latar belakang menu luar angkasa dengan paralaks
    │   └── GameScene.js       # Loop utama gameplay, kamera dinamis, collider, & HUD
    ├── systems/
    │   ├── AudioManager.js    # Synthesizer Web Audio API real-time (SFX & BGM)
    │   ├── SaveManager.js     # Persistence localStorage schema versioning V1
    │   └── TextureGenerator.js# Prosedural Canvas pixel art texture generator
    └── ui/
        ├── TouchControls.js   # Kontrol sentuh layar responsif dengan haptic feedback
        └── UIManager.js       # Pengontrol UI HTML (HUD, Shop, Level Select, Modals)
```

---

## 💻 Cara Menjalankan Proyek

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru.
- Browser modern yang mendukung Web Audio API & Canvas (Chrome, Edge, Firefox, Safari).

### 2. Instalasi Dependensi
Clone repository ini dan jalankan perintah install:
```bash
git clone https://github.com/USERNAME_ANDA/starhop.git
cd starhop
npm install
```

### 3. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser pada alamat lokal yang tertera di terminal (biasanya `http://localhost:5173/`).

### 4. Menjalankan Tes Otomatis
Game ini dilengkapi dengan test suite bawaan Node.js tanpa dependensi pihak ketiga yang berat:
```bash
npm test
```
*Output memvalidasi:* `SaveManager V1`, transaksi wallet, rekor level & speedrun timer, integritas level 1-10, trap & drone patrol, serta sinergi dua arah karakter-aksesoris (17 tests passing).

### 5. Membuat Production Build
Untuk mem-bundle kode menjadi file statis siap rilis:
```bash
npm run build
```
File hasil kompilasi akan tersimpan di dalam folder `dist/`. Anda dapat menguji hasilnya dengan:
```bash
npm run preview
```

---

## 🌐 Deploy ke GitHub Pages

Anda dapat mempublikasikan game ini secara gratis ke **GitHub Pages** dengan salah satu cara berikut:

### Opsi A: Menggunakan GitHub Actions (Otomatis & Direkomendasikan)
1. Buat file `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
2. Buka repository Anda di GitHub -> Masuk ke **Settings** -> **Pages**.
3. Di bagian **Build and deployment** -> **Source**, pilih **GitHub Actions**.
4. Lakukan `git push` ke branch `main`, dan game Anda akan otomatis tayang!

> [!NOTE]
> Jika repository Anda berada di subpath (misal: `https://username.github.io/starhop/`), pastikan menambahkan `base: './'` pada `vite.config.js` agar aset dimuat relatif secara sempurna.

---

## 🛠️ Arsitektur Teknis

1. **Procedural Pixel Art (Zero External Image Files)**: Seluruh tekstur karakter, animasi bingkai lari/loncat, platform logam, gerbang laser, dan partikel diproduksi saat runtime via Canvas 2D (`TextureGenerator.js`). Tidak ada aset gambar PNG/JPG eksternal yang dapat mengalami broken link (HTTP 404).
2. **Pure Web Audio API Synthesizer**: Suara tidak menggunakan file `.mp3` atau `.wav`. Seluruh SFX arcade dan arpeggiator musik latar luar angkasa dihasilkan dari gelombang *sine*, *square*, *sawtooth*, dan *noise buffer* yang disintesis secara matematis dengan latensi 0ms.
3. **Persistence Resilient Save System**: Penyimpanan lokal dilengkapi validasi integritas skema data V1, perlindungan *corrupt JSON recovery*, dan fallback otomatis untuk mode *Private/Incognito Browsing*.
4. **Touch & Haptic Feedback API**: Mendukung API `navigator.vibrate` untuk sensasi haptic mikro saat melompat atau mengganti arah di smartphone.

---

## 📜 Lisensi

Proyek ini dirilis di bawah lisensi [MIT License](LICENSE). Bebas digunakan, dipelajari, dan dikembangkan untuk keperluan non-komersial maupun komersial.

---

<div align="center">
Dibuat dengan ❤️ untuk pecinta game retro platformer. Selamat bertualang di luar angkasa! 🚀
</div>
