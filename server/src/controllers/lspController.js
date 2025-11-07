const lspService = require('../services/lspService');
const path = require('path');
const db = require('../config/db');

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
    const filters = {
      status: req.query.status,
      is_available: req.query.is_available === 'true' ? true : req.query.is_available === 'false' ? false : undefined,
      type: req.query.type,
      size: req.query.size
    };
    
    const containers = await lspService.getContainers(req.user.lsp_id, filters);
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
    const filters = {
      status: req.query.status,
      container_id: req.query.container_id
    };
    
    const bookings = await lspService.getBookings(req.user.lsp_id, filters);
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
    const { status, notes } = req.body;
    
    const booking = await lspService.updateBookingStatus(req.params.id, profile.id, status, notes);
    res.status(200).json(booking);
  } catch (error) {
    console.error('Update Booking Status Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const approveBooking = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const { approvalNotes } = req.body;
    
    const booking = await lspService.updateBookingStatus(req.params.id, profile.id, 'approved', approvalNotes);
    res.status(200).json({
      message: 'Booking approved successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Approve Booking Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const booking = await lspService.updateBookingStatus(req.params.id, profile.id, 'rejected', rejectionReason);
    res.status(200).json({
      message: 'Booking rejected successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Reject Booking Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const getPendingBookings = async (req, res) => {
  try {
    const profile = await lspService.getLSPProfile(req.user.id);
    const bookings = await lspService.getPendingBookings(profile.id);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get Pending Bookings Error:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Shipment Management
const getShipments = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      booking_id: req.query.booking_id
    };
    
    const shipments = await lspService.getShipments(req.user.lsp_id, filters);
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
    // Debug: Log user info
    console.log('Get Complaints - User info:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      role: req.user?.role,
      lspId: req.user?.lsp_id
    });

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    if (!req.user.lsp_id) {
      // If lsp_id is missing from token, try to fetch it from the database
      console.log('lsp_id missing from token, fetching from database...');
      try {
        const lspProfile = await db.query(
          'SELECT id FROM lsp_profiles WHERE user_id = $1',
          [req.user.id]
        );
        
        if (lspProfile.rows.length === 0) {
          return res.status(400).json({ error: 'LSP profile not found. Please contact admin.' });
        }
        
        req.user.lsp_id = lspProfile.rows[0].id;
      } catch (dbError) {
        console.error('Error fetching LSP profile:', dbError);
        return res.status(400).json({ error: 'Failed to retrieve LSP information. Please log out and log in again.' });
      }
    }

    const filters = {
      status: req.query.status,
      priority: req.query.priority
    };
    
    const complaints = await lspService.getComplaints(req.user.lsp_id, filters);
    
    // Ensure we always return an array
    if (!Array.isArray(complaints)) {
      console.error('getComplaints returned non-array:', complaints);
      return res.status(200).json([]);
    }
    
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Get Complaints Error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ error: error.message || 'Failed to fetch complaints' });
  }
};

const getComplaint = async (req, res) => {
  try {
    if (!req.user || !req.user.lsp_id) {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required. Please log in again.' });
      }
      
      // Try to fetch lsp_id from database
      const lspProfile = await db.query(
        'SELECT id FROM lsp_profiles WHERE user_id = $1',
        [req.user.id]
      );
      
      if (lspProfile.rows.length === 0) {
        return res.status(400).json({ error: 'LSP profile not found. Please contact admin.' });
      }
      
      req.user.lsp_id = lspProfile.rows[0].id;
    }

    const complaintId = req.params.id;
    const complaints = await lspService.getComplaints(req.user.lsp_id, {});
    const complaint = complaints.find(c => c.id == complaintId); // Use == for type coercion
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found or access denied' });
    }
    
    res.status(200).json(complaint);
  } catch (error) {
    console.error('Get Complaint Error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to fetch complaint' });
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

// Analytics & Performance Metrics
const getLSPAnalytics = async (req, res) => {
  try {
    // Use lsp_id from JWT token directly
    const analytics = await lspService.getLSPAnalytics(req.user.lsp_id);
    res.json(analytics);
  } catch (error) {
    console.error('Get LSP Analytics Error:', error.message);
    res.status(500).json({ error: error.message });
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
  approveBooking,
  rejectBooking,
  getPendingBookings,
  getShipments,
  updateShipmentStatus,
  getComplaints,
  getComplaint,
  resolveComplaint,
  getNotifications,
  markNotificationAsRead,
  getContainerTypes,
  getLSPAnalytics
}; 