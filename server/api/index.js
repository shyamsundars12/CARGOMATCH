const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("../src/routes/authRoutes");
const lspRoutes = require("../src/routes/lspRoutes");
const adminRoutes = require('../src/routes/adminRoutes');
const traderRoutes = require('../src/routes/traderRoutes');
const fileRoutes = require('../src/routes/fileRoutes');
const cloudinaryRoutes = require('../src/routes/cloudinaryRoutes');

// Note: Cron jobs are disabled in serverless environment
// If needed, use Vercel Cron Jobs or external service

dotenv.config();
const app = express();

// CORS configuration for Vercel deployment
const corsOptions = {
  origin: [
    'https://cargomatch-orcin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Logistics Platform API is running",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lsp', lspRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trader', traderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app as a serverless function
module.exports = app;

