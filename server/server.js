const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const lspRoutes = require("./src/routes/lspRoutes");
const adminRoutes = require('./src/routes/adminRoutes');

const { initializeCronJobs } = require("./src/services/cronService");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Logistics Platform API is running");
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lsp', lspRoutes);
app.use('/api/admin', adminRoutes);


// Initialize cron jobs
initializeCronJobs();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 LSP Module endpoints available at /api/lsp`);
  console.log(`📁 Uploaded files available at /uploads`);
});

