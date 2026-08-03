-- Sample data for local development
USE agrilink;

-- password for both seed accounts: senha123
INSERT INTO users (name, email, hashed_password, phone, role) VALUES
('João Manuel', 'joao@example.com', '$2b$12$alw.BR00Gyn9fGMqzHhUkesnA5jYbyL.Z6LCeT7JNLTKejy.QSH0O', '923000001', 'farmer'),
('Maria Fernandes', 'maria@example.com', '$2b$12$alw.BR00Gyn9fGMqzHhUkesnA5jYbyL.Z6LCeT7JNLTKejy.QSH0O', '923000002', 'buyer');

INSERT INTO farms (name, owner_id, location, latitude, longitude, size_hectares) VALUES
('Quinta do João', 1, 'Huambo, Angola', -12.7756, 15.7392, 3.5);

INSERT INTO products (farm_id, name, description, category, unit, price_per_unit, quantity_available) VALUES
(1, 'Milho', 'Milho fresco colhido este mês', 'cereais', 'kg', 250.00, 500),
(1, 'Feijão', 'Feijão vermelho de alta qualidade', 'leguminosas', 'kg', 400.00, 200);

INSERT INTO sensors (farm_id, type, label) VALUES
(1, 'soil_moisture', 'Sensor Talhão 1'),
(1, 'temperature', 'Sensor Estação Central');
