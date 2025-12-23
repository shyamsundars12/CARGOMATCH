const traderRepository = require("../repository/traderRepository");

// Search approved containers with filters
const searchApprovedContainers = async (filters = {}) => {
  return await traderRepository.getApprovedContainersForTraders(filters);
};

// Get approved container by ID
const getApprovedContainerById = async (containerId) => {
  const container = await traderRepository.getApprovedContainerById(containerId);
  return container;
};

// Create booking
const createBooking = async (bookingData) => {
  const {
    user_id,
    container_id,
    weight,
    volume,
    booked_units,
    notes,
    documents,
    shipment_details,
  } = bookingData;

  // Validate required fields
  if (!user_id || !container_id || !weight || !volume || !booked_units) {
    throw new Error("Missing required booking information");
  }

  // Validate numeric fields
  if (isNaN(weight) || weight <= 0) {
    throw new Error("Weight must be a positive number");
  }
  if (isNaN(volume) || volume <= 0) {
    throw new Error("Volume must be a positive number");
  }
  if (isNaN(booked_units) || booked_units <= 0 || !Number.isInteger(Number(booked_units))) {
    throw new Error("Booked units must be a positive integer");
  }

  // Check if container exists and is approved
  const container = await traderRepository.getApprovedContainerById(containerId);
  if (!container) {
    throw new Error("Container not found or not approved for booking");
  }

  // Check if container has available capacity
  if (!container.is_available) {
    throw new Error("Container is not available for booking");
  }

  // Calculate total price
  const totalPrice = (container.price_per_unit || 0) * booked_units;

  const booking = await traderRepository.createBooking({
    user_id,
    container_id,
    lsp_id: container.lsp_id,
    weight,
    volume,
    booked_units,
    total_price: totalPrice,
    notes,
    documents: documents || null,
    shipment_details: shipment_details || null,
  });

  return booking;
};

// Get trader's own bookings
const getMyBookings = async (userId, filters = {}) => {
  return await traderRepository.getBookingsByTrader(userId, filters);
};

// Get booking by ID (only if it belongs to the trader)
const getBookingById = async (bookingId, userId) => {
  const booking = await traderRepository.getBookingById(bookingId, userId);
  return booking;
};

module.exports = {
  searchApprovedContainers,
  getApprovedContainerById,
  createBooking,
  getMyBookings,
  getBookingById,
};
