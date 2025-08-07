const express = require('express');
const router = express.Router();
const lspController = require('../controllers/lspController');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer config for LSP document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/lsp_docs'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.fieldname + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed!'));
    }
    cb(null, true);
  }
});

// LSP Authentication & Profile Management
router.post('/register', upload.fields([
  { name: 'gst_certificate', maxCount: 1 },
  { name: 'company_registration_doc', maxCount: 1 },
  { name: 'business_license_doc', maxCount: 1 },
  { name: 'insurance_certificate_doc', maxCount: 1 },
]), lspController.registerLSP);
router.post('/login', lspController.loginLSP);

// Protected routes - require authentication
router.use(verifyToken);

// Profile Management
router.get('/profile', lspController.getLSPProfile);
router.put('/profile', lspController.updateLSPProfile);

// Container Management
router.post('/containers', lspController.createContainer);
router.get('/containers', lspController.getContainers);
router.get('/containers/:id', lspController.getContainer);
router.put('/containers/:id', lspController.updateContainer);
router.delete('/containers/:id', lspController.deleteContainer);

// Booking Management
router.get('/bookings', lspController.getBookings);
router.get('/bookings/:id', lspController.getBooking);
router.put('/bookings/:id/status', lspController.updateBookingStatus);

// Shipment Management
router.get('/shipments', lspController.getShipments);
router.put('/shipments/:id/status', lspController.updateShipmentStatus);

// Complaint Management
router.get('/complaints', lspController.getComplaints);
router.put('/complaints/:id/resolve', lspController.resolveComplaint);

// Notification Management
router.get('/notifications', lspController.getNotifications);
router.put('/notifications/:id/read', lspController.markNotificationAsRead);

// Utility endpoints
router.get('/container-types', lspController.getContainerTypes);

module.exports = router; 