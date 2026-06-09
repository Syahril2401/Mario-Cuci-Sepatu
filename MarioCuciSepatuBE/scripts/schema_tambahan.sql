-- File referensi untuk tabel tambahan yang dibutuhkan backend

USE mario_laundry_db;

CREATE TABLE IF NOT EXISTS services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    serviceName VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- dalam hari
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promoCode VARCHAR(50) NOT NULL UNIQUE,
    percentage DECIMAL(5, 2) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    targetType ENUM('all', 'service', 'category') DEFAULT 'all',
    targetId INT NULL, -- ID service jika targetType = 'service'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(50) PRIMARY KEY, -- ex: ORD-123456789
    user_id VARCHAR(36) NOT NULL,
    service_id INT NOT NULL,
    pickup_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    pickupMethod VARCHAR(50),
    returnMethod VARCHAR(50),
    address TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    is_overflow_order BOOLEAN DEFAULT FALSE,
    auto_shifted BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(service_id)
);

-- Menyisipkan data layanan awal (sebagai contoh)
INSERT IGNORE INTO services (service_id, serviceName, description, duration, price, image) VALUES 
(1, 'Basic Cleaning', 'Standard shoe cleaning', 2, 50000, 'https://via.placeholder.com/150'),
(2, 'Deep Cleaning', 'Deep clean for dirty shoes', 3, 100000, 'https://via.placeholder.com/150');
