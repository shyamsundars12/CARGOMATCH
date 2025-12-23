const router = require('express').Router();
const controller = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Auth
router.post('/login', controller.login);

// Dashboard
router.get('/dashboard', verifyToken, verifyAdmin, controller.getDashboardStats);

// Containers
router.get('/containers', verifyToken, verifyAdmin, controller.getAllContainers);
// Container Approval Management - MUST come before /containers/:id to avoid route conflicts
router.get('/containers/pending', verifyToken, verifyAdmin, controller.getContainersForApproval);
router.get('/containers/approved', verifyToken, verifyAdmin, controller.getApprovedContainers);
router.get('/containers/:id', verifyToken, verifyAdmin, controller.getContainerById);
router.put('/containers/:id/status', verifyToken, verifyAdmin, controller.updateContainerStatus);
router.put('/containers/:id/approve', verifyToken, verifyAdmin, controller.approveContainer);
router.put('/containers/:id/reject', verifyToken, verifyAdmin, controller.rejectContainer);
router.delete('/containers/:id', verifyToken, verifyAdmin, controller.deleteContainer);

// Container Types
router.get('/container-types', verifyToken, verifyAdmin, controller.getContainerTypes);
router.post('/container-types', verifyToken, verifyAdmin, controller.createContainerType);
router.put('/container-types/:id', verifyToken, verifyAdmin, controller.updateContainerType);
router.delete('/container-types/:id', verifyToken, verifyAdmin, controller.deleteContainerType);

// Users (Traders)
router.get('/users', verifyToken, verifyAdmin, controller.getUsers); // traders only with optional status filter
router.get('/users/:id', verifyToken, verifyAdmin, controller.getUserById);
router.get('/traders/:id', verifyToken, verifyAdmin, controller.getTraderById); // detailed trader info
router.get('/traders/:id/pdf', verifyToken, verifyAdmin, controller.generateTraderVerificationPDF); // PDF generation
router.put('/users/:id/status', verifyToken, verifyAdmin, controller.updateApprovalStatus);
router.put('/users/:id/approve', verifyToken, verifyAdmin, controller.approveUser);
router.put('/users/:id/reject', verifyToken, verifyAdmin, controller.rejectUser);
router.delete('/users/:id', verifyToken, verifyAdmin, controller.deleteUser);

// File upload for traders
router.post('/traders/:id/upload/:docType', verifyToken, verifyAdmin, upload.single('document'), controller.uploadTraderDocument);


// Bookings
router.get('/bookings', verifyToken, verifyAdmin, controller.getAllBookings);
router.get('/bookings/:id', verifyToken, verifyAdmin, controller.getBookingById);
router.delete('/bookings/:id', verifyToken, verifyAdmin, controller.deleteBooking);

// LSP Management
router.get('/lsps', verifyToken, verifyAdmin, controller.getLSPs);
router.get('/lsps/:id', verifyToken, verifyAdmin, controller.getLSPById);
router.put('/lsps/:id/verify', verifyToken, verifyAdmin, controller.verifyLSP);
router.put('/lsps/:lspId/approve', verifyToken, verifyAdmin, controller.approveLSP);
router.put('/lsps/:lspId/reject', verifyToken, verifyAdmin, controller.rejectLSP);

// Shipments
router.get('/shipments', verifyToken, verifyAdmin, controller.getAllShipments);
router.get('/shipments/:id', verifyToken, verifyAdmin, controller.getShipmentById);

// Complaints
router.get('/complaints', verifyToken, verifyAdmin, controller.getAllComplaints);
router.get('/complaints/:id', verifyToken, verifyAdmin, controller.getComplaintById);
router.put('/complaints/:id/resolve', verifyToken, verifyAdmin, controller.resolveComplaint);

module.exports = router;
