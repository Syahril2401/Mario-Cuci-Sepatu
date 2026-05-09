# Mario Booth Cuci Sepatu - Backend API

Proyek ini adalah backend (RESTful API) untuk aplikasi **Mario Booth Cuci Sepatu**, sebuah platform untuk mendigitalisasi operasional *laundry* sepatu. Modul ini berfokus pada fitur **Autentikasi** (Registrasi dan Login) dengan pembagian peran (*role*) antara `pelanggan` dan `admin`.

## 🚀 Teknologi yang Digunakan
* **Node.js** & **Express.js**: Framework untuk membangun server backend.
* **MySQL** (`mysql2`): Sistem manajemen database relasional.
* **Bcrypt**: Library untuk melakukan hashing (enkripsi) password pengguna.
* **JSON Web Token (JWT)**: Digunakan untuk manajemen sesi aman dan autentikasi.

---

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum menjalankan proyek ini, pastikan komputer Anda telah terinstal:
1. [Node.js](https://nodejs.org/) (Disarankan versi LTS).
2. [XAMPP](https://www.apachefriends.org/index.html) atau MySQL Server.
3. Aplikasi API Client seperti [Postman](https://www.postman.com/) atau Insomnia.

---

## ⚙️ Cara Instalasi & Menjalankan Aplikasi

Ikuti langkah-langkah di bawah ini untuk menjalankan API di komputer lokal Anda:

### 1. Instalasi Dependencies
Buka terminal/command prompt di dalam folder proyek ini, lalu jalankan perintah:
```bash
npm install
```

### 2. Setup Database
1. Buka aplikasi **XAMPP** dan jalankan modul **MySQL**.
2. Buka klien database Anda (seperti phpMyAdmin di `http://localhost/phpmyadmin` atau DBeaver).
3. Buat database baru atau langsung impor skema database yang telah disediakan dengan mengeksekusi isi dari file `database.sql`.
   *File `database.sql` akan otomatis membuat database `mario_laundry_db` dan tabel `users`.*

### 3. Konfigurasi Environment (Lingkungan)
1. Buka file `.env` yang ada di *root folder*.
2. Pastikan pengaturan di dalamnya sudah sesuai dengan konfigurasi MySQL Anda (biasanya bawaan XAMPP adalah `user=root` dan tanpa password).
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=mario_laundry_db
   DB_PORT=3306
   JWT_SECRET=rahasia_mario_cuci_sepatu_2024
   JWT_EXPIRES_IN=1d
   ```

### 4. Jalankan Server
Setelah database siap, jalankan aplikasi di mode *development*:
```bash
npm run dev
```
Jika berhasil, terminal akan menampilkan pesan:
> ` Server berjalan di http://localhost:5000`
> ` Berhasil terhubung ke database MySQL`

---

## 🔌 Dokumentasi API (Endpoints)

Gunakan file `postman_collection.json` dengan melakukan *Import* ke dalam Postman untuk langsung menguji API.

### 1. Registrasi Pengguna
* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Body Format**: `JSON`
* **Contoh Request Body**:
  ```json
  {
      "nama": "Budi Santoso",
      "email": "budi@gmail.com",
      "password": "password123",
      "role": "pelanggan"
  }
  ```
  *(Catatan: `role` bersifat opsional, defaultnya adalah `pelanggan`. Opsi lain adalah `admin`)*.

### 2. Login Pengguna
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Body Format**: `JSON`
* **Contoh Request Body**:
  ```json
  {
      "email": "budi@gmail.com",
      "password": "password123"
  }
  ```
* **Respons Sukses**: Mengembalikan status `200 OK` beserta **Token JWT** yang dapat digunakan untuk mengakses endpoint yang dilindungi nantinya.

---

## 📁 Struktur Folder
```text
MarioCuciSepatuBE/
│
├── src/
│   ├── config/
│   │   └── db.js               # Konfigurasi koneksi MySQL
│   ├── controllers/
│   │   └── authController.js   # Logika bisnis Registrasi & Login
│   ├── middlewares/
│   │   └── authMiddleware.js   # Middleware perlindungan JWT
│   ├── models/
│   │   └── userModel.js        # Eksekusi query database untuk User
│   └── routes/
│       └── authRoutes.js       # Definisi endpoint (URL) untuk autentikasi
│
├── .env                        # Variabel environment (Rahasia & DB Config)
├── database.sql                # Script untuk membuat tabel database
├── package.json                # Informasi proyek & daftar library
├── postman_collection.json     # File siap pakai untuk Postman
└── server.js                   # Titik masuk utama aplikasi (Entry Point)
```
