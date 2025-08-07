-- Database Schema for Logistics Service Provider (LSP) Module

-- Users table (extends existing user system)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LSP Profiles table
CREATE TABLE IF NOT EXISTS lsp_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    pan_number VARCHAR(20) UNIQUE NOT NULL,
    gst_number VARCHAR(20) UNIQUE NOT NULL,
    company_registration VARCHAR(50),
    phone VARCHAR(20),
    address TEXT,
    business_license VARCHAR(100),
    insurance_certificate VARCHAR(100),
    gst_certificate_path TEXT,
    company_registration_doc_path TEXT,
    business_license_doc_path TEXT,
    insurance_certificate_doc_path TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Container Types table
CREATE TABLE IF NOT EXISTS container_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    capacity DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Containers table
CREATE TABLE IF NOT EXISTS containers (
    id SERIAL PRIMARY KEY,
    lsp_id INTEGER REFERENCES lsp_profiles(id) ON DELETE CASCADE,
    container_type_id INTEGER REFERENCES container_types(id),
    container_number VARCHAR(50) UNIQUE NOT NULL,
    size VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    current_location VARCHAR(255),
    departure_date DATE,
    arrival_date DATE,
    origin_port VARCHAR(100),
    destination_port VARCHAR(100),
    route_description TEXT,
    price_per_unit DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
    importer_id INTEGER REFERENCES users(id),
    exporter_id INTEGER REFERENCES users(id),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    departure_date DATE NOT NULL,
    arrival_date DATE NOT NULL,
    cargo_type VARCHAR(100),
    cargo_weight DECIMAL(10,2),
    cargo_volume DECIMAL(10,2),
    special_requirements TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    is_auto_approved BOOLEAN DEFAULT true,
    approved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    container_id INTEGER REFERENCES containers(id),
    lsp_id INTEGER REFERENCES lsp_profiles(id),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    current_location VARCHAR(255),
    departure_port VARCHAR(100),
    arrival_port VARCHAR(100),
    actual_departure_date TIMESTAMP,
    actual_arrival_date TIMESTAMP,
    estimated_arrival_date TIMESTAMP,
    tracking_updates JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipment Status History table
CREATE TABLE IF NOT EXISTS shipment_status_history (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    container_id INTEGER REFERENCES containers(id),
    lsp_id INTEGER REFERENCES lsp_profiles(id),
    complainant_id INTEGER REFERENCES users(id),
    complaint_type VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    resolution TEXT,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default container types
INSERT INTO container_types (type_name, size, capacity, description) VALUES
('Standard', '20ft', 33.2, 'Standard 20-foot container'),
('Standard', '40ft', 67.7, 'Standard 40-foot container'),
('High Cube', '40ft', 76.3, 'High cube 40-foot container'),
('Refrigerated', '20ft', 30.1, 'Refrigerated 20-foot container'),
('Refrigerated', '40ft', 67.5, 'Refrigerated 40-foot container'),
('Open Top', '20ft', 32.6, 'Open top 20-foot container'),
('Open Top', '40ft', 66.7, 'Open top 40-foot container'),
('Flat Rack', '20ft', 28.0, 'Flat rack 20-foot container'),
('Flat Rack', '40ft', 40.0, 'Flat rack 40-foot container')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_containers_lsp_id ON containers(lsp_id);
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
CREATE INDEX IF NOT EXISTS idx_bookings_container_id ON bookings(container_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_shipments_booking_id ON shipments(booking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_complaints_lsp_id ON complaints(lsp_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read); 