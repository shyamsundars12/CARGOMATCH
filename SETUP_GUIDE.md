# CargoMatch Full Setup Guide

This guide provides comprehensive instructions for setting up the CargoMatch project on a new computer in the `@cargomatch` folder.

## Project Overview

CargoMatch is a full-stack logistics platform that connects importers, exporters, and logistics service providers (LSPs). The application consists of:

- **Frontend**: React application built with Vite, TypeScript, Chakra UI, Material UI, and Tailwind CSS
- **Backend**: Node.js/Express server with PostgreSQL database, JWT authentication, and Cloudinary file storage
- **Database**: PostgreSQL with Sequelize ORM
- **Deployment**: Vercel for both frontend and backend

## Prerequisites

Before starting the setup, ensure you have the following installed:

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest version (comes with Node.js)
- **Git**: For version control
- **PostgreSQL**: Version 12 or higher (or use a cloud database like Neon)

### Accounts Required
- **GitHub**: For cloning the repository
- **Cloudinary**: For file storage (optional for development)
- **Neon** or **Supabase**: For PostgreSQL database (optional, can use local PostgreSQL)

## Step 1: Clone the Repository

```bash
# Create the cargomatch folder
mkdir cargomatch
cd cargomatch

# Clone the repository (replace with actual repository URL)
git clone <repository-url> .
```

## Step 2: Install Dependencies

### Backend Setup
```bash
cd server

# Install server dependencies
npm install

# Install nodemon globally for development (optional)
npm install -g nodemon
```

### Frontend Setup
```bash
cd ../client

# Install client dependencies
npm install
```

## Step 3: Database Setup

### Option 1: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE cargomatch;
   ```
3. Create a database user and grant permissions

### Option 2: Cloud Database (Recommended)
1. Sign up for [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Create a new project/database
3. Note down the connection details

## Step 4: Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-username
DB_PASS=your-database-password
DB_NAME=cargomatch
DB_PORT=5432
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Node Environment
NODE_ENV=development
```

**Important Notes:**
- Replace all placeholder values with actual credentials
- Use a strong, random string for `JWT_SECRET`
- For Neon databases, `DB_SSL=true` is required
- Cloudinary is optional for development but required for file uploads

### Frontend Environment Variables (Optional)

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:3000
```

## Step 5: Database Initialization

### Run Database Migrations
```bash
cd server

# Initialize the database and run schema
node src/config/initDb.js
```

This will:
- Create all required tables
- Insert default container types
- Set up indexes for performance

### Alternative: Manual Schema Setup
If the init script doesn't work, you can run the schema manually:

```bash
# Connect to your PostgreSQL database and run:
psql -d cargomatch -f src/config/schema.sql
```

## Step 6: Start the Development Servers

### Start Backend Server
```bash
cd server

# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

The backend will start on `http://localhost:3000`

### Start Frontend Server
```bash
cd client

# Development mode
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 7: Verify Installation

### Test Backend API
Open your browser and visit:
- `http://localhost:3000/api/health` - Should return server status

### Test Frontend
Open your browser and visit:
- `http://localhost:5173` - Should load the CargoMatch application

### Test Database Connection
Check that you can connect to the database and see the tables:
```bash
psql -d cargomatch -c "\dt"
```

You should see tables like: users, lsp_profiles, containers, bookings, etc.

## Step 8: User Registration and Testing

1. **Register an Admin User**: Visit the registration page and create an admin account
2. **Register LSP Users**: Create logistics service provider accounts
3. **Test Core Features**:
   - User authentication (login/logout)
   - LSP profile creation and document upload
   - Container management
   - Booking system
   - Shipment tracking

## Step 9: Production Deployment

### Backend Deployment to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `cd server && vercel`

Set the following environment variables in Vercel:
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `DB_SSL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NODE_ENV=production`

### Frontend Deployment to Vercel
1. `cd client && vercel`
2. Set `VITE_API_URL` to your backend Vercel URL

## File Structure Overview

```
cargomatch/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration files
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Database and app configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── repository/    # Database queries
│   │   ├── middlewares/   # Express middlewares
│   │   └── utils/         # Helper functions
│   ├── uploads/           # File uploads (local development)
│   ├── package.json
│   └── server.js          # Main server file
└── README.md              # Project documentation
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database credentials in `.env`
   - Ensure PostgreSQL is running (for local setup)
   - Check firewall settings

2. **Port Already in Use**
   - Backend: Change port in `server.js`
   - Frontend: Change port in `vite.config.ts`

3. **Module Not Found Errors**
   - Run `npm install` in both client and server directories
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

4. **File Upload Issues**
   - Ensure Cloudinary credentials are correct
   - Check file size limits

5. **CORS Errors**
   - Verify frontend URL is allowed in backend CORS configuration
   - Check `server/api/index.js` for CORS settings

### Development Tips

- Use `npm run dev` for auto-restart on file changes
- Check server logs for debugging
- Use browser developer tools for frontend debugging
- Test API endpoints using tools like Postman or curl

## Additional Resources

- **API Documentation**: Check `server/API_DOCUMENTATION.md`
- **Deployment Guide**: See `server/DEPLOYMENT.md`
- **LSP Module Guide**: See `server/LSP_MODULE_README.md`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server and client logs
3. Verify all environment variables are set correctly
4. Ensure all prerequisites are installed

---

**Note**: This setup guide assumes a standard development environment. Adjust paths and commands based on your specific operating system and setup preferences.
