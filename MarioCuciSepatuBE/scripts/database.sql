-- =========================================================
-- SCHEMA MARIO CUCI SEPATU - 3NF NORMALIZED
-- =========================================================
-- Normalisasi:
-- 1. order_photos    → gabungan photo_customers + photo_admins
-- 2. fulfillment_methods → tabel master metode pickup/return
-- 3. order_details   → junction tabel items per order (service + qty)
-- 4. payments        → tabel pembayaran terpisah
-- 5. orders          → dibersihkan dari kolom foto, duplikat, transitive
-- =========================================================

CREATE DATABASE IF NOT EXISTS mario_laundry_db;
USE mario_laundry_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_photos;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_details;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_statuses;
DROP TABLE IF EXISTS fulfillment_methods;
DROP TABLE IF EXISTS promos;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================
-- 1. ROLES
-- =====================
CREATE TABLE roles (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles (role_id, role_name) VALUES
  (1, 'admin'),
  (2, 'customer');

-- =====================
-- 2. USERS
-- =====================
CREATE TABLE users (
    user_id      INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    role_id      INT NOT NULL DEFAULT 2,
    phone        VARCHAR(20),
    address      TEXT,           -- JSON array alamat (pragmatic: tetap disini)
    profileImage LONGTEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- =====================
-- 3. SERVICES
-- =====================
CREATE TABLE services (
    service_id  INT AUTO_INCREMENT PRIMARY KEY,
    serviceName VARCHAR(255) NOT NULL,
    description TEXT,
    duration    INT NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    image       LONGTEXT,
    type        VARCHAR(50) DEFAULT 'sepatu',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO services (service_id, serviceName, description, duration, price, image) VALUES
  (1, 'Basic Cleaning', 'Standard shoe cleaning', 2, 50000, NULL),
  (2, 'Deep Cleaning',  'Deep clean for dirty shoes', 3, 100000, NULL);

-- =====================
-- 4. PROMOS
-- =====================
CREATE TABLE promos (
    promo_id   INT AUTO_INCREMENT PRIMARY KEY,
    promoCode  VARCHAR(50) NOT NULL UNIQUE,
    promoName  VARCHAR(100),
    percentage DECIMAL(5,2) NOT NULL,
    startDate  DATE NOT NULL,
    endDate    DATE NOT NULL,
    status     ENUM('active', 'inactive') DEFAULT 'active',
    targetType ENUM('all', 'service', 'category') DEFAULT 'all',
    targetId   INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (targetId) REFERENCES services(service_id) ON DELETE SET NULL
);

-- =====================
-- 5. ORDER STATUSES
-- =====================
CREATE TABLE order_statuses (
    status_id   INT AUTO_INCREMENT PRIMARY KEY,
    status_code VARCHAR(50) NOT NULL UNIQUE,
    status_name VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO order_statuses (status_code, status_name) VALUES
  ('PENDING',              'Menunggu'),
  ('WAITING_VERIFICATION', 'Menunggu Verifikasi Pembayaran'),
  ('WAITING_DROP_OFF',     'Menunggu Pengantaran Barang'),
  ('WAITING_PICKUP',       'Menunggu Pickup Admin'),
  ('STORE_RECEIVED',       'Barang Sudah Diterima Toko'),
  ('PICKED_UP_BY_ADMIN',   'Barang Sudah Diambil Admin'),
  ('PROCESSING',           'Sedang Diproses'),
  ('READY_PICKUP',         'Siap Diambil Customer'),
  ('CUSTOMER_PICKED_UP',   'Sudah Diambil Customer'),
  ('READY_DELIVERY',       'Siap Dikirim'),
  ('ON_DELIVERY',          'Dalam Perjalanan'),
  ('RECEIVED',             'Sudah Diterima'),
  ('FINISHED',             'Selesai'),
  ('CANCELLED',            'Dibatalkan');

-- =====================
-- 6. FULFILLMENT METHODS (normalisasi pickupMethod & returnMethod)
-- =====================
CREATE TABLE fulfillment_methods (
    method_id   INT AUTO_INCREMENT PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO fulfillment_methods (method_id, method_name) VALUES
  (1, 'SELF_DROP'),
  (2, 'HOME_PICKUP'),
  (3, 'SELF_PICKUP'),
  (4, 'HOME_DELIVERY');

-- =====================
-- 7. ORDERS (tabel utama - sudah dibersihkan)
-- Dihapus dari tabel ini:
--   - service_id, quantity  → pindah ke order_details
--   - pickupMethod, returnMethod (TEXT) → diganti FK ke fulfillment_methods
--   - photo_customer_id, photo_admin_*_id → diganti ke order_photos
--   - pickup_photo_time, received_photo_time, delivery_photo_time → ke order_photos.uploaded_at
--   - photos (LONGTEXT duplikat) → dihapus
--   - promoName (transitive) → dihapus, ambil dari JOIN promos
--   - payment_method, payment_status → pindah ke tabel payments
-- =====================
CREATE TABLE orders (
    order_id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    status_id         INT NOT NULL,
    promo_id          INT NULL,
    pickup_method_id  INT NOT NULL,
    return_method_id  INT NOT NULL,
    pickup_date       DATE NOT NULL,
    delivery_date     DATE,
    shipping_address  TEXT,           -- snapshot alamat saat order dibuat
    notes             TEXT,
    total_price       DECIMAL(12,2) NOT NULL DEFAULT 0,
    originalPrice     DECIMAL(12,2),
    discountAmount    DECIMAL(12,2),
    is_overflow_order BOOLEAN DEFAULT FALSE,
    auto_shifted      BOOLEAN DEFAULT FALSE,
    order_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)          REFERENCES users(user_id),
    FOREIGN KEY (status_id)        REFERENCES order_statuses(status_id),
    FOREIGN KEY (promo_id)         REFERENCES promos(promo_id) ON DELETE SET NULL,
    FOREIGN KEY (pickup_method_id) REFERENCES fulfillment_methods(method_id),
    FOREIGN KEY (return_method_id) REFERENCES fulfillment_methods(method_id)
);

-- =====================
-- 8. ORDER_DETAILS (junction tabel: satu order bisa berisi banyak item)
-- Dibersihkan dari: pickup_method_id, return_method_id, alamat, photoCust, dropDate, pickupDate, notes
-- =====================
CREATE TABLE order_details (
    detail_id  INT AUTO_INCREMENT PRIMARY KEY,
    order_id   INT NOT NULL,
    service_id INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1,
    subtotal   DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id)
);

-- =====================
-- 9. PAYMENTS (tabel pembayaran terpisah)
-- =====================
CREATE TABLE payments (
    payment_id     INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL UNIQUE,
    amount         DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'QRIS',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- =====================
-- 10. ORDER_PHOTOS (gabungan photo_customers + photo_admins)
-- photo_type: 'CHECKOUT'=foto dari customer saat checkout
--             'PICKUP_PHOTO'=admin ambil barang, 'RECEIVED_PHOTO'=barang diterima toko
--             'DELIVERY_PHOTO'=saat dikirim balik, 'PROOF_IMAGE'=bukti selesai cuci
-- =====================
CREATE TABLE order_photos (
    photo_id    INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT NOT NULL,
    user_id     INT NOT NULL,
    photo_type  ENUM('CHECKOUT', 'PICKUP_PHOTO', 'RECEIVED_PHOTO', 'PROOF_IMAGE', 'DELIVERY_PHOTO') NOT NULL,
    photo_data  LONGTEXT NOT NULL,   -- base64 encoded image
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_photos_order_id (order_id),
    UNIQUE KEY uq_order_photo_type (order_id, photo_type),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(user_id)
);
