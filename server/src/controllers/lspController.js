const lspService = require('../services/lspService');
const path = require('path');

// LSP Authentication & Profile Management
const registerLSP = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, ...profileData } = req.body;
    // Handle uploaded files
    const files = req.files || {};
    if (files.gst_certificate && files.gst_certificate[0]) {
      profileData.gst_certificate_path = path.relative(process.cwd(), files.gst_certificate[0].path);
    }
    if (files.company_registration_doc && files.company_registration_doc[0]) {
      profileData.company_registration_doc_path = path.relative(process.cwd(), files.company_registration_doc[0].path);
    }
    if (files.business_license_doc && files.business_license_doc[0]) {
      profileData.business_license_doc_path = path.relative(process.cwd(), files.business_license_doc[0].path);
    }
    if (files.insurance_certificate_doc && files.insurance_certificate_doc[0]) {
      profileData.insurance_certificate_doc_path = path.relative(process.cwd(), files.insurance_certificate_doc[0].path);
    }

    const result = await lspService.registerLSP(
      { name, email, password, confirmPassword },
      profileData
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('LSP Registration Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const loginLSP = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await lspService.loginLSP({ email, password });
    res.status(200).json(result);
  } catch (error) {
    console.error('LSP Login Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const getLSPProfile = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Get LSP Profile Error:', error.message);
    res.status(404).json({ error: error.message });
  }
};

const updateLSPProfile = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const updatedProfile = await lspService.updateLSPProfile(profile.id, req.body);
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Update LSP Profile Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Container Management
const createContainer = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const container = await lspService.createContainer(profile.id, req.body);
    res.status(201).json(container);
  } catch (error) {
    console.error('Create Container Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const getContainers = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const filters = {
      status: req.query.status,
      is_available: req.query.is_available === 'true' ? true : req.query.is_available === 'false' ? false : undefined,
      type: req.query.type,
      size: req.query.size
    };
    
    const containers = await lspService.getContainers(profile.id, filters);
    res.status(200).json(containers);
  } catch (error) {
    console.error('Get Containers Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const getContainer = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const container = await lspService.getContainer(req.params.id, profile.id);
    res.status(200).json(container);
  } catch (error) {
    console.error('Get Container Error:', error.message);
    res.status(404).json({ error: error.message });
  }
};

const updateContainer = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const container = await lspService.updateContainer(req.params.id, profile.id, req.body);
    res.status(200).json(container);
  } catch (error) {
    console.error('Update Container Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const deleteContainer = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const result = await lspService.deleteContainer(req.params.id, profile.id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete Container Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Booking Management
const getBookings = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const filters = {
      status: req.query.status,
      container_id: req.query.container_id
    };
    
    const bookings = await lspService.getBookings(profile.id, filters);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get Bookings Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const getBooking = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const booking = await lspService.getBooking(req.params.id, profile.id);
    res.status(200).json(booking);
  } catch (error) {
    console.error('Get Booking Error:', error.message);
    res.status(404).json({ error: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const { status } = req.body;
    
    const booking = await lspService.updateBookingStatus(req.params.id, profile.id, status);
    res.status(200).json(booking);
  } catch (error) {
    console.error('Update Booking Status Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Shipment Management
const getShipments = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const filters = {
      status: req.query.status,
      booking_id: req.query.booking_id
    };
    
    const shipments = await lspService.getShipments(profile.id, filters);
    res.status(200).json(shipments);
  } catch (error) {
    console.error('Get Shipments Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const { status, location, description } = req.body;
    
    const shipment = await lspService.updateShipmentStatus(req.params.id, profile.id, {
      status,
      location,
      description
    });
    res.status(200).json(shipment);
  } catch (error) {
    console.error('Update Shipment Status Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Complaint Management
const getComplaints = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const filters = {
      status: req.query.status,
      priority: req.query.priority
    };
    
    const complaints = await lspService.getComplaints(profile.id, filters);
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Get Complaints Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const resolveComplaint = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const { status, resolution } = req.body;
    
    const complaint = await lspService.resolveComplaint(req.params.id, profile.id, {
      status,
      resolution
    });
    res.status(200).json(complaint);
  } catch (error) {
    console.error('Resolve Complaint Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Notification Management
const getNotifications = async (req, res) => {
  try {
    const filters = {
      is_read: req.query.is_read === 'true' ? true : req.query.is_read === 'false' ? false : undefined,
      type: req.query.type,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const notifications = await lspService.getNotifications(req.user.id, filters);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await lspService.markNotificationAsRead(req.params.id, req.user.id);
    res.status(200).json(notification);
  } catch (error) {
    console.error('Mark Notification Read Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Utility endpoints
const getContainerTypes = async (req, res) => {
  try {
    const containerTypes = await lspService.getContainerTypes();
    res.status(200).json(containerTypes);
  } catch (error) {
    console.error('Get Container Types Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  registerLSP,
  loginLSP,
  getLSPProfile,
  updateLSPProfile,
  createContainer,
  getContainers,
  getContainer,
  updateContainer,
  deleteContainer,
  getBookings,
  getBooking,
  updateBookingStatus,
  getShipments,
  updateShipmentStatus,
  getComplaints,
  resolveComplaint,
  getNotifications,
  markNotificationAsRead,
  getContainerTypes
}; 