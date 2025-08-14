const router = require('express').Router();
const controller = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Auth
router.post('/login', controller.login);

// Dashboard
router.get('/dashboard', verifyToken, verifyAdmin, controller.getDashboardStats);

// Containers
router.get('/containers', verifyToken, verifyAdmin, controller.getAllContainers);
router.get('/containers/:id', verifyToken, verifyAdmin, controller.getContainerById);
router.post('/containers/:id/status', verifyToken, verifyAdmin, controller.updateContainerStatus);
router.delete('/containers/:id', verifyToken, verifyAdmin, controller.deleteContainer);

// Container Types
router.get('/container-types', verifyToken, verifyAdmin, controller.getContainerTypes);
router.post('/container-types', verifyToken, verifyAdmin, controller.createContainerType);
router.put('/container-types/:id', verifyToken, verifyAdmin, controller.updateContainerType);
router.delete('/container-types/:id', verifyToken, verifyAdmin, controller.deleteContainerType);

// Users
router.get('/users', verifyToken, verifyAdmin, controller.getUsers); // unified users endpoint with optional role filter
router.get('/users/:id', verifyToken, verifyAdmin, controller.getUserById);
router.put('/users/:id/status', verifyToken, verifyAdmin, controller.updateApprovalStatus);
router.delete('/users/:id', verifyToken, verifyAdmin, controller.deleteUser);

// Bookings
router.get('/bookings', verifyToken, verifyAdmin, controller.getAllBookings);
router.get('/bookings/:id', verifyToken, verifyAdmin, controller.getBookingById);
router.delete('/bookings/:id', verifyToken, verifyAdmin, controller.deleteBooking);

module.exports = router;
