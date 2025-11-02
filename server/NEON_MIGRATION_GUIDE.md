# CargoMatch Migration Guide
# =========================

## Overview
This guide provides step-by-step instructions for migrating CargoMatch from local PostgreSQL to Neon cloud database while ensuring all workflows remain functional.

## Prerequisites
1. Neon account and project created
2. Local PostgreSQL database with CargoMatch data
3. Node.js and npm installed
4. Access to both local and Neon database credentials

## Migration Steps

### Step 1: Prepare Migration Environment
```bash
# Install dependencies
npm install

# Ensure your local database is running and accessible
# Verify connection with:
node check-table-structure.js
```

### Step 2: Configure Neon Database
1. Create a new Neon project at https://console.neon.tech
2. Note down your connection details:
   - Host: ep-xxx.aws.neon.tech
   - Database name
   - Username
   - Password
3. Update the configuration in `migrate-to-neon-comprehensive.js`

### Step 3: Run Migration
```bash
# Run the comprehensive migration script
node migrate-to-neon-comprehensive.js
```

This script will:
- Test connections to both databases
- Create schema in Neon
- Migrate all data with proper foreign key handling
- Create indexes and constraints
- Validate the migration
- Generate environment configuration

### Step 4: Update Application Configuration
```bash
# Copy the generated environment file
cp .env.neon .env

# Or manually update your .env with Neon credentials
```

### Step 5: Validate Migration
```bash
# Run comprehensive workflow validation
node validate-workflows.js
```

This will test:
- Database connection and integrity
- All LSP workflows (registration, containers, bookings, shipments, complaints, analytics)
- All Admin workflows (user management, LSP verification, container management, etc.)

### Step 6: Test Application
```bash
# Start the application
npm start

# Run final system test
node test-final-system.js
```

## Workflow Validation Checklist

### LSP Module - Must Work After Migration
- ✅ LSP Registration & Login
- ✅ Profile Management (update company details, documents)
- ✅ Container Management (CRUD operations)
- ✅ Booking Management (list, approve/reject, status updates)
- ✅ Shipment Management (create, track, status updates)
- ✅ Complaint Handling (view, respond to complaints)
- ✅ Analytics (revenue, container stats, performance metrics)

### Admin Module - Must Work After Migration
- ✅ Admin Login & Authentication
- ✅ User Management (list, approve/reject users)
- ✅ LSP Management (verify LSPs, review documents)
- ✅ Container Management (approve/reject containers)
- ✅ Booking Management (view all bookings, status updates)
- ✅ Shipment Management (monitor all shipments)
- ✅ Complaint Management (resolve complaints, assign priorities)
- ✅ Dashboard Analytics (system overview, statistics)

### Database Integrity - Must Be Maintained
- ✅ All tables created with proper structure
- ✅ Foreign key relationships intact
- ✅ Indexes created for performance
- ✅ Data integrity preserved
- ✅ Connection pooling configured
- ✅ SSL enabled for cloud security

## Troubleshooting

### Connection Issues
- Verify Neon credentials are correct
- Check if SSL is properly configured
- Ensure firewall allows connections to Neon

### Data Migration Issues
- Check for data type mismatches
- Verify foreign key constraints
- Review migration logs for specific errors

### Application Issues
- Verify environment variables are set correctly
- Check database connection in application logs
- Run individual workflow tests to isolate issues

## Rollback Plan
If migration fails or issues are discovered:

1. Keep local database running during migration
2. Use local .env configuration to revert
3. Restore from local database backup if needed
4. Re-run migration after fixing issues

## Performance Considerations
- Neon provides automatic scaling
- Connection pooling is configured for optimal performance
- Indexes are created for common query patterns
- SSL adds minimal overhead

## Security Notes
- SSL is enabled for all cloud connections
- Credentials should be stored securely
- Regular backups are handled by Neon
- Access logs are available in Neon dashboard

## Support
For issues with:
- Migration script: Check logs and error messages
- Neon database: Contact Neon support
- Application: Review workflow validation results