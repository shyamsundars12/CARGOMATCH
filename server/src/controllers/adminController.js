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
    const user = await adminService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_approved } = req.body;

    if (typeof is_approved === 'undefined') {
      return res.status(400).json({ error: 'is_approved is required' });
    }

    // Call service to update user and lsp profile approval status
    const updatedUser = await adminService.updateUserAndProfileApproval(userId, is_approved);

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await adminService.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json(deleted);
  } catch (err) {
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
