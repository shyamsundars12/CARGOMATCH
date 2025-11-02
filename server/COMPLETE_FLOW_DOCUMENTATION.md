# Complete Container & Booking Flow Implementation

## Overview
This document outlines the complete flow for container creation, approval, and booking management in the CargoMatch platform.

## Flow Architecture

### 1. LSP Container Creation Flow

**Endpoint:** `POST /api/lsp/containers`

**Steps:**
1. LSP creates a container with required details:
   - Container number (unique)
   - Container type, size, capacity
   - Origin and destination ports
   - Departure and arrival dates
   - Pricing information
   - Dimensions (length, width, height, weight)
   - Documents (optional JSONB)

2. **Auto-set on creation:**
   - `container_approval_status = 'pending'` (required for admin approval)
   - `is_available = true` (default, but won't be visible to traders until approved)
   - `status = 'available'` (default)

3. **Container is NOT visible to traders until admin approves**

**Implementation:** `server/src/repository/lspRepository.js::createContainer()`

---

### 2. Admin Container Approval Flow

**Endpoints:**
- `GET /api/admin/containers/pending` - View pending containers
- `GET /api/admin/containers/:id` - View container details
- `PUT /api/admin/containers/:id/approve` - Approve container
- `PUT /api/admin/containers/:id/reject` - Reject container

**Steps:**
1. Admin views pending containers in "Container Approval" section
2. Admin reviews container details and documents
3. Admin can:
   - **Approve:** Sets `container_approval_status = 'approved'` AND `is_available = true`
   - **Reject:** Sets `container_approval_status = 'rejected'` with rejection reason

4. **After approval:**
   - Container becomes visible to traders via `/api/trader/containers/search`
   - Container appears in search results
   - Traders can book the container

**Implementation:** 
- `server/src/repository/adminRepository.js::approveContainer()`
- `server/src/repository/adminRepository.js::rejectContainer()`

---

### 3. Trader Container Search & Booking Flow

**Endpoints:**
- `GET /api/trader/containers/search` - Search approved containers (PUBLIC)
- `GET /api/trader/containers/:id` - Get container details
- `POST /api/trader/bookings` - Create booking (REQUIRES AUTH)
- `GET /api/trader/bookings` - Get trader's own bookings (REQUIRES AUTH)
- `GET /api/trader/bookings/:id` - Get booking details (REQUIRES AUTH)

**Search Filters:**
- `origin_port` - Origin port name
- `destination_port` - Destination port name
- `container_type_id` - Container type ID
- `size` - Container size (e.g., "20ft", "40ft")
- `type` - Container type name
- `departure_date` - Specific departure date
- `min_price` / `max_price` - Price range

**Query Logic:**
```sql
WHERE c.container_approval_status = 'approved' 
  AND c.is_available = true
  AND (c.departure_date IS NULL OR c.departure_date >= CURRENT_DATE)
```

**Booking Creation:**
1. Trader selects an approved container
2. Trader provides:
   - Weight and volume requirements
   - Number of units to book
   - Optional notes and documents
3. System calculates total price: `price_per_unit * booked_units`
4. Booking created with `status = 'pending'` and `payment_status = 'pending'`

**Implementation:**
- `server/src/repository/traderRepository.js::getApprovedContainersForTraders()`
- `server/src/repository/traderRepository.js::createBooking()`

---

### 4. LSP Booking Management Flow

**Endpoints:**
- `GET /api/lsp/bookings` - Get LSP's own bookings (FILTERED BY LSP ID)
- `GET /api/lsp/bookings/:id` - Get booking details
- `PUT /api/lsp/bookings/:id/status` - Update booking status

**Query Logic:**
```sql
FROM bookings b
JOIN containers c ON b.container_id = c.id
WHERE c.lsp_id = $1  -- Only bookings for LSP's containers
```

**Features:**
- LSP sees ONLY bookings for containers they own
- Can filter by status, container_id
- Can update booking status (pending, confirmed, cancelled, completed)
- Can view trader details (name, email)

**Implementation:** `server/src/repository/lspRepository.js::getBookingsByLSP()`

---

### 5. Admin Booking Management Flow

**Endpoints:**
- `GET /api/admin/bookings` - Get ALL bookings (NO FILTERING)
- `GET /api/admin/bookings/:id` - Get booking details

**Query Logic:**
```sql
FROM bookings b
JOIN containers c ON b.container_id = c.id
-- NO WHERE clause filtering by LSP - admin sees everything
ORDER BY b.created_at DESC
```

**Features:**
- Admin sees ALL bookings across all LSPs
- Can view:
  - Container details
  - LSP company information
  - Trader (user) information
  - Booking status and payment status
  - Booking dates and amounts

**Implementation:** `server/src/repository/adminRepository.js::fetchAllBookings()`

---

## Data Flow Diagram

```
┌─────────────────┐
│   LSP Creates   │
│    Container    │
│  (status:       │
│   pending)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Reviews  │
│   & Approves    │
│  (status:       │
│   approved)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Container       │──────▶│  Traders     │
│ Visible to      │      │  Search &    │
│ Traders         │      │  Book        │
└────────┬────────┘      └──────┬───────┘
         │                      │
         │                      ▼
         │              ┌──────────────┐
         │              │   Booking    │
         │              │   Created    │
         │              └──────┬───────┘
         │                     │
         ├─────────────────────┼─────────────┐
         │                     │             │
         ▼                     ▼             ▼
┌──────────────┐      ┌──────────────┐ ┌──────────────┐
│   LSP Views  │      │  Trader      │ │  Admin       │
│ Own Bookings │      │ Views Own    │ │ Views All    │
│              │      │ Bookings     │ │ Bookings     │
└──────────────┘      └──────────────┘ └──────────────┘
```

---

## Key Database Constraints

### Containers Table
- `container_approval_status`: `'pending'` | `'approved'` | `'rejected'`
- `is_available`: `BOOLEAN` - Must be `true` for traders to see
- **Trader Visibility:** Requires BOTH `container_approval_status = 'approved'` AND `is_available = true`

### Bookings Table
- `user_id`: References trader (user) who made the booking
- `container_id`: References container being booked
- `lsp_id`: References LSP who owns the container (for easy filtering)
- `status`: `'pending'` | `'confirmed'` | `'cancelled'` | `'completed'`
- `payment_status`: `'pending'` | `'paid'` | `'failed'` | `'refunded'`

---

## API Endpoints Summary

### Traders (Mobile App)
- `GET /api/trader/containers/search` - Search approved containers
- `GET /api/trader/containers/:id` - Get container details
- `POST /api/trader/bookings` - Create booking (requires auth)
- `GET /api/trader/bookings` - Get my bookings (requires auth)
- `GET /api/trader/bookings/:id` - Get booking details (requires auth)

### LSP (Web Dashboard)
- `POST /api/lsp/containers` - Create container
- `GET /api/lsp/containers` - Get my containers
- `GET /api/lsp/bookings` - Get bookings for my containers
- `PUT /api/lsp/bookings/:id/status` - Update booking status

### Admin (Web Dashboard)
- `GET /api/admin/containers/pending` - View pending containers
- `PUT /api/admin/containers/:id/approve` - Approve container
- `PUT /api/admin/containers/:id/reject` - Reject container
- `GET /api/admin/containers/approved` - View all approved containers
- `GET /api/admin/bookings` - View all bookings

---

## Security & Validation

### Container Creation
- LSP must be authenticated and verified
- Container number must be unique
- Required fields validated
- Dates validated (departure < arrival)

### Container Approval
- Only admins can approve/reject
- Container must be in 'pending' status
- Rejection requires a reason

### Booking Creation
- Trader must be authenticated
- Container must be approved and available
- Capacity validation (if implemented)
- Numeric fields validated (weight, volume, units)

### Booking Access
- LSP sees only bookings for their containers (`c.lsp_id = $1`)
- Traders see only their own bookings (`b.user_id = $1`)
- Admin sees all bookings (no filtering)

---

## Testing Checklist

✅ LSP creates container → Status is 'pending'  
✅ Admin approves container → Status is 'approved', `is_available = true`  
✅ Trader searches containers → Only sees approved containers  
✅ Trader creates booking → Booking created successfully  
✅ LSP views bookings → Only sees bookings for their containers  
✅ Admin views bookings → Sees all bookings  
✅ Container rejection → Container not visible to traders  

---

## Files Modified/Created

### Created:
- `server/src/routes/traderRoutes.js` - Trader API routes
- `server/src/controllers/traderController.js` - Trader request handlers
- `server/src/services/traderService.js` - Trader business logic
- `server/src/repository/traderRepository.js` - Trader database queries

### Modified:
- `server/src/repository/lspRepository.js` - Fixed container creation query
- `server/src/repository/adminRepository.js` - Set `is_available = true` on approval
- `server/server.js` - Added trader routes

---

## Notes

1. **Mobile App Integration:** The `/api/trader/*` endpoints are designed for mobile app consumption. Search endpoint is public, but booking endpoints require authentication.

2. **Container Visibility:** Containers are only visible to traders when BOTH conditions are met:
   - `container_approval_status = 'approved'`
   - `is_available = true`

3. **Booking Ownership:** 
   - LSP bookings filtered by `containers.lsp_id`
   - Trader bookings filtered by `bookings.user_id`
   - Admin sees everything

4. **Future Enhancements:**
   - Capacity checking before booking
   - Automatic container status updates based on bookings
   - Payment integration
   - Shipment creation from bookings
