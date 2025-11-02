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
      gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path,
      is_verified, verification_status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
    RETURNING *
  `;
  
  const result = await db.query(query, [
    user_id, company_name, pan_number, gst_number, company_registration, phone, address, business_license, insurance_certificate,
    gst_certificate_path, company_registration_doc_path, business_license_doc_path, insurance_certificate_doc_path,
    false, 'pending'
  ]);
  return result.rows[0];
};

exports.getLSPProfileByUserId = async (userId) => {
  const query = `
    SELECT lp.*, u.first_name || ' ' || u.last_name as name, u.email, 'lsp' as role, u.is_active as is_approved
    FROM lsp_profiles lp
    JOIN users u ON lp.user_id = u.id
    WHERE lp.user_id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

exports.getLSPProfileByLspId = async (lspId) => {
  const query = `
    SELECT lp.*, u.first_name || ' ' || u.last_name as name, u.email, 'lsp' as role, u.is_active as is_approved
    FROM lsp_profiles lp
    JOIN users u ON lp.user_id = u.id
    WHERE lp.id = $1
  `;
  
  const result = await db.query(query, [lspId]);
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
  const { lsp_id, container_type_id, container_number, size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency, length, width, height, weight, container_documents } = containerData;
  
  // All containers created by LSP start with 'pending' approval status
  const query = `
    INSERT INTO containers (lsp_id, container_type_id, container_number, size, type, capacity, current_location, departure_date, arrival_date, origin_port, destination_port, route_description, price_per_unit, currency, length, width, height, weight, container_documents, container_approval_status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *
  `;
  
  const result = await db.query(query, [
    lsp_id, 
    container_type_id, 
    container_number, 
    size, 
    type, 
    capacity, 
    current_location, 
    departure_date, 
    arrival_date, 
    origin_port, 
    destination_port, 
    route_description, 
    price_per_unit, 
    currency || 'INR', 
    length, 
    width, 
    height, 
    weight, 
    container_documents || '{}',
    'pending'  // Always start with pending approval status
  ]);
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
  
  if (filters.approval_status) {
    paramCount++;
    query += ` AND c.container_approval_status = $${paramCount}`;
    params.push(filters.approval_status);
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
  // First check if container is approved - if so, prevent editing
  const checkQuery = `
    SELECT container_approval_status, lsp_id
    FROM containers
    WHERE id = $1
  `;
  const checkResult = await db.query(checkQuery, [containerId]);
  
  if (checkResult.rows.length === 0) {
    throw new Error('Container not found');
  }
  
  const container = checkResult.rows[0];
  
  // Prevent editing if container is approved
  if (container.container_approval_status === 'approved') {
    throw new Error('Cannot modify container after admin approval. Container is locked.');
  }
  
  // Check LSP ownership if lspId is provided
  if (lspId && container.lsp_id !== lspId) {
    throw new Error('Access denied. You can only modify your own containers.');
  }
  
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
  // First check if container is approved - if so, prevent deletion
  const checkQuery = `
    SELECT container_approval_status, lsp_id
    FROM containers
    WHERE id = $1
  `;
  const checkResult = await db.query(checkQuery, [containerId]);
  
  if (checkResult.rows.length === 0) {
    throw new Error('Container not found');
  }
  
  const container = checkResult.rows[0];
  
  // Prevent deletion if container is approved
  if (container.container_approval_status === 'approved') {
    throw new Error('Cannot delete container after admin approval. Container is locked.');
  }
  
  // Check LSP ownership
  if (container.lsp_id !== lspId) {
    throw new Error('Access denied. You can only delete your own containers.');
  }
  
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
    SELECT 
      b.*, 
      c.container_number, 
      c.size as container_size, 
      c.type as container_type, 
      c.origin_port, 
      c.destination_port,
      COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as user_name,
      u.email as user_email,
      u.company_name as user_company_name,
      b.weight as cargo_weight,
      b.volume as cargo_volume,
      CASE 
        WHEN b.shipment_details IS NOT NULL AND b.shipment_details::text != '{}'::text
        THEN COALESCE(b.shipment_details->>'cargo_type', b.shipment_details->>'type', 'General')
        ELSE 'General'
      END as cargo_type
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE c.lsp_id = $1
  `;
  
  const params = [lspId];
  let paramCount = 1;
  
  if (filters.status) {
    paramCount++;
    // Handle both 'pending' and 'pending_approval' status values
    if (filters.status.toLowerCase() === 'pending' || filters.status.toLowerCase() === 'pending_approval') {
      query += ` AND LOWER(TRIM(b.status)) IN ('pending', 'pending_approval')`;
    } else {
      query += ` AND LOWER(TRIM(b.status)) = $${paramCount}`;
      params.push(filters.status.toLowerCase());
    }
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
    SELECT 
      b.*, 
      c.container_number, 
      c.size as container_size, 
      c.type as container_type, 
      c.origin_port, 
      c.destination_port,
      COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as user_name,
      u.email as user_email,
      u.company_name as user_company_name,
      u.phone_number as user_phone,
      b.weight as cargo_weight,
      b.volume as cargo_volume,
      CASE 
        WHEN b.shipment_details IS NOT NULL AND b.shipment_details::text != '{}'::text
        THEN COALESCE(b.shipment_details->>'cargo_type', b.shipment_details->>'type', 'General')
        ELSE 'General'
      END as cargo_type
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN users u ON b.user_id = u.id
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

exports.updateBookingStatus = async (bookingId, status, lspId = null, notes = null) => {
  // First check if booking exists and belongs to this LSP, and is in a pending state
  let checkQuery = `
    SELECT b.id, b.status, c.lsp_id
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    WHERE b.id = $1
  `;
  
  const checkParams = [bookingId];
  if (lspId) {
    checkQuery += ` AND c.lsp_id = $2`;
    checkParams.push(lspId);
  }
  
  const checkResult = await db.query(checkQuery, checkParams);
  
  if (checkResult.rows.length === 0) {
    throw new Error('Booking not found or access denied');
  }
  
  const booking = checkResult.rows[0];
  
  // Only allow updating bookings that are in pending state (for approval/rejection)
  const currentStatus = booking.status.toLowerCase().trim();
  if (currentStatus !== 'pending' && currentStatus !== 'pending_approval') {
    throw new Error(`Cannot update booking with status '${booking.status}'. Only pending bookings can be approved or rejected.`);
  }
  
  let query = `
    UPDATE bookings 
    SET status = $1, updated_at = CURRENT_TIMESTAMP
  `;
  
  const params = [status, bookingId];
  let paramCount = 2;
  
  // Note: approved_at and closed_at columns don't exist in current schema
  // If needed, add them to the database schema first
  // For now, we just update the status
  
  if (notes) {
    paramCount++;
    query += `, notes = $${paramCount}`;
    params.push(notes);
  }
  
  query += ` WHERE id = $2`;
  
  if (lspId) {
    paramCount++;
    query += ` AND container_id IN (SELECT id FROM containers WHERE lsp_id = $${paramCount})`;
    params.push(lspId);
  }
  
  query += ` RETURNING *`;
  
  const result = await db.query(query, params);
  
  if (result.rows.length === 0) {
    throw new Error('Failed to update booking status');
  }
  
  return result.rows[0];
};

exports.getPendingBookings = async (lspId) => {
  const query = `
    SELECT 
      b.*, 
      c.container_number, 
      c.size as container_size, 
      c.type as container_type, 
      c.origin_port, 
      c.destination_port,
      COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as user_name,
      u.email as user_email,
      u.company_name as user_company_name,
      u.phone_number as user_phone,
      b.weight as cargo_weight,
      b.volume as cargo_volume,
      CASE 
        WHEN b.shipment_details IS NOT NULL AND b.shipment_details::text != '{}'::text
        THEN COALESCE(b.shipment_details->>'cargo_type', b.shipment_details->>'type', 'General')
        ELSE 'General'
      END as cargo_type
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE c.lsp_id = $1 
      AND LOWER(TRIM(b.status)) IN ('pending', 'pending_approval')
      AND b.status NOT IN ('approved', 'rejected', 'confirmed', 'closed', 'cancelled')
    ORDER BY b.created_at DESC
  `;
  
  const result = await db.query(query, [lspId]);
  return result.rows;
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
    SELECT s.*, b.booking_date, b.departure_date, b.arrival_date, b.shipment_details,
           c.container_number, c.size, c.type,
           u.first_name || ' ' || u.last_name as user_name, u.email as user_email
    FROM shipments s
    JOIN bookings b ON s.booking_id = b.id
    JOIN containers c ON s.container_id = c.id
    LEFT JOIN users u ON b.user_id = u.id
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
           u.first_name || ' ' || u.last_name as complainant_name, u.email as complainant_email
    FROM complaints c
    LEFT JOIN bookings b ON c.booking_id = b.id
    LEFT JOIN containers cont ON b.container_id = cont.id
    LEFT JOIN users u ON COALESCE(c.user_id, c.complainant_id) = u.id
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
  // First check if complaint exists and belongs to this LSP
  const checkQuery = `
    SELECT id, user_id, complainant_id, lsp_id, title, status
    FROM complaints
    WHERE id = $1 AND lsp_id = $2
  `;
  
  const checkResult = await db.query(checkQuery, [complaintId, lspId]);
  
  if (checkResult.rows.length === 0) {
    return null;
  }
  
  const complaint = checkResult.rows[0];
  
  // Update complaint - handle resolved_by column (may or may not exist)
  // First try with resolved_by, if it fails, try without it
  let updateQuery = `
    UPDATE complaints 
    SET status = $1, resolution = $2, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  `;
  
  let params = [status, resolution];
  
  // Add resolved_by if provided (check if column exists in schema)
  // For now, we'll try to add it and let the database tell us if it doesn't exist
  if (resolvedBy) {
    updateQuery += `, resolved_by = $3`;
    params.push(resolvedBy);
    params.push(complaintId);
    params.push(lspId);
    updateQuery += ` WHERE id = $4 AND lsp_id = $5 RETURNING *`;
  } else {
    params.push(complaintId);
    params.push(lspId);
    updateQuery += ` WHERE id = $3 AND lsp_id = $4 RETURNING *`;
  }
  
  let result;
  try {
    result = await db.query(updateQuery, params);
  } catch (error) {
    // If resolved_by column doesn't exist, try without it
    if (error.message && error.message.includes('resolved_by')) {
      console.log('resolved_by column does not exist, updating without it');
      updateQuery = `
        UPDATE complaints 
        SET status = $1, resolution = $2, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND lsp_id = $4
        RETURNING *
      `;
      result = await db.query(updateQuery, [status, resolution, complaintId, lspId]);
    } else {
      throw error;
    }
  }
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Return complaint with both user_id and complainant_id for compatibility
  const updatedComplaint = result.rows[0];
  updatedComplaint.complainant_id = updatedComplaint.user_id || updatedComplaint.complainant_id;
  updatedComplaint.user_id = updatedComplaint.complainant_id || updatedComplaint.user_id;
  
  return updatedComplaint;
};

// Notification Management
exports.createNotification = async (notificationData) => {
  const { user_id, title, message, body, type, related_entity_type, related_entity_id } = notificationData;
  
  // Handle both 'message' and 'body' fields for notification content
  const notificationMessage = message || body || title;
  
  // Check which columns exist - try with 'message' first, fallback to 'body'
  let query = `
    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [user_id, title, notificationMessage, type, related_entity_type, related_entity_id]);
    return result.rows[0];
  } catch (error) {
    // If 'message' column doesn't exist, try 'body'
    if (error.message && error.message.includes('message')) {
      query = `
        INSERT INTO notifications (user_id, title, body, type, related_entity_type, related_entity_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await db.query(query, [user_id, title, notificationMessage, type, related_entity_type, related_entity_id]);
      return result.rows[0];
    }
    throw error;
  }
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

// Analytics & Performance Metrics
exports.getContainerStats = async (lspId) => {
  const query = `
    SELECT 
      COUNT(*) as total_containers,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available_containers,
      COUNT(CASE WHEN status = 'booked' THEN 1 END) as booked_containers,
      COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_containers,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_containers
    FROM containers 
    WHERE lsp_id = $1
  `;
  
  const result = await db.query(query, [lspId]);
  return result.rows[0];
};

exports.getBookingStats = async (lspId) => {
  const query = `
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(CASE WHEN LOWER(TRIM(b.status)) IN ('pending', 'pending_approval') THEN 1 END) as pending_bookings,
      COUNT(CASE WHEN b.status = 'approved' THEN 1 END) as approved_bookings,
      COUNT(CASE WHEN b.status = 'closed' THEN 1 END) as closed_bookings,
      COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    WHERE c.lsp_id = $1
  `;
  
  const result = await db.query(query, [lspId]);
  return result.rows[0];
};

exports.getShipmentStats = async (lspId) => {
  const query = `
    SELECT 
      COUNT(*) as total_shipments,
      COUNT(CASE WHEN s.status = 'scheduled' THEN 1 END) as scheduled_shipments,
      COUNT(CASE WHEN s.status = 'in_transit' THEN 1 END) as in_transit_shipments,
      COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) as delivered_shipments,
      COUNT(CASE WHEN s.status = 'closed' THEN 1 END) as closed_shipments
    FROM shipments s
    WHERE s.lsp_id = $1
  `;
  
  const result = await db.query(query, [lspId]);
  return result.rows[0];
};

exports.getRevenueData = async (lspId) => {
  const query = `
    SELECT 
      COALESCE(SUM(c.price_per_unit), 0) as total_revenue,
      COALESCE(AVG(c.price_per_unit), 0) as average_price,
      COUNT(DISTINCT b.id) as total_bookings,
      COALESCE(SUM(c.price_per_unit) / NULLIF(COUNT(DISTINCT b.id), 0), 0) as revenue_per_booking
    FROM containers c
    LEFT JOIN bookings b ON c.id = b.container_id AND b.status = 'approved'
    WHERE c.lsp_id = $1
  `;
  
  const result = await db.query(query, [lspId]);
  return result.rows[0];
};

exports.getRecentActivity = async (lspId) => {
  const query = `
    SELECT 
      'container' as type,
      container_number as title,
      'Container created' as description,
      created_at as timestamp
    FROM containers 
    WHERE lsp_id = $1
    
    UNION ALL
    
    SELECT 
      'booking' as type,
      'Booking #' || b.id as title,
      'New booking received' as description,
      b.created_at as timestamp
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    WHERE c.lsp_id = $1
    
    UNION ALL
    
    SELECT 
      'shipment' as type,
      tracking_number as title,
      'Shipment ' || s.status as description,
      s.created_at as timestamp
    FROM shipments s
    WHERE s.lsp_id = $1
    
    ORDER BY timestamp DESC
    LIMIT 10
  `;
  
  const result = await db.query(query, [lspId]);
  return result.rows;
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

// Container Approval Management
exports.approveContainer = async (containerId, adminId, approvalNotes = null) => {
  const query = `
    UPDATE containers 
    SET container_approval_status = 'approved', 
        approved_by = $1, 
        approved_at = CURRENT_TIMESTAMP,
        approval_notes = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND container_approval_status = 'pending'
    RETURNING *
  `;
  
  const result = await db.query(query, [adminId, approvalNotes, containerId]);
  return result.rows[0];
};

exports.rejectContainer = async (containerId, adminId, rejectionReason) => {
  const query = `
    UPDATE containers 
    SET container_approval_status = 'rejected', 
        approved_by = $1, 
        approved_at = CURRENT_TIMESTAMP,
        approval_notes = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND container_approval_status = 'pending'
    RETURNING *
  `;
  
  const result = await db.query(query, [adminId, rejectionReason, containerId]);
  return result.rows[0];
};

exports.getContainersForApproval = async (filters = {}) => {
  let query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description,
           lp.company_name as lsp_company_name,
           u.first_name || ' ' || u.last_name as lsp_name,
           u.email as lsp_email
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.container_approval_status = 'pending'
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (filters.lsp_id) {
    paramCount++;
    query += ` AND c.lsp_id = $${paramCount}`;
    params.push(filters.lsp_id);
  }
  
  if (filters.container_type_id) {
    paramCount++;
    query += ` AND c.container_type_id = $${paramCount}`;
    params.push(filters.container_type_id);
  }
  
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
  
  query += ` ORDER BY c.created_at ASC`;
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.getApprovedContainers = async (filters = {}) => {
  let query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description,
           lp.company_name as lsp_company_name,
           u.first_name || ' ' || u.last_name as lsp_name,
           u.email as lsp_email
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.container_approval_status = 'approved' AND c.is_available = true
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (filters.lsp_id) {
    paramCount++;
    query += ` AND c.lsp_id = $${paramCount}`;
    params.push(filters.lsp_id);
  }
  
  if (filters.container_type_id) {
    paramCount++;
    query += ` AND c.container_type_id = $${paramCount}`;
    params.push(filters.container_type_id);
  }
  
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
  
  if (filters.size) {
    paramCount++;
    query += ` AND c.size = $${paramCount}`;
    params.push(filters.size);
  }
  
  if (filters.type) {
    paramCount++;
    query += ` AND c.type = $${paramCount}`;
    params.push(filters.type);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
};

exports.updateContainerDocuments = async (containerId, documents, lspId = null) => {
  let query = `
    UPDATE containers 
    SET container_documents = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  
  const params = [documents, containerId];
  
  if (lspId) {
    query += ` AND lsp_id = $3`;
    params.push(lspId);
  }
  
  query += ` RETURNING *`;
  
  const result = await db.query(query, params);
  return result.rows[0];
};
