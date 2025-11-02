const adminService = require('../services/adminService');

// Auth
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await adminService.login({ email, password });
    res.status(200).json(data);
  } catch (err) {
    console.error("Admin Login Error:", err.message);
    res.status(401).json({ error: err.message });
  }
};


// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Containers
exports.getAllContainers = async (req, res) => {
  try {
    const data = await adminService.getAllContainers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getContainerById = async (req, res) => {
  try {
    const data = await adminService.getContainerById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Container not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateContainerStatus = async (req, res) => {
  try {
    const updated = await adminService.updateContainerStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Container not found or invalid status' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteContainer = async (req, res) => {
  try {
    const deleted = await adminService.deleteContainer(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Container not found' });
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Container Types
exports.getContainerTypes = async (req, res) => {
  try {
    const types = await adminService.getContainerTypes();
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createContainerType = async (req, res) => {
  try {
    const created = await adminService.createContainerType(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateContainerType = async (req, res) => {
  try {
    const updated = await adminService.updateContainerType(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Container type not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteContainerType = async (req, res) => {
  try {
    const deleted = await adminService.deleteContainerType(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Container type not found' });
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Users
exports.getUsers = async (req, res) => {
  try {
    // Optionally, support filtering by role via query param (e.g., ?role=lsp)
    const role = req.query.role || null;
    const users = await adminService.getUsers(role);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate user ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Invalid user ID provided' });
    }
    
    // Accept both integer IDs and UUIDs
    const isInteger = /^\d+$/.test(userId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isInteger && !isUUID) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await adminService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('getUserById error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get detailed trader information for verification
exports.getTraderById = async (req, res) => {
  try {
    const traderId = req.params.id;
    
    // Validate trader ID
    if (!traderId || traderId === 'undefined' || traderId === 'null') {
      return res.status(400).json({ error: 'Invalid trader ID provided' });
    }
    
    const trader = await adminService.getTraderById(traderId);
    if (!trader) return res.status(404).json({ error: 'Trader not found' });
    res.json(trader);
  } catch (err) {
    console.error('getTraderById error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Generate PDF for trader verification
exports.generateTraderVerificationPDF = async (req, res) => {
  try {
    const traderId = req.params.id;
    
    // Validate trader ID
    if (!traderId || traderId === 'undefined' || traderId === 'null') {
      return res.status(400).json({ error: 'Invalid trader ID provided' });
    }
    
    const result = await adminService.generateTraderVerificationPDF(traderId);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.pdfBuffer.length);
    
    // Send PDF buffer
    res.send(result.pdfBuffer);
  } catch (err) {
    console.error('generateTraderVerificationPDF error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Upload trader document
exports.uploadTraderDocument = async (req, res) => {
  try {
    const traderId = req.params.id;
    const docType = req.params.docType;
    const { makeFilePublic } = require('../config/cloudinary');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate trader ID
    if (!traderId || traderId === 'undefined' || traderId === 'null') {
      return res.status(400).json({ error: 'Invalid trader ID provided' });
    }
    
    // Get Cloudinary URL from the uploaded file
    // CloudinaryStorage provides the URL in req.file.path
    let cloudinaryUrl = req.file.path;
    
    // Also check for secure_url or url fields
    if (req.file.secure_url) {
      cloudinaryUrl = req.file.secure_url;
    } else if (req.file.url) {
      cloudinaryUrl = req.file.url;
    }
    
    console.log('Uploaded file info:', {
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
        console.log('Made file public:', cleanPublicId);
        
        // Get the proper secure URL
        const { getViewableUrl } = require('../config/cloudinary');
        const viewableUrl = getViewableUrl(cleanPublicId);
        if (viewableUrl) {
          cloudinaryUrl = viewableUrl;
        }
      }
    } catch (error) {
      console.warn('Warning: Could not make file public (it might already be public):', error.message);
      // Continue anyway - file might already be public
    }
    
    // Update trader document path in database with Cloudinary URL
    const result = await adminService.updateTraderDocument(traderId, docType, cloudinaryUrl);
    
    res.json({
      message: 'Document uploaded to cloud successfully',
      cloudinaryUrl: cloudinaryUrl,
      secure_url: cloudinaryUrl,
      trader: result
    });
  } catch (err) {
    console.error('uploadTraderDocument error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Container Approval Management
exports.getContainersForApproval = async (req, res) => {
  try {
    const containers = await adminService.getContainersForApproval();
    res.json(containers);
  } catch (err) {
    console.error('getContainersForApproval error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getContainerById = async (req, res) => {
  try {
    const { id } = req.params;
    const container = await adminService.getContainerForApproval(id);
    res.json(container);
  } catch (err) {
    console.error('getContainerById error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.approveContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user.id;
    
    const container = await adminService.approveContainer(id, adminId, approvalNotes);
    res.json({
      message: 'Container approved successfully',
      container: container
    });
  } catch (err) {
    console.error('approveContainer error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.rejectContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;
    
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const container = await adminService.rejectContainer(id, adminId, rejectionReason);
    res.json({
      message: 'Container rejected successfully',
      container: container
    });
  } catch (err) {
    console.error('rejectContainer error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getApprovedContainers = async (req, res) => {
  try {
    const containers = await adminService.getApprovedContainers();
    res.json(containers);
  } catch (err) {
    console.error('getApprovedContainers error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_approved } = req.body;
    
    // Validate user ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Invalid user ID provided' });
    }
    
    // Accept both integer IDs and UUIDs
    const isInteger = /^\d+$/.test(userId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isInteger && !isUUID) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Validation: only allow true or false (null is only default when creating)
    if (is_approved !== true && is_approved !== false) {
      return res.status(400).json({ error: 'is_approved must be true (approved) or false (rejected)' });
    }

    // Call service to update user and LSP/trader profile approval status
    const updatedUser = await adminService.updateUserAndProfileApproval(userId, is_approved);

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user?.id; // Get admin ID from JWT token
    
    console.log('🔍 Approve User Debug:', { userId, adminId, userRole: req.user?.role });
    
    // Validate admin ID
    if (!adminId) {
      console.log('❌ Admin ID not found in token');
      return res.status(400).json({ error: 'Admin ID not found in token' });
    }
    
    const approvedUser = await adminService.approveUser(userId, adminId);
    if (!approvedUser) return res.status(404).json({ error: 'User not found' });
    
    console.log('✅ User approved successfully:', approvedUser.email);
    res.json({ 
      message: 'User approved successfully', 
      user: approvedUser 
    });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user?.id; // Get admin ID from JWT token
    const { rejectionReason } = req.body;
    
    // Validate admin ID
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID not found in token' });
    }
    
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const rejectedUser = await adminService.rejectUser(userId, adminId, rejectionReason);
    if (!rejectedUser) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      message: 'User rejected successfully', 
      user: rejectedUser 
    });
  } catch (err) {
    console.error('Error rejecting user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate user ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Invalid user ID provided' });
    }
    
    // Accept both integer IDs and UUIDs
    const isInteger = /^\d+$/.test(userId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isInteger && !isUUID) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const deleted = await adminService.deleteUser(userId);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json(deleted);
  } catch (err) {
    console.error('deleteUser error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await adminService.getAllBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await adminService.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const deleted = await adminService.deleteBooking(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LSP Management
exports.getLSPs = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected', or null for all
    const lsps = await adminService.getLSPs(status);
    res.json(lsps);
  } catch (err) {
    console.error('getLSPs error:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to fetch LSPs' });
  }
};

exports.getLSPById = async (req, res) => {
  try {
    const lspId = req.params.id;
    
    // Validate LSP ID
    if (!lspId || lspId === 'undefined' || lspId === 'null') {
      return res.status(400).json({ error: 'Invalid LSP ID provided' });
    }
    
    // Check if it's a valid integer
    const lspIdInt = parseInt(lspId, 10);
    if (isNaN(lspIdInt) || lspIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid LSP ID format. Must be a positive integer.' });
    }
    
    const lsp = await adminService.getLSPById(lspIdInt);
    if (!lsp) return res.status(404).json({ error: 'LSP not found' });
    res.json(lsp);
  } catch (err) {
    console.error('getLSPById error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.approveLSP = async (req, res) => {
  try {
    const { lspId } = req.params;
    const adminId = req.user.id; // Get admin ID from JWT token
    
    // Validate LSP ID
    if (!lspId || lspId === 'undefined' || lspId === 'null') {
      return res.status(400).json({ error: 'Invalid LSP ID provided' });
    }
    
    // Check if it's a valid integer
    const lspIdInt = parseInt(lspId, 10);
    if (isNaN(lspIdInt) || lspIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid LSP ID format. Must be a positive integer.' });
    }
    
    const updatedLSP = await adminService.approveLSP(lspIdInt, adminId);
    res.json({ 
      message: 'LSP approved successfully', 
      lsp: updatedLSP 
    });
  } catch (err) {
    console.error('approveLSP error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.rejectLSP = async (req, res) => {
  try {
    const { lspId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id; // Get admin ID from JWT token
    
    // Validate LSP ID
    if (!lspId || lspId === 'undefined' || lspId === 'null') {
      return res.status(400).json({ error: 'Invalid LSP ID provided' });
    }
    
    // Check if it's a valid integer
    const lspIdInt = parseInt(lspId, 10);
    if (isNaN(lspIdInt) || lspIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid LSP ID format. Must be a positive integer.' });
    }
    
    const updatedLSP = await adminService.rejectLSP(lspIdInt, reason, adminId);
    res.json({ 
      message: 'LSP rejected successfully', 
      lsp: updatedLSP 
    });
  } catch (err) {
    console.error('rejectLSP error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyLSP = async (req, res) => {
  try {
    const { is_verified, verification_status } = req.body;
    const lspId = req.params.id;
    
    // Validate LSP ID
    if (!lspId || lspId === 'undefined' || lspId === 'null') {
      return res.status(400).json({ error: 'Invalid LSP ID provided' });
    }
    
    // Check if it's a valid integer
    const lspIdInt = parseInt(lspId, 10);
    if (isNaN(lspIdInt) || lspIdInt <= 0) {
      return res.status(400).json({ error: 'Invalid LSP ID format. Must be a positive integer.' });
    }
    
    const lsp = await adminService.verifyLSP(lspIdInt, { is_verified, verification_status });
    if (!lsp) return res.status(404).json({ error: 'LSP not found' });
    res.json(lsp);
  } catch (err) {
    console.error('verifyLSP error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to verify LSP' });
  }
};

// Shipments
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await adminService.getAllShipments();
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await adminService.getShipmentById(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await adminService.getAllComplaints();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await adminService.getComplaintById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const complaint = await adminService.resolveComplaint(req.params.id, { status, resolution });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};