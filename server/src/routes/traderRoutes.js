const express = require("express");
const router = express.Router();
const traderController = require("../controllers/traderController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { uploadBookingDoc } = require("../config/cloudinaryBooking");

// Public endpoint - traders can search for approved containers without authentication
// But authenticated traders get better experience
router.get("/containers/search", traderController.searchContainers);

// Authenticated trader endpoints
router.get("/containers/:id", traderController.getContainerById);

// Document upload for bookings
router.post("/bookings/upload-document", verifyToken, uploadBookingDoc.single('document'), traderController.uploadBookingDocument);

// Booking management
router.post("/bookings", verifyToken, traderController.createBooking);
router.get("/bookings", verifyToken, traderController.getMyBookings);
router.get("/bookings/:id", verifyToken, traderController.getBookingById);

module.exports = router;
