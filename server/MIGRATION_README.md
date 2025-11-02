# CargoMatch Neon Database Migration

This repository contains comprehensive migration tools to move CargoMatch from local PostgreSQL to Neon cloud database while ensuring all workflows remain functional.

## 🎯 Overview

CargoMatch is a logistics SaaS platform with two main modules:
- **Admin Module**: Compliance, regulation, and audit management
- **LSP Module**: Logistics service provider and shipment orchestration

The migration ensures **ALL workflows** continue to work seamlessly after moving to Neon cloud database.

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Local PostgreSQL database with CargoMatch data
- Neon account and project created
- Access to both local and Neon database credentials

## 🚀 Quick Start

### 1. Interactive Setup
```bash
# Run the interactive setup script
node migrate-setup.js
```

This will guide you through:
- Neon database configuration
- Local database configuration
- JWT and admin settings
- Generate all necessary configuration files

### 2. Run Migration
```bash
# Run the complete migration process
node migrate-master.js
```

This will execute:
- Prerequisites check
- Local database backup
- Schema creation in Neon
- Data migration with foreign key handling
- Workflow validation
- API endpoint testing
- Final system test

### 3. Deploy
```bash
# Copy Neon configuration to .env
cp .env.neon .env

# Start your application
npm start
```

## 📁 Migration Files

### Core Migration Scripts
- `migrate-master.js` - Master orchestration script
- `migrate-setup.js` - Interactive setup script
- `migrate-to-neon-comprehensive.js` - Comprehensive migration with schema creation
- `migrate-data-advanced.js` - Advanced data migration with foreign key handling

### Validation & Testing
- `validate-workflows.js` - Comprehensive workflow validation
- `test-api-endpoints.js` - API endpoint testing suite
- `test-final-system.js` - Final system integration test

### Configuration Files
- `env-local.txt` - Local database configuration template
- `env-neon-production.txt` - Neon production configuration template
- `NEON_MIGRATION_GUIDE.md` - Detailed migration guide

## 🔧 Manual Configuration

If you prefer manual configuration, update these files:

### 1. Environment Variables
Create `.env` with Neon credentials:
```env
# Neon Database Configuration
DB_HOST=ep-xxx.aws.neon.tech
DB_PORT=5432
DB_NAME=logisticsdb
DB_USER=neondb_owner
DB_PASS=your_password
DB_SSL=true

# JWT Configuration
JWT_SECRET=Hello@13

# Admin Configuration
ADMIN_EMAIL=admin@cargomatch.in
ADMIN_PASSWORD=adminCargomatch123

# Server Configuration
PORT=5000
NODE_ENV=production
```

### 2. Database Configuration
The `src/config/db.js` file has been enhanced to:
- Support both local and Neon connections
- Automatically enable SSL for cloud databases
- Include connection pooling for better performance
- Provide connection monitoring and error handling

## 🧪 Testing & Validation

### Workflow Validation
The migration includes comprehensive testing for all workflows:

#### LSP Module Workflows
- ✅ LSP Registration & Login
- ✅ Profile Management (update company details, documents)
- ✅ Container Management (CRUD operations)
- ✅ Booking Management (list, approve/reject, status updates)
- ✅ Shipment Management (create, track, status updates)
- ✅ Complaint Handling (view, respond to complaints)
- ✅ Analytics (revenue, container stats, performance metrics)

#### Admin Module Workflows
- ✅ Admin Login & Authentication
- ✅ User Management (list, approve/reject users)
- ✅ LSP Management (verify LSPs, review documents)
- ✅ Container Management (approve/reject containers)
- ✅ Booking Management (view all bookings, status updates)
- ✅ Shipment Management (monitor all shipments)
- ✅ Complaint Management (resolve complaints, assign priorities)
- ✅ Dashboard Analytics (system overview, statistics)

### API Endpoint Testing
All API endpoints are tested:
- Authentication endpoints
- CRUD operations
- Status updates
- Analytics endpoints
- Admin management endpoints

### Database Integrity
- Foreign key relationships maintained
- Data integrity preserved
- Indexes created for performance
- Connection pooling configured

## 📊 Migration Process

### Step 1: Prerequisites Check
- Node.js and npm availability
- Required files present
- Environment variables configured

### Step 2: Local Database Backup
- Creates SQL dump of local database
- Stores backup for rollback if needed

### Step 3: Schema Creation
- Creates all tables in Neon database
- Sets up proper relationships and constraints
- Inserts default data (container types)

### Step 4: Data Migration
- Migrates data in dependency order
- Resolves foreign key references
- Handles data type conversions
- Preserves referential integrity

### Step 5: Validation
- Tests all workflows
- Validates API endpoints
- Checks database integrity
- Runs final system test

### Step 6: Configuration
- Generates environment files
- Creates migration report
- Provides deployment instructions

## 🔍 Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Check Neon credentials
node -e "console.log(process.env.DB_HOST)"

# Test connection manually
psql "postgresql://user:pass@host:port/db?sslmode=require"
```

#### Data Migration Issues
- Check migration logs for specific errors
- Verify foreign key constraints
- Review data type mismatches

#### Application Issues
- Verify environment variables
- Check database connection logs
- Run individual workflow tests

### Debug Commands
```bash
# Test database connection
node check-table-structure.js

# Validate workflows only
node validate-workflows.js

# Test API endpoints only
node test-api-endpoints.js

# Run final system test
node test-final-system.js
```

## 📈 Performance Considerations

- **Connection Pooling**: Configured for optimal performance
- **Indexes**: Created for common query patterns
- **SSL**: Minimal overhead for cloud security
- **Neon Scaling**: Automatic scaling based on usage

## 🔒 Security Notes

- SSL enabled for all cloud connections
- Credentials stored securely in environment variables
- Regular backups handled by Neon
- Access logs available in Neon dashboard

## 📝 Migration Reports

The migration generates several reports:
- `migration-log.txt` - Detailed migration log
- `migration-report.json` - Comprehensive migration report
- `migration-report.json` - Advanced data migration report

## 🚨 Rollback Plan

If migration fails:
1. Keep local database running during migration
2. Use local `.env` configuration to revert
3. Restore from local database backup if needed
4. Re-run migration after fixing issues

## 📞 Support

For issues with:
- **Migration Script**: Check logs and error messages
- **Neon Database**: Contact Neon support
- **Application**: Review workflow validation results

## 🎉 Success Criteria

Migration is successful when:
- ✅ All workflows validated (100% success rate)
- ✅ All API endpoints working
- ✅ Database integrity maintained
- ✅ Performance metrics acceptable
- ✅ No data loss or corruption

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/backup.html)
- [Node.js Database Best Practices](https://nodejs.org/en/docs/guides/database/)

---

**Note**: This migration ensures zero downtime and maintains all existing functionality while moving to a scalable cloud database solution.
