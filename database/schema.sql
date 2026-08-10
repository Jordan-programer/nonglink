-- AgriLink database schema (MySQL 8+)

CREATE DATABASE IF NOT EXISTS agrilink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agrilink;

-- Regions: Angola's 18 provinces. Reference data for mapping users/farms/
-- products to a place, so demand/price models can be trained per region.
CREATE TABLE IF NOT EXISTS regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    latitude DECIMAL(9, 5),
    longitude DECIMAL(9, 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops: structured taxonomy replacing free-text product categories, so
-- "Milho"/"milho"/"Milho branco" aren't treated as different entities.
CREATE TABLE IF NOT EXISTS crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category ENUM('cereais', 'leguminosas', 'tuberculos', 'frutas', 'hortalicas', 'outros') NOT NULL,
    default_unit VARCHAR(30) NOT NULL DEFAULT 'kg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users: farmers, buyers, distributors, admins
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role ENUM('farmer', 'buyer', 'distributor', 'admin') NOT NULL DEFAULT 'farmer',
    region_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Farms owned by farmers, where sensors are installed and products come from
CREATE TABLE IF NOT EXISTS farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    owner_id INT NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    size_hectares DECIMAL(10, 2),
    region_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Marketplace listings
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    crop_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    unit VARCHAR(30) NOT NULL DEFAULT 'kg',
    price_per_unit DECIMAL(10, 2) NOT NULL,
    quantity_available DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id)
);

-- Safras: planting/harvest windows the farmer logs, so future demand
-- forecasting knows when new supply is expected to hit the market.
CREATE TABLE IF NOT EXISTS harvests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    crop_id INT NOT NULL,
    planted_at DATE NOT NULL,
    expected_harvest_at DATE NOT NULL,
    actual_harvest_at DATE,
    expected_quantity DECIMAL(10, 2),
    status ENUM('planted', 'growing', 'harvested', 'cancelled') NOT NULL DEFAULT 'planted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id)
);

-- Orders placed by buyers
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Price history: recorded on every listing (source=listing) and every
-- confirmed sale (source=sale), plus imported real external data
-- (source=external) — feeds the price forecasting model.
CREATE TABLE IF NOT EXISTS price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    region_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    source ENUM('listing', 'sale', 'external') NOT NULL,
    product_id INT,
    order_item_id INT,
    external_source_name VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id),
    FOREIGN KEY (region_id) REFERENCES regions(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    INDEX idx_price_crop_region (crop_id, region_id, recorded_at)
);

-- IoT sensors installed on farms
CREATE TABLE IF NOT EXISTS sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    type ENUM('soil_moisture', 'temperature', 'water_level', 'humidity') NOT NULL,
    label VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Time-series readings collected from sensors
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    value DECIMAL(10, 3) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE,
    INDEX idx_sensor_recorded (sensor_id, recorded_at)
);
