const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repo = require('../repository/lspRepository');
const authRepo = require('../repository/authRepository');

const JWT_SECRET = process.env.JWT_SECRET;

// LSP Authentication & Profile Management
const registerLSP = async (userData, profileData) => {
  const { name, email, password, confirmPassword } = userData;
  
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }
  
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }
  
  // Check if user already exists
  const existingUser = await authRepo.getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user with LSP role
  const user = await authRepo.createUser({ 
    name, 
    email, 
    password: hashedPassword,
    role: 'lsp'
  });
  
  // Create LSP profile (pass all fields including file paths)
  const lspProfile = await repo.createLSPProfile({
    ...profileData,
    user_id: user.id
  });
  
  return {
    message: 'LSP registered successfully. Pending admin approval.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    profile: lspProfile
  };
};

const loginLSP = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  
  const user = await authRepo.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  
  // Check if user has an LSP profile (this indicates they are an LSP)
  const lspProfile = await repo.getLSPProfileByUserId(user.id);
  if (!lspProfile) {
    throw new Error("Access denied. LSP account required.");
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error("Invalid password");
  }
  
  // Check if LSP profile is verified
  if (!lspProfile.is_verified) {
    throw new Error("Account pending verification. Please contact admin.");
  }
  
  const token = jwt.sign(
    { id: user.id, role: 'lsp', lsp_id: lspProfile.id }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
  
  return {
    message: 'Login successful',
    token,
    user: { id: user.id, name: lspProfile.name, email: user.email, role: 'lsp' },
    profile: lspProfile
  };
};

const getLSPProfile = async (userId) => {
  const profile = await repo.getLSPProfileByUserId(userId);
  if (!profile) {
    throw new Error("LSP profile not found");
  }
  return profile;
};

const updateLSPProfile = async (profileId, updateData) => {
  const updatedProfile = await repo.updateLSPProfile(profileId, updateData);
  if (!updatedProfile) {
    throw new Error("Failed to update profile");
  }
  return updatedProfile;
};

// Container Management
const createContainer = async (lspId, containerData) => {
  // Validate container data
  const { container_number, size, type, origin_port, destination_port, departure_date, arrival_date, price_per_unit, length, width, height, weight } = containerData;
  
  if (!container_number || !size || !type || !origin_port || !destination_port || !departure_date || !arrival_date || !price_per_unit) {
    throw new Error("Missing required container information");
  }
  
  // Validate dimensions if provided
  if (length && (isNaN(length) || length <= 0)) {
    throw new Error("Length must be a positive number");
  }
  if (width && (isNaN(width) || width <= 0)) {
    throw new Error("Width must be a positive number");
  }
  if (height && (isNaN(height) || height <= 0)) {
    throw new Error("Height must be a positive number");
  }
  if (weight && (isNaN(weight) || weight <= 0)) {
    throw new Error("Weight must be a positive number");
  }
  
  if (new Date(departure_date) >= new Date(arrival_date)) {
    throw new Error("Departure date must be before arrival date");
  }
  
  const container = await repo.createContainer({
    ...containerData,
    lsp_id: lspId
  });
  
  return container;
};

const getContainers = async (lspId, filters = {}) => {
  return await repo.getContainersByLSP(lspId, filters);
};

const getContainer = async (containerId, lspId) => {
  const container = await repo.getContainerById(containerId, lspId);
  if (!container) {
    throw new Error("Container not found");
  }
  return container;
};

const updateContainer = async (containerId, lspId, updateData) => {
  const container = await repo.updateContainer(containerId, updateData, lspId);
  if (!container) {
    throw new Error("Container not found or access denied");
  }
  return container;
};

const deleteContainer = async (containerId, lspId) => {
  const container = await repo.deleteContainer(containerId, lspId);
  if (!container) {
    throw new Error("Container not found or access denied");
  }
  return { message: "Container deleted successfully" };
};

// Booking Management
const getBookings = async (lspId, filters = {}) => {
  return await repo.getBookingsByLSP(lspId, filters);
};

const getBooking = async (bookingId, lspId) => {
  const booking = await repo.getBookingById(bookingId, lspId);
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
};

const updateBookingStatus = async (bookingId, lspId, status, notes = null) => {
  // Normalize status input (handle both 'pending' and 'pending_approval')
  let normalizedStatus = status.toLowerCase().trim();
  if (normalizedStatus === 'pending_approval') {
    normalizedStatus = 'pending';
  }
  
  const validStatuses = ['pending', 'approved', 'rejected', 'confirmed', 'closed', 'cancelled'];
  if (!validStatuses.includes(normalizedStatus)) {
    throw new Error("Invalid booking status");
  }
  
  const booking = await repo.updateBookingStatus(bookingId, normalizedStatus, lspId, notes);
  if (!booking) {
    throw new Error("Booking not found or access denied");
  }
  
  // If booking is approved, create shipment automatically
  if (normalizedStatus === 'approved' && booking.is_auto_approved) {
    await createShipmentFromBooking(booking);
  }
  
  return booking;
};

const getPendingBookings = async (lspId) => {
  return await repo.getPendingBookings(lspId);
};

// Shipment Management
const createShipmentFromBooking = async (booking) => {
  const container = await repo.getContainerById(booking.container_id);
  if (!container) {
    throw new Error("Container not found");
  }
  
  const shipmentNumber = `SH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const shipment = await repo.createShipment({
    booking_id: booking.id,
    container_id: booking.container_id,
    lsp_id: container.lsp_id,
    shipment_number: shipmentNumber,
    departure_port: container.origin_port,
    arrival_port: container.destination_port,
    estimated_arrival_date: booking.arrival_date
  });
  
  // Create notification for LSP
  const lspProfile = await repo.getLSPProfileByUserId(container.lsp_id);
  if (lspProfile) {
    await repo.createNotification({
      user_id: lspProfile.user_id,
      title: "New Shipment Created",
      message: `Shipment ${shipmentNumber} has been created for booking #${booking.id}`,
      type: 'shipment_created',
      related_entity_type: 'shipment',
      related_entity_id: shipment.id
    });
  }
  
  return shipment;
};

const getShipments = async (lspId, filters = {}) => {
  return await repo.getShipmentsByLSP(lspId, filters);
};

const updateShipmentStatus = async (shipmentId, lspId, statusData) => {
  const { status, location, description } = statusData;
  
  const validStatuses = ['scheduled', 'in_transit', 'delivered', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid shipment status");
  }
  
  const shipment = await repo.updateShipmentStatus(shipmentId, status, location, description, lspId, lspId);
  if (!shipment) {
    throw new Error("Shipment not found or access denied");
  }
  
  // Create notification for importer/exporter
  const booking = await repo.getBookingById(shipment.booking_id);
  if (booking) {
    const notifyUserId = booking.importer_id || booking.exporter_id;
    if (notifyUserId) {
      await repo.createNotification({
        user_id: notifyUserId,
        title: "Shipment Status Updated",
        message: `Shipment ${shipment.shipment_number} status updated to ${status}`,
        type: 'shipment_status_update',
        related_entity_type: 'shipment',
        related_entity_id: shipment.id
      });
    }
  }
  
  return shipment;
};

// Complaint Management
const getComplaints = async (lspId, filters = {}) => {
  return await repo.getComplaintsByLSP(lspId, filters);
};

const resolveComplaint = async (complaintId, lspId, resolutionData) => {
  const { status, resolution } = resolutionData;
  
  // Validate required fields
  if (!status) {
    throw new Error("Status is required");
  }
  
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid complaint status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Resolution is required for resolved/closed status
  if ((status === 'resolved' || status === 'closed') && (!resolution || !resolution.trim())) {
    throw new Error("Resolution text is required when resolving or closing a complaint");
  }
  
  // Get the user_id from the LSP profile for resolved_by
  const lspProfile = await repo.getLSPProfileByLspId(lspId);
  const userId = lspProfile?.user_id || null;
  
  const complaint = await repo.updateComplaintStatus(complaintId, status, resolution, userId, lspId);
  if (!complaint) {
    throw new Error("Complaint not found or access denied");
  }
  
  // Create notification for complainant (make it optional - don't fail if it doesn't work)
  try {
    const complainantId = complaint.user_id;
    if (complainantId) {
      await repo.createNotification({
        user_id: complainantId,
        title: "Complaint Updated",
        message: `Your complaint "${complaint.title}" has been ${status}`,
        type: 'complaint_update',
        related_entity_type: 'complaint',
        related_entity_id: complaint.id
      });
    }
  } catch (notificationError) {
    console.warn('Could not create notification for complaint resolution:', notificationError.message);
    // Don't fail the whole operation if notification fails
  }
  
  return complaint;
};

// Notification Management
const getNotifications = async (userId, filters = {}) => {
  return await repo.getNotificationsByUser(userId, filters);
};

const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await repo.markNotificationAsRead(notificationId, userId);
  if (!notification) {
    throw new Error("Notification not found");
  }
  return notification;
};

// Utility functions
const getContainerTypes = async () => {
  return await repo.getContainerTypes();
};

const generateShipmentNumber = () => {
  return `SH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Analytics & Performance Metrics
const getLSPAnalytics = async (lspId) => {
  try {
    // Get container statistics
    const containerStats = await repo.getContainerStats(lspId);
    
    // Get booking statistics
    const bookingStats = await repo.getBookingStats(lspId);
    
    // Get shipment statistics
    const shipmentStats = await repo.getShipmentStats(lspId);
    
    // Get revenue data
    const revenueData = await repo.getRevenueData(lspId);
    
    // Get recent activity
    const recentActivity = await repo.getRecentActivity(lspId);
    
    return {
      containers: containerStats,
      bookings: bookingStats,
      shipments: shipmentStats,
      revenue: revenueData,
      recentActivity: recentActivity
    };
  } catch (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }
};

// Notification Management
const createNotification = async (userId, title, message, type = 'info', relatedEntityType = null, relatedEntityId = null) => {
  try {
    return await repo.createNotification({
      user_id: userId,
      title,
      message,
      type,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId
    });
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

module.exports = {
  // Authentication & Profile
  registerLSP,
  loginLSP,
  getLSPProfile,
  updateLSPProfile,
  
  // Container Management
  createContainer,
  getContainers,
  getContainer,
  updateContainer,
  deleteContainer,
  
  // Booking Management
  getBookings,
  getBooking,
  updateBookingStatus,
  getPendingBookings,
  
  // Shipment Management
  getShipments,
  updateShipmentStatus,
  createShipmentFromBooking,
  
  // Complaint Management
  getComplaints,
  resolveComplaint,
  
  // Notification Management
  getNotifications,
  markNotificationAsRead,
  
  // Utilities
  getContainerTypes,
  generateShipmentNumber,
  
  // Analytics & Notifications
  getLSPAnalytics,
  createNotification
}; 