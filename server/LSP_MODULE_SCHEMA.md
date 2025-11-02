# CargoMatch LSP Module Database Schema

## Overview
This document provides the complete database schema for the CargoMatch LSP (Logistics Service Provider) module, extracted from the Neon DB cloud database.

## Core Tables

### 1. Users Table
**Purpose**: Stores all user accounts (Traders, LSPs, Admins)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    company_name VARCHAR(255),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    company_registration VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'pending',
    profile_image_url VARCHAR(500),
    fcm_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'trader',
    approval_status VARCHAR(20) DEFAULT 'pending',
    iec_number VARCHAR(20),
    pan_document_path TEXT,
    gst_document_path TEXT,
    iec_document_path TEXT,
    company_registration_document_path TEXT
);
```

**Key Fields for Mobile App**:
- `id`: Primary key for user identification
- `email`: Login credential
- `password_hash`: Encrypted password
- `first_name`, `last_name`: User's full name
- `phone_number`: Contact information
- `company_name`: Business name
- `gst_number`, `pan_number`, `iec_number`: Tax identification numbers
- `address`, `city`, `state`, `pincode`, `country`: Complete address
- `verification_status`: 'pending', 'verified', 'rejected'
- `approval_status`: 'pending', 'approved', 'rejected'
- `role`: 'trader', 'lsp', 'admin'
- `fcm_token`: For push notifications
- Document paths: URLs to uploaded verification documents

### 2. LSP Profiles Table
**Purpose**: Extended profile information for Logistics Service Providers

```sql
CREATE TABLE lsp_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    pan_number VARCHAR(20),
    gst_number VARCHAR(20),
    company_registration VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    business_license VARCHAR(255),
    insurance_certificate VARCHAR(255),
    gst_certificate_path VARCHAR(500),
    company_registration_doc_path VARCHAR(500),
    business_license_doc_path VARCHAR(500),
    insurance_certificate_doc_path VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Mobile App**:
- `user_id`: Links to users table
- `company_name`: LSP business name
- `business_license`: License number
- `insurance_certificate`: Insurance details
- Document paths: URLs to uploaded certificates
- `is_verified`: Admin verification status
- `verification_status`: 'pending', 'approved', 'rejected'

### 3. Container Types Table
**Purpose**: Master data for different container types

```sql
CREATE TABLE container_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    size VARCHAR(50),
    capacity NUMERIC,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Mobile App**:
- `id`: Container type identifier
- `type_name`: Type name (e.g., "Dry Container", "Refrigerated")
- `size`: Container size (e.g., "20ft", "40ft")
- `capacity`: Maximum weight/volume capacity

### 4. Containers Table
**Purpose**: Individual container listings by LSPs

```sql
CREATE TABLE containers (
    id SERIAL PRIMARY KEY,
    lsp_id INTEGER REFERENCES lsp_profiles(id),
    container_type_id INTEGER REFERENCES container_types(id),
    container_number VARCHAR(100) NOT NULL UNIQUE,
    size VARCHAR(50),
    type VARCHAR(100),
    capacity NUMERIC,
    current_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    is_available BOOLEAN DEFAULT true,
    departure_date TIMESTAMP,
    arrival_date TIMESTAMP,
    origin_port VARCHAR(255),
    destination_port VARCHAR(255),
    route_description TEXT,
    price_per_unit NUMERIC,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    length NUMERIC,
    width NUMERIC,
    height NUMERIC,
    weight NUMERIC
);
```

**Key Fields for Mobile App**:
- `id`: Container identifier
- `lsp_id`: Owner LSP
- `container_number`: Unique container identifier
- `size`, `type`: Container specifications
- `capacity`: Available capacity
- `current_location`: Current position
- `status`: 'available', 'booked', 'in_transit', 'delivered'
- `is_available`: Boolean availability
- `origin_port`, `destination_port`: Route endpoints
- `price_per_unit`: Pricing information
- `currency`: Currency code
- `length`, `width`, `height`, `weight`: Physical dimensions

### 5. Bookings Table
**Purpose**: Booking requests from traders to LSPs

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    container_id INTEGER REFERENCES containers(id),
    lsp_id INTEGER REFERENCES lsp_profiles(id),
    weight NUMERIC,
    volume NUMERIC,
    booked_units INTEGER DEFAULT 1,
    total_price NUMERIC,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    tracking_number VARCHAR(255),
    notes TEXT,
    shipment_details JSONB,
    documents JSONB,
    booking_date TIMESTAMP DEFAULT NOW(),
    departure_date TIMESTAMP,
    arrival_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Mobile App**:
- `id`: Booking identifier
- `user_id`: Trader who made the booking
- `container_id`: Booked container
- `lsp_id`: LSP providing the service
- `weight`, `volume`: Cargo specifications
- `booked_units`: Number of units booked
- `total_price`: Total booking cost
- `status`: 'pending', 'confirmed', 'cancelled', 'completed'
- `payment_status`: 'pending', 'paid', 'failed', 'refunded'
- `tracking_number`: Unique tracking identifier
- `shipment_details`: JSON with cargo details
- `documents`: JSON with uploaded documents
- `booking_date`: When booking was made
- `departure_date`, `arrival_date`: Schedule dates

### 6. Shipments Table
**Purpose**: Active shipments created from bookings

```sql
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    container_id INTEGER REFERENCES containers(id),
    lsp_id INTEGER REFERENCES lsp_profiles(id),
    user_id INTEGER REFERENCES users(id),
    tracking_number VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    current_status VARCHAR(100),
    current_location VARCHAR(255),
    latitude NUMERIC,
    longitude NUMERIC,
    last_updated TIMESTAMP DEFAULT NOW(),
    scheduled_departure TIMESTAMP,
    actual_departure TIMESTAMP,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Mobile App**:
- `id`: Shipment identifier
- `booking_id`: Source booking
- `tracking_number`: Unique tracking code
- `status`: 'pending', 'in_transit', 'delivered', 'delayed'
- `current_status`: Detailed status description
- `current_location`: Current position
- `latitude`, `longitude`: GPS coordinates
- `last_updated`: Last status update time
- `scheduled_departure`, `actual_departure`: Departure times
- `estimated_arrival`, `actual_arrival`: Arrival times
- `metadata`: Additional shipment data

### 7. Shipment Status History Table
**Purpose**: Track status changes over time

```sql
CREATE TABLE shipment_status_history (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Mobile App**:
- `id`: History record identifier
- `shipment_id`: Related shipment
- `status`: Status at this point in time
- `location`: Location when status changed
- `description`: Additional details
- `updated_by`: Who updated the status
- `created_at`: When status was updated

### 8. Shipment Events Table
**Purpose**: Real-time events and milestones

```sql
CREATE TABLE shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending',
    notes TEXT,
    metadata JSONB
);
```

**Key Fields for Mobile App**:
- `id`: Event identifier (UUID)
- `shipment_id`: Related shipment (UUID)
- `title`: Event title
- `description`: Event details
- `location`: Where event occurred
- `timestamp`: When event happened
- `status`: Event status
- `notes`: Additional information
- `metadata`: Extra event data

### 9. Complaints Table
**Purpose**: Handle disputes and issues

```sql
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    booking_id INTEGER REFERENCES bookings(id),
    lsp_id INTEGER REFERENCES lsp_profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    attachments JSONB,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields for Mobile App**:
- `id`: Complaint identifier
- `user_id`: Complainant
- `booking_id`: Related booking
- `lsp_id`: LSP being complained about
- `title`: Complaint title
- `description`: Detailed complaint
- `category`: Complaint type
- `priority`: 'low', 'medium', 'high', 'urgent'
- `status`: 'open', 'in_progress', 'resolved', 'closed'
- `attachments`: JSON with file attachments
- `resolved_at`: Resolution timestamp

## Data Relationships

### Primary Relationships:
1. **Users** → **LSP Profiles** (1:1 for LSPs)
2. **LSP Profiles** → **Containers** (1:many)
3. **Users** → **Bookings** (1:many for Traders)
4. **Containers** → **Bookings** (1:many)
5. **Bookings** → **Shipments** (1:1)
6. **Shipments** → **Shipment Status History** (1:many)
7. **Shipments** → **Shipment Events** (1:many)
8. **Users** → **Complaints** (1:many)

### Key Indexes:
- `users.email` (UNIQUE)
- `containers.container_number` (UNIQUE)
- `shipments.tracking_number` (UNIQUE)
- `bookings_pkey`, `containers_pkey`, `shipments_pkey`, etc.

## Current Data Counts:
- **Users**: 62 records
- **LSP Profiles**: 17 records
- **Containers**: 251 records
- **Bookings**: 310 records
- **Shipments**: 283 records
- **Complaints**: 17 records
- **Container Types**: 52 records

## Mobile App Integration Points:

### For Trader Mobile App:
1. **User Registration**: Use `users` table with trader role
2. **Document Upload**: Store paths in document_path fields
3. **Container Search**: Query `containers` table with filters
4. **Booking Creation**: Insert into `bookings` table
5. **Shipment Tracking**: Query `shipments` and `shipment_status_history`
6. **Complaint Submission**: Insert into `complaints` table

### For LSP Mobile App:
1. **LSP Registration**: Use `users` + `lsp_profiles` tables
2. **Container Management**: CRUD operations on `containers` table
3. **Booking Management**: Query `bookings` for incoming requests
4. **Shipment Management**: CRUD operations on `shipments` table
5. **Status Updates**: Insert into `shipment_status_history`

### Common Fields for Mobile Apps:
- **Authentication**: `email`, `password_hash`
- **Profile**: `first_name`, `last_name`, `phone_number`, `company_name`
- **Address**: `address`, `city`, `state`, `pincode`, `country`
- **Documents**: Various `*_document_path` fields
- **Status Tracking**: `verification_status`, `approval_status`
- **Notifications**: `fcm_token`
- **Timestamps**: `created_at`, `updated_at`

This schema provides a complete foundation for both trader and LSP mobile applications with proper relationships, constraints, and data integrity.
