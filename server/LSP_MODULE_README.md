# LSP (Logistics Service Provider) Module

A comprehensive backend module for logistics service providers in a logistics booking platform, built with Node.js, Express.js, and PostgreSQL.

## Features

### ✅ Core Functionality
- **LSP Authentication & Profile Management**: Register, login, and manage LSP profiles with admin approval
- **Container Management**: Full CRUD operations for containers with availability tracking
- **Booking Management**: View and manage bookings made on LSP containers
- **Shipment Management**: Track container movement with status updates
- **Complaint Handling**: View and resolve complaints related to LSP containers
- **Notification System**: Real-time notifications for booking updates and status changes

### ✅ Technical Features
- **Raw SQL Queries**: Uses `pg` library with parameterized queries (no ORM)
- **RESTful API**: Follows REST conventions with proper HTTP methods
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types
- **Cron Jobs**: Automated booking closure and status updates
- **Comprehensive Error Handling**: Proper error responses and logging

## Database Schema

The module includes a complete relational database schema with:

- **Users**: Base user accounts with role-based access
- **LSP Profiles**: Extended profile information for logistics providers
- **Container Types**: Predefined container specifications
- **Containers**: Container listings with availability and pricing
- **Bookings**: Booking records linking containers to customers
- **Shipments**: Shipment tracking with status history
- **Complaints**: Complaint management system
- **Notifications**: Real-time notification system

## Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
Create a `.env` file in the server directory:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
DB_NAME=logisticsdb
DB_USER=postgres
DB_PASS=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

### 3. Database Setup
```bash
# Initialize the database schema
node src/config/initDb.js
```

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/lsp/register` - Register new LSP account
- `POST /api/lsp/login` - LSP login

### Profile Management
- `GET /api/lsp/profile` - Get LSP profile
- `PUT /api/lsp/profile` - Update LSP profile

### Container Management
- `POST /api/lsp/containers` - Create new container
- `GET /api/lsp/containers` - List all containers
- `GET /api/lsp/containers/:id` - Get specific container
- `PUT /api/lsp/containers/:id` - Update container
- `DELETE /api/lsp/containers/:id` - Delete container

### Booking Management
- `GET /api/lsp/bookings` - List all bookings
- `GET /api/lsp/bookings/:id` - Get specific booking
- `PUT /api/lsp/bookings/:id/status` - Update booking status

### Shipment Management
- `GET /api/lsp/shipments` - List all shipments
- `PUT /api/lsp/shipments/:id/status` - Update shipment status

### Complaint Management
- `GET /api/lsp/complaints` - List all complaints
- `PUT /api/lsp/complaints/:id/resolve` - Resolve complaint

### Notification Management
- `GET /api/lsp/notifications` - List notifications
- `PUT /api/lsp/notifications/:id/read` - Mark notification as read

### Utilities
- `GET /api/lsp/container-types` - Get available container types

## Cron Jobs

The system includes automated cron jobs:

1. **Booking Auto-Closure** (Daily at 6 AM UTC)
   - Automatically closes bookings 1 day before departure
   - Updates container availability
   - Sends notifications to relevant parties

2. **Shipment Status Updates** (Every 4 hours)
   - Monitors and updates shipment statuses
   - Tracks container movement

3. **Reminder Notifications** (Daily at 9 AM UTC)
   - Sends reminder notifications for pending actions

## Usage Examples

### Register an LSP
```bash
curl -X POST http://localhost:5000/api/lsp/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@lsp.com",
    "password": "password123",
    "confirmPassword": "password123",
    "company_name": "ABC Logistics",
    "pan_number": "ABCDE1234F",
    "gst_number": "22AAAAA0000A1Z5",
    "phone": "+1234567890",
    "address": "123 Logistics St, City, Country"
  }'
```

### Login and Get Token
```bash
curl -X POST http://localhost:5000/api/lsp/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@lsp.com",
    "password": "password123"
  }'
```

### Create a Container (with authentication)
```bash
curl -X POST http://localhost:5000/api/lsp/containers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "container_number": "CONT001",
    "size": "40ft",
    "type": "Standard",
    "capacity": 67.7,
    "origin_port": "Mumbai",
    "destination_port": "Singapore",
    "departure_date": "2024-02-15",
    "arrival_date": "2024-02-25",
    "price_per_unit": 2500.00,
    "currency": "USD"
  }'
```

## Business Logic

### Booking Flow
1. **Container Listing**: LSP creates container listings with availability and pricing
2. **Auto-Approval**: Bookings are automatically approved when made by importers/exporters
3. **Shipment Creation**: Shipment is automatically created when booking is confirmed
4. **Status Tracking**: Shipment status is tracked through the journey
5. **Auto-Closure**: Bookings are automatically closed 1 day before departure

### Status Workflows
- **Container Status**: `available` → `booked` → `in_transit` → `delivered` → `available`
- **Booking Status**: `pending` → `approved` → `closed`
- **Shipment Status**: `scheduled` → `in_transit` → `delivered` → `closed`

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Comprehensive request validation
- **Role-based Access**: Different permissions for different user types

## Error Handling

The module includes comprehensive error handling:
- Input validation errors
- Database constraint violations
- Authentication/authorization errors
- Business logic validation
- Proper HTTP status codes

## Testing

### Manual Testing
Use tools like Postman or curl to test the API endpoints:

1. Register an LSP account
2. Login to get JWT token
3. Test container CRUD operations
4. Test booking and shipment management
5. Test notification system

### Automated Testing
Consider implementing automated tests using:
- Jest for unit testing
- Supertest for API testing
- PostgreSQL test containers

## Production Considerations

### Security
- Use strong JWT secrets
- Implement rate limiting
- Add request validation middleware
- Use HTTPS in production
- Regular security audits

### Performance
- Database connection pooling
- Query optimization
- Caching strategies
- Load balancing

### Monitoring
- Application logging
- Database monitoring
- Cron job monitoring
- Error tracking

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write comprehensive documentation
5. Test thoroughly before submitting

## License

This module is part of the logistics booking platform and follows the same license terms.

## Support

For issues and questions:
1. Check the API documentation
2. Review the error logs
3. Test with the provided examples
4. Contact the development team 