-- Sample data for local development
USE agrilink;

-- Coordinates are each province capital's real location (Open-Meteo/GeoNames
-- geocoding), used as the representative point for weather-based price
-- forecasting features.
INSERT INTO regions (name, latitude, longitude) VALUES
('Bengo', -8.57848, 13.66425),
('Benguela', -12.57674, 13.40268),
('Bié', -12.38333, 16.93333),
('Cabinda', -5.56198, 12.19476),
('Cuando Cubango', -14.6585, 17.69099),
('Cuanza Norte', -9.27519, 14.97724),
('Cuanza Sul', -11.20605, 13.84371),
('Cunene', -17.06667, 15.73333),
('Huambo', -12.77611, 15.73917),
('Huíla', -14.91717, 13.4925),
('Luanda', -8.83682, 13.23432),
('Lunda Norte', -7.36643, 20.81557),
('Lunda Sul', -9.66078, 20.39155),
('Malanje', -9.54015, 16.34096),
('Moxico', -11.78333, 19.91667),
('Namibe', -15.2612, 12.1468),
('Uíge', -7.60874, 15.06131),
('Zaire', -6.26667, 14.23833);

INSERT INTO crops (name, category, default_unit) VALUES
('Milho', 'cereais', 'kg'),
('Arroz', 'cereais', 'kg'),
('Feijão', 'leguminosas', 'kg'),
('Feijão-macunde', 'leguminosas', 'kg'),
('Amendoim', 'leguminosas', 'kg'),
('Mandioca', 'tuberculos', 'kg'),
('Batata-doce', 'tuberculos', 'kg'),
('Banana', 'frutas', 'kg'),
('Tomate', 'hortalicas', 'kg'),
('Cebola', 'hortalicas', 'kg'),
('Repolho', 'hortalicas', 'kg'),
('Café', 'outros', 'kg'),
('Cana-de-açúcar', 'outros', 'kg'),
('Girassol', 'outros', 'kg'),
('Outros', 'outros', 'kg');

-- password for both seed accounts: senha123
INSERT INTO users (name, email, hashed_password, phone, role, region_id) VALUES
('João Manuel', 'joao@example.com', '$2b$12$alw.BR00Gyn9fGMqzHhUkesnA5jYbyL.Z6LCeT7JNLTKejy.QSH0O', '923000001', 'farmer', (SELECT id FROM regions WHERE name = 'Huambo')),
('Maria Fernandes', 'maria@example.com', '$2b$12$alw.BR00Gyn9fGMqzHhUkesnA5jYbyL.Z6LCeT7JNLTKejy.QSH0O', '923000002', 'buyer', (SELECT id FROM regions WHERE name = 'Luanda'));

INSERT INTO farms (name, owner_id, location, latitude, longitude, size_hectares, region_id) VALUES
('Quinta do João', 1, 'Huambo, Angola', -12.7756, 15.7392, 3.5, (SELECT id FROM regions WHERE name = 'Huambo'));

INSERT INTO products (farm_id, crop_id, name, description, unit, price_per_unit, quantity_available) VALUES
(1, (SELECT id FROM crops WHERE name = 'Milho'), 'Milho', 'Milho fresco colhido este mês', 'kg', 250.00, 500),
(1, (SELECT id FROM crops WHERE name = 'Feijão'), 'Feijão', 'Feijão vermelho de alta qualidade', 'kg', 400.00, 200);

INSERT INTO sensors (farm_id, type, label) VALUES
(1, 'soil_moisture', 'Sensor Talhão 1'),
(1, 'temperature', 'Sensor Estação Central');
