-- Crear la tabla para los roles de usuario
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Crear la tabla para las empresas
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
);

-- Crear la tabla para los usuarios con roles y empresa
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id),
    empresa_id INT NOT NULL REFERENCES empresas(id)
);

-- Crear la tabla para los tags NFC, asociados a una empresa
CREATE TABLE IF NOT EXISTS nfc_tags (
    id SERIAL PRIMARY KEY,
    tag_id VARCHAR(255) NOT NULL UNIQUE,
    data TEXT,
    empresa_id INT NOT NULL REFERENCES empresas(id),
    public_url VARCHAR(255) -- **NUEVA COLUMNA AÑADIDA**
);

-- Crear la tabla para los taps NFC
CREATE TABLE IF NOT EXISTS nfc_taps (
    id SERIAL PRIMARY KEY,
    tag_id VARCHAR(255) NOT NULL, -- No es UNIQUE, un tag puede ser tapeado múltiples veces
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 o IPv6 del dispositivo que hace el tap
    user_agent TEXT, -- Información del navegador/sistema operativo del dispositivo
    location_data TEXT, -- Para datos de geolocalización si se implementa en el futuro
    empresa_id INT NOT NULL REFERENCES empresas(id) -- Asociar el tap a la empresa del tag
);

-- Opcional: Añadir índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_nfc_taps_tag_id ON nfc_taps (tag_id);
CREATE INDEX IF NOT EXISTS idx_nfc_taps_empresa_id ON nfc_taps (empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfc_taps_timestamp ON nfc_taps (timestamp DESC);


-- Precargar datos en la tabla roles
INSERT INTO roles (nombre) VALUES ('super_admin'), ('admin') ON CONFLICT (nombre) DO NOTHING;

-- Precargar datos en la tabla empresas
INSERT INTO empresas (nombre) VALUES ('Empresa A'), ('Empresa B') ON CONFLICT (nombre) DO NOTHING;

-- Precargar un usuario super_admin para la Empresa A (password: 'admin123')
-- El hash de 'admin123' fue generado con bcrypt.js
INSERT INTO usuarios (nombre, email, password_hash, rol_id, empresa_id) VALUES 
('Super Administrador A', 'admina@empresa.com', '$2b$10$dtYU6Fn/Y6cZw.2/zYWm3OCTAAKrFP/.7cPMbZwlvA0bMVD/njlje', 1, 1) ON CONFLICT (email) DO NOTHING;

-- Precargar un usuario admin para la Empresa B (password: 'admin123')
-- El hash de 'admin123' fue generado con bcrypt.js
INSERT INTO usuarios (nombre, email, password_hash, rol_id, empresa_id) VALUES 
('Administrador B', 'adminb@empresa.com', '$2b$10$dtYU6Fn/Y6cZw.2/zYWm3OCTAAKrFP/.7cPMbZwlvA0bMVD/njlje', 2, 2) ON CONFLICT (email) DO NOTHING;

INSERT INTO nfc_tags (tag_id, data, public_url, empresa_id)
VALUES ('04:2C:98:0B:BE:2A:81', 'Tag de Prueba para Google', 'https://www.lun.com/', 1);
