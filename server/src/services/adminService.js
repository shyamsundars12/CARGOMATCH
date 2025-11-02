const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const repo = require('../repository/adminRepository');
const PDFService = require('./pdfService');
const JWT_SECRET = process.env.JWT_SECRET;

// -------------------- Auth --------------------
const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Check against .env admin credentials
  if (email !== process.env.ADMIN_EMAIL) {
    throw new Error("Admin not found");
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    throw new Error("Invalid password");
  }

  // Get admin user from database to get the correct ID
  const adminUser = await repo.getAdminUserByEmail(email);
  if (!adminUser) {
    throw new Error("Admin user not found in database");
  }

  // Generate JWT with admin ID
  const token = jwt.sign(
    { role: "ADMIN", id: adminUser.id },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    message: "Admin login successful",
    token,
    user: { id: adminUser.id, email, role: "admin" }
  };
};

// -------------------- Dashboard --------------------
const getDashboardStats = async () => {
  return await repo.fetchDashboardStats();
};

// -------------------- Containers --------------------
const getAllContainers = async (status) => {
  return await repo.fetchAllContainers(status);
};

const getContainerById = async (id) => {
  const data = await repo.fetchContainerById(id);
  if (!data) throw new Error('Container not found');
  return data;
};

const updateContainerStatus = async (id, status) => {
  const validStatuses = ['APPROVED', 'REJECTED', 'PENDING', 'available', 'unavailable'];
  const upperStatus = status.toUpperCase();
  
  if (!validStatuses.includes(upperStatus) && !validStatuses.includes(status)) {
    throw new Error('Invalid status. Must be APPROVED, REJECTED, PENDING, available, or unavailable');
  }
  
  // Convert to lowercase for database storage
  const dbStatus = status.toLowerCase();
  return await repo.updateContainerStatus(id, dbStatus);
};

const deleteContainer = async (id) => {
  return await repo.deleteContainer(id);
};

// -------------------- Container Types --------------------
const getContainerTypes = async () => {
  return await repo.fetchContainerTypes();
};

const createContainerType = async (data) => {
  return await repo.createContainerType(data);
};

const updateContainerType = async (id, data) => {
  return await repo.updateContainerType(id, data);
};

const deleteContainerType = async (id) => {
  return await repo.deleteContainerType(id);
};

// -------------------- Users --------------------
const getUsers = async (role = null) => {
  return await repo.fetchUsers(role);
};

const getUserById = async (id) => {
  const user = await repo.fetchUserById(id);
  if (!user) throw new Error('User not found');
  return user;
};

// Get detailed trader information for verification
const getTraderById = async (traderId) => {
  const trader = await repo.getTraderById(traderId);
  if (!trader) throw new Error('Trader not found');
  return trader;
};

// Generate PDF for trader verification
const generateTraderVerificationPDF = async (traderId) => {
  const trader = await repo.getTraderById(traderId);
  if (!trader) throw new Error('Trader not found');
  
  const pdfBuffer = await PDFService.generateTraderVerificationPDF(trader);
  return {
    pdfBuffer,
    filename: `trader-verification-${traderId}-${Date.now()}.pdf`,
    trader: trader
  };
};

// Update trader document path
const updateTraderDocument = async (traderId, docType, documentPath) => {
  const trader = await repo.getTraderById(traderId);
  if (!trader) throw new Error('Trader not found');
  
  // Map document types to database columns
  const docTypeMap = {
    'pan': 'pan_document_path',
    'gst': 'gst_document_path',
    'iec': 'iec_document_path',
    'company-registration': 'company_registration_document_path'
  };
  
  const columnName = docTypeMap[docType];
  if (!columnName) {
    throw new Error('Invalid document type');
  }
  
  const result = await repo.updateTraderDocument(traderId, columnName, documentPath);
  return result;
};

// Container Approval Management
const getContainersForApproval = async () => {
  return await repo.getContainersForApproval();
};

const getContainerForApproval = async (containerId) => {
  const container = await repo.getContainerById(containerId);
  if (!container) throw new Error('Container not found');
  return container;
};

const approveContainer = async (containerId, adminId, approvalNotes = null) => {
  const container = await repo.getContainerById(containerId);
  if (!container) throw new Error('Container not found');
  
  if (container.container_approval_status !== 'pending') {
    throw new Error('Container is not pending approval');
  }
  
  const result = await repo.approveContainer(containerId, adminId, approvalNotes);
  return result;
};

const rejectContainer = async (containerId, adminId, rejectionReason) => {
  const container = await repo.getContainerById(containerId);
  if (!container) throw new Error('Container not found');
  
  if (container.container_approval_status !== 'pending') {
    throw new Error('Container is not pending approval');
  }
  
  const result = await repo.rejectContainer(containerId, adminId, rejectionReason);
  return result;
};

const getApprovedContainers = async () => {
  return await repo.getApprovedContainers();
};

const updateUserAndProfileApproval = async (userId, is_approved) => {
  // Allow only true or false when updating
  if (is_approved !== true && is_approved !== false) {
    throw new Error('Invalid is_approved value. Must be true (approved) or false (rejected).');
  }

  return await repo.updateUserAndProfileApproval(userId, is_approved);
};

const approveUser = async (userId, adminId) => {
  return await repo.approveUser(userId, adminId);
};

const rejectUser = async (userId, adminId, rejectionReason) => {
  return await repo.rejectUser(userId, adminId, rejectionReason);
};

const deleteUser = async (id) => {
  return await repo.deleteUser(id);
};

// -------------------- Bookings --------------------
const getAllBookings = async () => {
  return await repo.fetchAllBookings();
};

const getBookingById = async (id) => {
  const booking = await repo.fetchBookingById(id);
  if (!booking) throw new Error('Booking not found');
  return booking;
};

const deleteBooking = async (id) => {
  return await repo.deleteBooking(id);
};

// LSP Management
const getLSPs = async (status = null) => {
  return await repo.fetchLSPs(status);
};

const getLSPById = async (id) => {
  const lsp = await repo.fetchLSPById(id);
  if (!lsp) throw new Error('LSP not found');
  return lsp;
};

const approveLSP = async (lspId, adminId) => {
  return await repo.approveLSP(lspId, adminId);
};

const rejectLSP = async (lspId, reason, adminId) => {
  return await repo.rejectLSP(lspId, reason, adminId);
};

const verifyLSP = async (id, { is_verified, verification_status }) => {
  return await repo.verifyLSP(id, { is_verified, verification_status });
};

// Shipments
const getAllShipments = async () => {
  return await repo.fetchAllShipments();
};

const getShipmentById = async (id) => {
  const shipment = await repo.fetchShipmentById(id);
  if (!shipment) throw new Error('Shipment not found');
  return shipment;
};

// Complaints
const getAllComplaints = async () => {
  return await repo.fetchAllComplaints();
};

const getComplaintById = async (id) => {
  const complaint = await repo.fetchComplaintById(id);
  if (!complaint) throw new Error('Complaint not found');
  return complaint;
};

const resolveComplaint = async (id, { status, resolution }) => {
  return await repo.resolveComplaint(id, { status, resolution });
};

module.exports = {
  // Auth
  login,

  // Dashboard
  getDashboardStats,

  // Containers
  getAllContainers,
  getContainerById,
  updateContainerStatus,
  deleteContainer,
  
  // Container Approval Management
  getContainersForApproval,
  getContainerForApproval,
  approveContainer,
  rejectContainer,
  getApprovedContainers,

  // Container Types
  getContainerTypes,
  createContainerType,
  updateContainerType,
  deleteContainerType,

  // Users
  getUsers,
  getUserById,
  getTraderById,
  generateTraderVerificationPDF,
  updateTraderDocument,
  updateUserAndProfileApproval,
  approveUser,
  rejectUser,
  deleteUser,

  // Bookings
  getAllBookings,
  getBookingById,
  deleteBooking,

  // LSP Management
  getLSPs,
  getLSPById,
  approveLSP,
  rejectLSP,
  verifyLSP,

  // Shipments
  getAllShipments,
  getShipmentById,

  // Complaints
  getAllComplaints,
  getComplaintById,
  resolveComplaint
};
