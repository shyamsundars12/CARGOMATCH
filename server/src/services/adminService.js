const jwt = require('jsonwebtoken');
const repo = require('../repository/adminRepository');
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

  // Generate JWT
  const token = jwt.sign(
    { role: "ADMIN" },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    message: "Admin login successful",
    token,
    user: { email, role: "admin" }
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
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status.toUpperCase())) {
    throw new Error('Invalid status');
  }
  return await repo.updateContainerStatus(id, status.toLowerCase());
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

const updateUserAndProfileApproval = async (userId, is_approved) => {
  if (typeof is_approved !== 'boolean') {
    throw new Error('Invalid is_approved value');
  }
  return await repo.updateUserAndProfileApproval(userId, is_approved);
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

  // Container Types
  getContainerTypes,
  createContainerType,
  updateContainerType,
  deleteContainerType,

  // Users
  getUsers,
  getUserById,
  updateUserAndProfileApproval,
  deleteUser,

  // Bookings
  getAllBookings,
  getBookingById,
  deleteBooking
};
