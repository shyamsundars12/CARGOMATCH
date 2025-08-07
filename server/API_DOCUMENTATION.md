# LSP (Logistics Service Provider) API Documentation

## Overview
This document describes the RESTful API endpoints for the LSP module of the logistics booking platform.

## Base URL
```
http://localhost:5000/api/lsp
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Authentication & Profile Management

#### Register LSP
```http
POST /register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@lsp.com",
  "password": "password123",
  "confirmPassword": "password123",
  "company_name": "ABC Logistics",
  "pan_number": "ABCDE1234F",
  "gst_number": "22AAAAA0000A1Z5",
  "company_registration": "REG123456",
  "phone": "+1234567890",
  "address": "123 Logistics St, City, Country",
  "business_license": "LIC123456",
  "insurance_certificate": "INS123456"
}
```

**Response:**
```json
{
  "message": "LSP registered successfully. Pending admin approval.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@lsp.com",
    "role": "lsp"
  },
  "profile": {
    "id": 1,
    "user_id": 1,
    "company_name": "ABC Logistics",
    "verification_status": "pending",
    "is_verified": false
  }
}
```

#### Login LSP
```http
POST /login
```

**Request Body:**
```json
{
  "email": "john@lsp.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@lsp.com",
    "role": "lsp"
  },
  "profile": {
    "id": 1,
    "company_name": "ABC Logistics",
    "is_verified": true
  }
}
```

#### Get LSP Profile
```http
GET /profile
Authorization: Bearer <token>
```

#### Update LSP Profile
```http
PUT /profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "company_name": "Updated Logistics Co",
  "phone": "+1234567890",
  "address": "456 New Address St",
  "business_license": "NEW_LIC123",
  "insurance_certificate": "NEW_INS123"
}
```

### 2. Container Management

#### Create Container
```http
POST /containers
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "container_type_id": 1,
  "container_number": "CONT001",
  "size": "40ft",
  "type": "Standard",
  "capacity": 67.7,
  "current_location": "Mumbai Port",
  "departure_date": "2024-02-15",
  "arrival_date": "2024-02-25",
  "origin_port": "Mumbai",
  "destination_port": "Singapore",
  "route_description": "Mumbai to Singapore via sea route",
  "price_per_unit": 2500.00,
  "currency": "USD"
}
```

#### Get Containers
```http
GET /containers
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by container status (available, booked, in_transit, etc.)
- `is_available`: Filter by availability (true/false)
- `type`: Filter by container type
- `size`: Filter by container size

#### Get Container by ID
```http
GET /containers/:id
Authorization: Bearer <token>
```

#### Update Container
```http
PUT /containers/:id
Authorization: Bearer <token>
```

#### Delete Container
```http
DELETE /containers/:id
Authorization: Bearer <token>
```

### 3. Booking Management

#### Get Bookings
```http
GET /bookings
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by booking status (pending, approved, closed, etc.)
- `container_id`: Filter by container ID

#### Get Booking by ID
```http
GET /bookings/:id
Authorization: Bearer <token>
```

#### Update Booking Status
```http
PUT /bookings/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "approved"
}
```

### 4. Shipment Management

#### Get Shipments
```http
GET /shipments
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by shipment status (scheduled, in_transit, delivered, closed)
- `booking_id`: Filter by booking ID

#### Update Shipment Status
```http
PUT /shipments/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "in_transit",
  "location": "Singapore Port",
  "description": "Container loaded and departed from Mumbai"
}
```

### 5. Complaint Management

#### Get Complaints
```http
GET /complaints
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by complaint status (open, in_progress, resolved, closed)
- `priority`: Filter by priority (low, medium, high)

#### Resolve Complaint
```http
PUT /complaints/:id/resolve
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "resolved",
  "resolution": "Issue has been addressed and resolved"
}
```

### 6. Notification Management

#### Get Notifications
```http
GET /notifications
Authorization: Bearer <token>
```

**Query Parameters:**
- `is_read`: Filter by read status (true/false)
- `type`: Filter by notification type
- `limit`: Limit number of notifications returned

#### Mark Notification as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

### 7. Utility Endpoints

#### Get Container Types
```http
GET /container-types
Authorization: Bearer <token>
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Cron Jobs

The system includes automated cron jobs:

1. **Booking Auto-Closure**: Runs daily at 6 AM UTC to close bookings 1 day before departure
2. **Shipment Status Updates**: Runs every 4 hours to update shipment statuses
3. **Reminder Notifications**: Runs daily at 9 AM UTC to send reminder notifications

## Database Schema

The system uses the following main tables:
- `users`: User accounts with role-based access
- `lsp_profiles`: LSP-specific profile information
- `containers`: Container listings with availability and pricing
- `bookings`: Booking records linking containers to importers/exporters
- `shipments`: Shipment tracking with status updates
- `complaints`: Complaint management system
- `notifications`: Notification system for updates

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- Password hashing using bcrypt

## Rate Limiting

Consider implementing rate limiting for production use to prevent abuse.

## Testing

Use tools like Postman or curl to test the API endpoints. Make sure to:
1. Register an LSP account first
2. Use the returned JWT token for authenticated requests
3. Test all CRUD operations for containers, bookings, and shipments 