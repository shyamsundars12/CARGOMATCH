const db = require("../config/db");

// Get approved containers for traders to search and book
exports.getApprovedContainersForTraders = async (filters = {}) => {
  let query = `
    SELECT 
      c.id,
      c.container_number,
      c.size,
      c.type,
      c.capacity,
      c.current_location,
      c.status,
      c.is_available,
      c.departure_date,
      c.arrival_date,
      c.origin_port,
      c.destination_port,
      c.route_description,
      c.price_per_unit,
      c.currency,
      c.length,
      c.width,
      c.height,
      c.weight,
      c.created_at,
      c.used_volume,
      c.used_weight,
      ct.type_name,
      ct.description as container_type_description,
      lp.company_name as lsp_company_name,
      u.first_name || ' ' || u.last_name as lsp_contact_name,
      u.email as lsp_email,
      u.phone_number as lsp_phone,
      (c.capacity - COALESCE(c.used_volume, 0)) as available_capacity,
      (c.weight - COALESCE(c.used_weight, 0)) as available_weight
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.container_approval_status = 'approved' 
      AND c.is_available = true
      AND (c.departure_date IS NULL OR c.departure_date >= CURRENT_DATE)
  `;

  const params = [];
  let paramCount = 0;

  if (filters.origin_port) {
    paramCount++;
    query += ` AND c.origin_port ILIKE $${paramCount}`;
    params.push(`%${filters.origin_port}%`);
  }

  if (filters.destination_port) {
    paramCount++;
    query += ` AND c.destination_port ILIKE $${paramCount}`;
    params.push(`%${filters.destination_port}%`);
  }

  if (filters.container_type_id) {
    paramCount++;
    query += ` AND c.container_type_id = $${paramCount}`;
    params.push(filters.container_type_id);
  }

  if (filters.size) {
    paramCount++;
    query += ` AND c.size = $${paramCount}`;
    params.push(filters.size);
  }

  if (filters.type) {
    paramCount++;
    query += ` AND c.type ILIKE $${paramCount}`;
    params.push(`%${filters.type}%`);
  }

  if (filters.departure_date) {
    paramCount++;
    query += ` AND DATE(c.departure_date) = $${paramCount}`;
    params.push(filters.departure_date);
  }

  if (filters.min_price) {
    paramCount++;
    query += ` AND c.price_per_unit >= $${paramCount}`;
    params.push(filters.min_price);
  }

  if (filters.max_price) {
    paramCount++;
    query += ` AND c.price_per_unit <= $${paramCount}`;
    params.push(filters.max_price);
  }

  query += ` ORDER BY c.created_at DESC, c.departure_date ASC`;

  const result = await db.query(query, params);
  return result.rows;
};

// Get approved container by ID (only for approved containers)
exports.getApprovedContainerById = async (containerId) => {
  const query = `
    SELECT 
      c.*,
      ct.type_name,
      ct.description as container_type_description,
      lp.company_name as lsp_company_name,
      u.first_name || ' ' || u.last_name as lsp_contact_name,
      u.email as lsp_email,
      u.phone_number as lsp_phone,
      (c.capacity - COALESCE(c.used_volume, 0)) as available_capacity,
      (c.weight - COALESCE(c.used_weight, 0)) as available_weight
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.id = $1 
      AND c.container_approval_status = 'approved'
  `;

  const result = await db.query(query, [containerId]);
  return result.rows[0] || null;
};

// Create booking
exports.createBooking = async (bookingData) => {
  const {
    user_id,
    container_id,
    lsp_id,
    weight,
    volume,
    booked_units,
    total_price,
    notes,
    documents,
    shipment_details,
    status, // Allow status from mobile app but normalize it
  } = bookingData;

  // Normalize status: accept 'pending', 'pending_approval', or any variation, but store consistently
  let normalizedStatus = 'pending';
  if (status) {
    const statusLower = status.toLowerCase().trim();
    if (statusLower === 'pending_approval' || statusLower === 'pending') {
      normalizedStatus = 'pending'; // Store as 'pending' for consistency
    } else {
      normalizedStatus = statusLower;
    }
  }

  const query = `
    INSERT INTO bookings (
      user_id,
      container_id,
      lsp_id,
      weight,
      volume,
      booked_units,
      total_price,
      status,
      payment_status,
      notes,
      documents,
      shipment_details,
      booking_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $11, 'pending', $8, $9, $10, CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const result = await db.query(query, [
    user_id,
    container_id,
    lsp_id,
    weight,
    volume,
    booked_units,
    total_price,
    notes || null,
    documents ? JSON.stringify(documents) : null,
    shipment_details ? JSON.stringify(shipment_details) : null,
    normalizedStatus,
  ]);

  return result.rows[0];
};

// Get bookings by trader
exports.getBookingsByTrader = async (userId, filters = {}) => {
  let query = `
    SELECT 
      b.*,
      c.container_number,
      c.size,
      c.type,
      c.origin_port,
      c.destination_port,
      c.departure_date,
      c.arrival_date,
      lp.company_name as lsp_company_name,
      u.first_name || ' ' || u.last_name as lsp_contact_name,
      u.email as lsp_email,
      u.phone_number as lsp_phone
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN lsp_profiles lp ON b.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE b.user_id = $1
  `;

  const params = [userId];
  let paramCount = 1;

  if (filters.status) {
    paramCount++;
    query += ` AND b.status = $${paramCount}`;
    params.push(filters.status);
  }

  if (filters.container_id) {
    paramCount++;
    query += ` AND b.container_id = $${paramCount}`;
    params.push(filters.container_id);
  }

  if (filters.payment_status) {
    paramCount++;
    query += ` AND b.payment_status = $${paramCount}`;
    params.push(filters.payment_status);
  }

  query += ` ORDER BY b.created_at DESC`;

  const result = await db.query(query, params);
  return result.rows;
};

// Get booking by ID (only if it belongs to the trader)
exports.getBookingById = async (bookingId, userId) => {
  const query = `
    SELECT 
      b.*,
      c.container_number,
      c.size,
      c.type,
      c.origin_port,
      c.destination_port,
      c.departure_date,
      c.arrival_date,
      c.price_per_unit,
      c.currency,
      lp.company_name as lsp_company_name,
      lp.address as lsp_address,
      u.first_name || ' ' || u.last_name as lsp_contact_name,
      u.email as lsp_email,
      u.phone_number as lsp_phone
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN lsp_profiles lp ON b.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE b.id = $1 AND b.user_id = $2
  `;

  const result = await db.query(query, [bookingId, userId]);
  return result.rows[0] || null;
};
