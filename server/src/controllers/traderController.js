const traderService = require("../services/traderService");
const { cloudinary, makeFilePublic } = require('../config/cloudinary');

// Search approved containers (public endpoint, but can be enhanced with authentication)
exports.searchContainers = async (req, res) => {
  try {
    const filters = {
      origin_port: req.query.origin_port,
      destination_port: req.query.destination_port,
      container_type_id: req.query.container_type_id,
      size: req.query.size,
      type: req.query.type,
      departure_date: req.query.departure_date,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
    };

    const containers = await traderService.searchApprovedContainers(filters);
    res.json(containers);
  } catch (error) {
    console.error("Search containers error:", error.message);
    res.status(500).json({ error: error.message || "Failed to search containers" });
  }
};

// Get container details by ID
exports.getContainerById = async (req, res) => {
  try {
    const { id } = req.params;
    const container = await traderService.getApprovedContainerById(id);
    
    if (!container) {
      return res.status(404).json({ error: "Container not found or not approved" });
    }
    
    res.json(container);
  } catch (error) {
    console.error("Get container error:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch container" });
  }
};

// Upload booking document (permit/shipping document)
exports.uploadBookingDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const { docType } = req.body; // e.g., 'shipping_permit', 'permit_document'
    
    if (!docType) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Cloudinary URL is in req.file.path, but also check secure_url
    let cloudinaryUrl = req.file.path || req.file.secure_url || req.file.url;
    
    console.log('Uploaded booking document info:', {
      path: req.file.path,
      filename: req.file.filename,
      public_id: req.file.public_id,
      secure_url: req.file.secure_url,
      url: req.file.url
    });
    
    // Ensure file is publicly accessible
    try {
      const publicId = req.file.public_id || req.file.filename;
      if (publicId) {
        // Remove .pdf extension if present
        const cleanPublicId = publicId.replace(/\.pdf$/i, '');
        await makeFilePublic(cleanPublicId);
        console.log('Made booking document public:', cleanPublicId);
        
        // Get the proper secure URL
        const { getViewableUrl } = require('../config/cloudinary');
        const viewableUrl = getViewableUrl(cleanPublicId);
        if (viewableUrl) {
          cloudinaryUrl = viewableUrl;
        }
      }
    } catch (error) {
      console.warn('Warning: Could not make file public:', error.message);
      // Continue anyway - file might already be public
    }

    res.json({
      message: 'Document uploaded successfully',
      document_url: cloudinaryUrl,
      document_type: docType,
      secure_url: cloudinaryUrl
    });
  } catch (error) {
    console.error("Upload booking document error:", error.message);
    res.status(500).json({ error: error.message || "Failed to upload document" });
  }
};

// Create booking (requires authentication)
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingData = {
      ...req.body,
      user_id: userId,
    };

    const booking = await traderService.createBooking(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    console.error("Create booking error:", error.message);
    res.status(400).json({ error: error.message || "Failed to create booking" });
  }
};

// Get trader's own bookings
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {
      status: req.query.status,
      container_id: req.query.container_id,
    };

    const bookings = await traderService.getMyBookings(userId, filters);
    res.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch bookings" });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await traderService.getBookingById(id, userId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Get booking error:", error.message);
    res.status(500).json({ error: error.message || "Failed to fetch booking" });
  }
};
