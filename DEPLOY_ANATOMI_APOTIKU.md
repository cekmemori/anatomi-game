# 🚀 Panduan Deploy AnatomiVerse 3D ke Cloud (anatomi.apotiku.id)

Panduan ini berisi langkah-langkah praktis untuk membuat database PostgreSQL dan menayangkan **AnatomiVerse 3D** di domain **`anatomi.apotiku.id`** pada VPS `apotiku.id`.

---

## 1. Topologi & Rangkuman Konfigurasi

| Parameter | Nilai / Keterangan |
| :--- | :--- |
| **Server VPS** | `103.191.63.252` |
| **Domain** | `anatomi.apotiku.id` (Sudah mengarah ke IP `103.191.63.252`) |
| **Target Direktori** | `/var/www/anatomi-game` |
| **Reverse Proxy** | Nginx (`/etc/nginx/sites-available/anatomi`) |
| **Database** | PostgreSQL (`anatomi_db`) user `apotiku_user` |
| **Process Manager** | PM2 (port `3001`) |
| **SSL Certificate** | Let's Encrypt (Wildcard `*.apotiku.id` atau certbot langsung) |

---

## 2. Langkah 1: Buat Database di VPS

Login ke VPS Anda via terminal SSH:
```bash
ssh root@103.191.63.252
```

Jalankan perintah berikut untuk membuat database `anatomi_db`:
```bash
sudo -u postgres psql -c "CREATE DATABASE anatomi_db OWNER apotiku_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE anatomi_db TO apotiku_user;"
```

> [!NOTE]
> Aplikasi AnatomiVerse sudah dilengkapi skema otomatis (*auto-DDL*). Begitu server dijalankan pertama kali, tabel `students` beserta index XP akan langsung dibuat otomatis.

---

## 3. Langkah 2: Salin File Proyek ke Server

Dari komputer lokal Anda (PowerShell / Command Prompt), upload folder proyek `anatomi-game` ke VPS:
```bash
# Dari komputer lokal
scp -r d:\anatomi-game root@103.191.63.252:/var/www/anatomi-game
```
*(Atau jika menggunakan git, buat repo privat dan clone ke `/var/www/anatomi-game`)*.

---

## 4. Langkah 3: Setup Dependencies & Environment di VPS

Di terminal VPS:
```bash
cd /var/www/anatomi-game

# Buat file .env produksi
cat << 'EOF' > .env
PORT=3001
TEACHER_PIN=2025
DATABASE_URL=postgresql://apotiku_user:ptei123.@localhost:5432/anatomi_db
ALLOWED_ORIGINS=https://anatomi.apotiku.id
EOF

# Install dependencies dan build aplikasi
npm install --production=false
npm run build
```

---

## 5. Langkah 4: Jalankan dengan PM2

Pastikan PM2 sudah terpasang, lalu jalankan AnatomiVerse:
```bash
# Jalankan via PM2
pm2 start server/index.mjs --name "anatomi-app"

# Simpan agar otomatis berjalan saat VPS reboot
pm2 save
pm2 startup
```

---

## 6. Langkah 5: Konfigurasi Nginx untuk `anatomi.apotiku.id`

Buat file konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/anatomi
```

Tempelkan konfigurasi berikut:
```nginx
upstream anatomi_upstream {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name anatomi.apotiku.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name anatomi.apotiku.id;

    # Menggunakan sertifikat SSL wildcard apotiku.id yang sudah aktif
    ssl_certificate /etc/letsencrypt/live/apotiku.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apotiku.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    access_log /var/log/nginx/anatomi_access.log;
    error_log /var/log/nginx/anatomi_error.log;

    client_max_body_size 50M;

    location / {
        proxy_pass http://anatomi_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Aktifkan konfigurasi Nginx dan reload:
```bash
sudo ln -sf /etc/nginx/sites-available/anatomi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> [!TIP]
> Jika sertifikat wildcard Let's Encrypt ingin diperbarui secara spesifik untuk subdomain ini, Anda juga bisa menjalankan:
> `sudo certbot --nginx -d anatomi.apotiku.id`

---

## 7. Verifikasi Hasil Deployment

Setelah langkah di atas dijalankan:
1. Buka browser ke **`https://anatomi.apotiku.id`**
2. Coba login siswa baru atau masuk ke Area Guru via PIN (`2025`).
3. Cek log server di VPS via `pm2 logs anatomi-app` untuk memastikan output:
   ```text
   [DB] Terhubung ke PostgreSQL database: postgresql://apotiku_user:******@localhost:5432/anatomi_db
   [DB] Memuat data siswa ke memori.
   ```
