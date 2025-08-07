const db = require('../config/db');

// LSP Profile Management
exports.createLSPProfile = async (profileData) => {
  const {
    user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate,
    gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path
  } = profileData;
  
  const query = `
    INSERT INTO lsp_profiles (
      user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate,
      gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  
  const result = await db.query(query, [
    user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate,
    gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path
  ]);
  return result.rows[0];
};

exports.getLSPProfileByUserId = async (userId) => {
  const query = `
    SELECT lp.*, u.name, u.email, u.role, u.is_approved
    FROM lsp_profiles lp
    JOIN users u ON lp.user_id = u.id
    WHERE lp.user_id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

exports.updateLSPProfile = async (profileId, updateData) => {
  const { company_name, phone, address, business_license, insurance_certificate } = updateData;
  
  const query = `
    UPDATE lsp_profiles 
    SET company_name = $1, phone = $2, address = $3, business_license = $4, insurance_certificate = $5, updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *
  `;
  
  const result = await db.query(query, [company_name, phone, address, business_license, insurance_certificate, profileId]);
  return result.rows[0];
};

exports.updateLSPVerificationStatus = async (profileId, status, isVerified) => {
  const query = `
    UPDATE lsp_profiles 
    SET verification_status = $1, is_verified = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await db.query(query, [status, isVerified, profileId]);
  return result.rows[0];
};

// Container Management
exports.createContainer = async (containerData) => {
  const { lsp_id, container_type_id, container_number, size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency } = containerData;
  
  const query = `
    INSERT INTO containers (lsp_id, container_type_id, container_number, size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;
  
  const result = await db.query(query, [lsp_id, container_type_id, container_number, size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency]);
  return result.rows[0];
};

exports.getContainersByLSP = async (lspId, filters = {}) => {
  let query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    WHERE c.lsp_id = $1
  `;
  
  const params = [lspId];
  let paramCount = 1;
  
  if (filters.status) {
    paramCount++;
    query += ` AND c.status = $${paramCount}`;
    params.push(filters.status);
  }
  
  if (filters.is_available !== undefined) {
    paramCount++;
    query += ` AND c.is_available = $${paramCount}`;
    params.push(filters.is_available);
  }
  
  if (filters.type) {
    paramCount++;
    query += ` AND c.type = $${paramCount}`;
    params.push(filters.type);
  }
  
  if (filters.size) {
    paramCount++;
    query += ` AND c.size = $${paramCount}`;
    params.push(filters.size);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.getContainerById = async (containerId, lspId = null) => {
  let query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    WHERE c.id = $1
  `;
  
  const params = [containerId];
  
  if (lspId) {
    query += ` AND c.lsp_id = $2`;
    params.push(lspId);
  }
  
  const result = await db.query(query, params);
  return result.rows[0];
};

exports.updateContainer = async (containerId, updateData, lspId = null) => {
  const { size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency, is_available, status } = updateData;
  
  let query = `
    UPDATE containers 
    SET size = $1, type = $2, capacity = $3, current_location = $4, departure_date = $5, arrival_date = $6, 
        origin_port = $7, destination_port = $8, route_description = $9, price_per_unit = $10, currency = $11, 
        is_available = $12, status = $13, updated_at = CURRENT_TIMESTAMP
    WHERE id = $14
  `;
  
  const params = [size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency, is_available, status, containerId];
  
  if (lspId) {
    query += ` AND lsp_id = $15`;
    params.push(lspId);
  }
  
  query += ` RETURNING *`;
  
  const result = await db.query(query, params);
  return result.rows[0];
};

exports.deleteContainer = async (containerId, lspId) => {
  const query = `
    DELETE FROM containers 
    WHERE id = $1 AND lsp_id = $2
    RETURNING *
  `;
  
  const result = await db.query(query, [containerId, lspId]);
  return result.rows[0];
};

// Booking Management
exports.getBookingsByLSP = async (lspId, filters = {}) => {
  let query = `
    SELECT b.*, c.container_number, c.size, c.type, c.origin_port, c.destination_port,
           u1.name as importer_name, u1.email as importer_email,
           u2.name as exporter_name, u2.email as exporter_email
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN users u1 ON b.importer_id = u1.id
    LEFT JOIN users u2 ON b.exporter_id = u2.id
    WHERE c.lsp_id = $1
  `;
  
  const params = [lspId];
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
  
  query += ` ORDER BY b.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.getBookingById = async (bookingId, lspId = null) => {
  let query = `
    SELECT b.*, c.container_number, c.size, c.type, c.origin_port, c.destination_port,
           u1.name as importer_name, u1.email as importer_email,
           u2.name as exporter_name, u2.email as exporter_email
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN users u1 ON b.importer_id = u1.id
    LEFT JOIN users u2 ON b.exporter_id = u2.id
    WHERE b.id = $1
  `;
  
  const params = [bookingId];
  
  if (lspId) {
    query += ` AND c.lsp_id = $2`;
    params.push(lspId);
  }
  
  const result = await db.query(query, params);
  return result.rows[0];
};

exports.updateBookingStatus = async (bookingId, status, lspId = null) => {
  let query = `
    UPDATE bookings 
    SET status = $1, updated_at = CURRENT_TIMESTAMP
  `;
  
  const params = [status, bookingId];
  
  if (status === 'approved') {
    query += `, approved_at = CURRENT_TIMESTAMP`;
  } else if (status === 'closed') {
    query += `, closed_at = CURRENT_TIMESTAMP`;
  }
  
  query += ` WHERE id = $2`;
  
  if (lspId) {
    query += ` AND container_id IN (SELECT id FROM containers WHERE lsp_id = $3)`;
    params.push(lspId);
  }
  
  query += ` RETURNING *`;
  
  const result = await db.query(query, params);
  return result.rows[0];
};

// Shipment Management
exports.createShipment = async (shipmentData) => {
  const { booking_id, container_id, lsp_id, shipment_number, departure_port, arrival_port, estimated_arrival_date } = shipmentData;
  
  const query = `
    INSERT INTO shipments (booking_id, container_id, lsp_id, shipment_number, departure_port, arrival_port, estimated_arrival_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const result = await db.query(query, [booking_id, container_id, lsp_id, shipment_number, departure_port, arrival_port, estimated_arrival_date]);
  return result.rows[0];
};

exports.getShipmentsByLSP = async (lspId, filters = {}) => {
  let query = `
    SELECT s.*, b.booking_date, b.departure_date, b.arrival_date, b.cargo_type,
           c.container_number, c.size, c.type,
           u1.name as importer_name, u1.email as importer_email,
           u2.name as exporter_name, u2.email as exporter_email
    FROM shipments s
    JOIN bookings b ON s.booking_id = b.id
    JOIN containers c ON s.container_id = c.id
    LEFT JOIN users u1 ON b.importer_id = u1.id
    LEFT JOIN users u2 ON b.exporter_id = u2.id
    WHERE s.lsp_id = $1
  `;
  
  const params = [lspId];
  let paramCount = 1;
  
  if (filters.status) {
    paramCount++;
    query += ` AND s.status = $${paramCount}`;
    params.push(filters.status);
  }
  
  if (filters.booking_id) {
    paramCount++;
    query += ` AND s.booking_id = $${paramCount}`;
    params.push(filters.booking_id);
  }
  
  query += ` ORDER BY s.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.updateShipmentStatus = async (shipmentId, status, location, description, updatedBy, lspId = null) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update shipment status
    let updateQuery = `
      UPDATE shipments 
      SET status = $1, current_location = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    
    const updateParams = [status, location, shipmentId];
    
    if (lspId) {
      updateQuery += ` AND lsp_id = $4`;
      updateParams.push(lspId);
    }
    
    updateQuery += ` RETURNING *`;
    
    const updateResult = await client.query(updateQuery, updateParams);
    
    // Add status history
    const historyQuery = `
      INSERT INTO shipment_status_history (shipment_id, status, location, description, updated_by)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(historyQuery, [shipmentId, status, location, description, updatedBy]);
    
    await client.query('COMMIT');
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Complaint Management
exports.getComplaintsByLSP = async (lspId, filters = {}) => {
  let query = `
    SELECT c.*, b.booking_date, cont.container_number,
           u.name as complainant_name, u.email as complainant_email,
           r.name as resolver_name
    FROM complaints c
    JOIN bookings b ON c.booking_id = b.id
    JOIN containers cont ON c.container_id = cont.id
    JOIN users u ON c.complainant_id = u.id
    LEFT JOIN users r ON c.resolved_by = r.id
    WHERE c.lsp_id = $1
  `;
  
  const params = [lspId];
  let paramCount = 1;
  
  if (filters.status) {
    paramCount++;
    query += ` AND c.status = $${paramCount}`;
    params.push(filters.status);
  }
  
  if (filters.priority) {
    paramCount++;
    query += ` AND c.priority = $${paramCount}`;
    params.push(filters.priority);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.updateComplaintStatus = async (complaintId, status, resolution, resolvedBy, lspId) => {
  const query = `
    UPDATE complaints 
    SET status = $1, resolution = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 AND lsp_id = $5
    RETURNING *
  `;
  
  const result = await db.query(query, [status, resolution, resolvedBy, complaintId, lspId]);
  return result.rows[0];
};

// Notification Management
exports.createNotification = async (notificationData) => {
  const { user_id, title, message, type, related_entity_type, related_entity_id } = notificationData;
  
  const query = `
    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const result = await db.query(query, [user_id, title, message, type, related_entity_type, related_entity_id]);
  return result.rows[0];
};

exports.getNotificationsByUser = async (userId, filters = {}) => {
  let query = `
    SELECT * FROM notifications 
    WHERE user_id = $1
  `;
  
  const params = [userId];
  let paramCount = 1;
  
  if (filters.is_read !== undefined) {
    paramCount++;
    query += ` AND is_read = $${paramCount}`;
    params.push(filters.is_read);
  }
  
  if (filters.type) {
    paramCount++;
    query += ` AND type = $${paramCount}`;
    params.push(filters.type);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.markNotificationAsRead = async (notificationId, userId) => {
  const query = `
    UPDATE notifications 
    SET is_read = true 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await db.query(query, [notificationId, userId]);
  return result.rows[0];
};

// Cron job helpers
exports.getBookingsToClose = async () => {
  const query = `
    SELECT b.*, c.lsp_id
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    WHERE b.status = 'approved' 
    AND b.departure_date = CURRENT_DATE + INTERVAL '1 day'
    AND b.closed_at IS NULL
  `;
  
  const result = await db.query(query);
  return result.rows;
};

exports.getContainerTypes = async () => {
  const query = `SELECT * FROM container_types ORDER BY type_name, size`;
  const result = await db.query(query);
  return result.rows;
}; 