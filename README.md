# AnatomiVerse 3D

Game edukatif anatomi tubuh manusia 3D untuk siswa SMA — jelajah model 3D,
misi temukan organ, kuis, dan **sesi kuis live** ala Quizizz untuk kelas.

## Menjalankan

```bash
npm install
npm start          # build + jalankan server (default http://localhost:3001)
```

Saat server menyala, terminal menampilkan alamat **Lokal** dan **LAN**
(mis. `http://192.168.1.10:3001`) yang bisa dibuka siswa dari HP di jaringan
yang sama.

Perintah lain:

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Mode pengembangan (Vite, butuh server terpisah) |
| `npm run server` | Jalankan server sesi saja (tanpa build) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run typecheck` | Cek tipe TypeScript |

## PIN guru

Area guru (`/teacher`, `/host`) dilindungi PIN yang **divalidasi di server**.

- Default PIN: `2025` — **wajib diganti**.
- Set PIN saat menjalankan server:

  ```powershell
  $env:TEACHER_PIN="rahasia-baru"; $env:PORT="3001"; node server/index.mjs
  ```

PIN tidak ikut ke bundel klien dan tidak tersimpan di server, sehingga siswa
tidak bisa membuka area guru tanpa PIN.

## HTTPS untuk LAN (disarankan di sekolah)

Beberapa fitur browser hanya aktif pada **secure context** (HTTPS atau
`localhost`): instalasi PWA/offline dan tombol "Salin". Bila siswa membuka
`http://<ip-lan>`, keduanya nonaktif (aplikasi tetap jalan).

Aktifkan HTTPS dengan sertifikat lokal, mis. via [mkcert](https://github.com/FiloSottile/mkcert):

```bash
mkcert -install
mkcert 192.168.1.10 localhost 127.0.0.1
```

Lalu jalankan:

```powershell
$env:SSL_CERT=".\192.168.1.10+2.pem"; $env:SSL_KEY=".\192.168.1.10+2-key.pem"
$env:TEACHER_PIN="rahasia-baru"; node server/index.mjs
```

Sertifikat root `mkcert` perlu dipercaya di HP siswa (sekali) agar tak muncul
peringatan. Tanpa HTTPS pun aplikasi berfungsi; QR join dan topologi sesi tetap
berjalan.

## Alur kelas

1. Guru buka `/host`, masukkan PIN, pilih **Cakupan Materi** + **Jumlah Soal**.
2. Siswa memindai **QR** yang muncul, atau buka `/join` + masukkan kode.
3. Guru tekan **▶ Mulai Belajar** → **▶ Mulai Kuis**.
4. Skor tampil real-time di **Papan Live**; **Export CSV** untuk rekap.
5. Guru dapat melihat rekap seluruh sesi di `/teacher`.

**Fitur pendukung**

- **Timer per soal** — jawaban otomatis ditampilkan saat waktu habis (bisa dimatikan).
- **Mode proyektor** — tampilan layar penuh untuk proyektor kelas (tombol 🖥️, keluar dengan Esc).
- **Editor soal kustom** — soal buatan guru tersimpan di browser dan ikut diacak pada cakupan "Semua Sistem".
- **Pembahasan untuk siswa** — di akhir sesi siswa melihat benar/salah, kunci, dan penjelasan tiap soal.
- **Rekap per soal** — akurasi tiap soal di `/teacher` dan pada Export CSV.
- **Tahan refresh** — sesi guru dipulihkan otomatis saat halaman dimuat ulang / koneksi putus.
- **Font self-host** — jalankan `npm run fonts` sekali; aplikasi tidak lagi bergantung pada Google Fonts.

## Kualitas kode

- `npm run lint` — ESLint (TypeScript + React Hooks)
- `npm run typecheck` — TypeScript
- `npm run build` — build produksi
- `.github/workflows/ci.yml` menjalankan lint, typecheck, dan build di setiap push/PR.

## Konfigurasi (environment variable)

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `PORT` | `3001` | Port server |
| `TEACHER_PIN` | `2025` | PIN area guru (ganti!) |
| `SSL_CERT` / `SSL_KEY` | — | Path sertifikat untuk HTTPS |
| `ALLOWED_ORIGINS` | same-origin | Daftar origin yang diizinkan (dipisah koma) |

Lihat `.env.example`.

## Uji realtime

```bash
# jalankan server lebih dulu (mis. di port 3005 dengan PIN 1234)
$env:PORT="3005"; $env:TEACHER_PIN="1234"; node server/index.mjs
node scripts/rt-test.mjs
```

## Atribusi & lisensi

- Model anatomi 3D: **Z-Anatomy** — CC BY-SA 4.0.
- Data deskripsi organ bersumber dari Wikipedia (CC BY-SA).
