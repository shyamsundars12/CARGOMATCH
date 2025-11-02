const db = require('../config/db');

// -------------------- Auth --------------------
exports.getAdminUserByEmail = async (email) => {
  const query = 'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND role = $2';
  const result = await db.query(query, [email, 'ADMIN']);
  return result.rows[0] || null;
};

// -------------------- Dashboard --------------------
exports.fetchDashboardStats = async () => {
  const containers = await db.query('SELECT COUNT(*) FROM containers');
  const bookings = await db.query('SELECT COUNT(*) FROM bookings');
  const users = await db.query("SELECT COUNT(*) FROM users");
  const lsps = await db.query("SELECT COUNT(*) FROM lsp_profiles");
  const traders = await db.query("SELECT COUNT(*) FROM users WHERE company_name IS NOT NULL");
  const containerTypes = await db.query("SELECT COUNT(*) FROM container_types");

  return {
    containers: containers.rows[0].count,
    bookings: bookings.rows[0].count,
    users: users.rows[0].count,
    lsps: lsps.rows[0].count,
    traders: traders.rows[0].count,
    containerTypes: containerTypes.rows[0].count
  };
};

// -------------------- Containers --------------------
exports.fetchAllContainers = async (status) => {
  let query = `
    SELECT c.*, ct.type_name, ct.size as container_size, ct.capacity as container_capacity
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
  `;
  const params = [];
  if (status) {
    query += ' WHERE c.status = $1';
    params.push(status);
  }
  query += ' ORDER BY c.created_at DESC';
  const result = await db.query(query, params);
  return result.rows;
};

exports.fetchContainerById = async (id) => {
  const query = `
    SELECT c.*, 
           lp.company_name, lp.phone AS lsp_phone, lp.address AS lsp_address,
           lp.gst_certificate_path, lp.company_registration_doc_path, 
           lp.business_license_doc_path, lp.insurance_certificate_doc_path,
           lp.is_verified, lp.verification_status,
           u.first_name || ' ' || u.last_name AS lsp_name, u.email AS lsp_email, u.is_active AS lsp_is_approved
    FROM containers c
    JOIN lsp_profiles lp ON c.lsp_id = lp.id
    JOIN users u ON lp.user_id = u.id
    WHERE c.id = $1
  `;
  const result = await db.query(query, [id]);
  if (result.rows.length === 0) return null;

  const bookingsQuery = `
    SELECT b.*, u.first_name || ' ' || u.last_name AS trader_name, u.email AS trader_email
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    WHERE b.container_id = $1
  `;
  const bookingsResult = await db.query(bookingsQuery, [id]);

  return {
    container: result.rows[0],
    bookings: bookingsResult.rows
  };
};

exports.updateContainerStatus = async (id, status) => {
  const result = await db.query(
    'UPDATE containers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', 
    [status, id]
  );
  return result.rows[0];
};

exports.deleteContainer = (id) =>
  db.query('DELETE FROM containers WHERE id = $1 RETURNING *', [id])
    .then(res => res.rows[0]);

// -------------------- Container Types --------------------
exports.fetchContainerTypes = async () => {
  const query = `
    SELECT id, type_name, size, capacity, description, created_at
    FROM container_types
    ORDER BY type_name, size
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.createContainerType = async ({ type_name, size, capacity, description }) => {
  const query = `
    INSERT INTO container_types (type_name, size, capacity, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(query, [type_name, size, capacity, description]);
  return result.rows[0];
};

exports.updateContainerType = async (id, { type_name, size, capacity, description }) => {
  const query = `
    UPDATE container_types
    SET type_name = $1, size = $2, capacity = $3, description = $4
    WHERE id = $5
    RETURNING *
  `;
  const result = await db.query(query, [type_name, size, capacity, description, id]);
  return result.rows[0];
};

exports.deleteContainerType = async (id) => {
  const result = await db.query('DELETE FROM container_types WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

// -------------------- Users (Traders Only) --------------------
exports.fetchUsers = async (role = null) => {
  // Fetch only traders/regular users (not LSPs), excluding ADMIN users
  let query = `
    SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 
           'trader' as role,
           u.is_active, u.created_at, u.company_name, u.phone_number,
           u.verification_status, u.city, u.state, u.approval_status,
           u.gst_number, u.pan_number, u.iec_number, u.address, u.pincode
    FROM users u
    LEFT JOIN lsp_profiles lp ON u.id = lp.user_id
    WHERE lp.id IS NULL AND u.role != 'ADMIN'
  `;
  
  // Add status filtering if specified
  if (role && role !== 'ALL') {
    if (role === 'PENDING') {
      query += ` AND u.is_active = false`;
    } else if (role === 'APPROVED') {
      query += ` AND u.is_active = true`;
    } else if (role === 'REJECTED') {
      query += ` AND u.verification_status = 'rejected'`;
    }
  }
  
  query += ` ORDER BY u.created_at DESC`;
  const result = await db.query(query);
  return result.rows;
};

// Get detailed trader information for verification
exports.getTraderById = async (traderId) => {
  try {
    // First check if user exists and if they're an LSP
    const checkQuery = `
      SELECT u.id, u.role, lp.id as lsp_profile_id
      FROM users u
      LEFT JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE u.id = $1
    `;
    
    const checkResult = await db.query(checkQuery, [traderId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userCheck = checkResult.rows[0];
    
    // If user has LSP profile, they should use LSP endpoint
    if (userCheck.lsp_profile_id) {
      throw new Error(`User ${traderId} is an LSP. Please use /api/admin/lsps/${userCheck.lsp_profile_id} endpoint instead.`);
    }
    
    // If user is an admin, reject
    if (userCheck.role === 'ADMIN') {
      throw new Error('Cannot fetch admin user details through trader endpoint');
    }
    
    // Get full trader details
    const query = `
      SELECT u.*, 
             COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as full_name
      FROM users u
      WHERE u.id = $1 
      AND u.role != 'ADMIN'
      AND NOT EXISTS (
        SELECT 1 FROM lsp_profiles lp WHERE lp.user_id = u.id
      )
    `;
    
    const result = await db.query(query, [traderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Trader not found or does not meet criteria');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in getTraderById:', error.message);
    throw error;
  }
};

// Update trader document path
exports.updateTraderDocument = async (traderId, columnName, documentPath) => {
  const query = `
    UPDATE users 
    SET ${columnName} = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND role != 'ADMIN'
    RETURNING *
  `;
  const result = await db.query(query, [documentPath, traderId]);
  return result.rows[0];
};

// Container Approval Management
exports.getContainersForApproval = async () => {
  const query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description,
           lp.company_name as lsp_company_name,
           u.first_name || ' ' || u.last_name as lsp_name,
           u.email as lsp_email,
           u.phone_number as lsp_phone
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.container_approval_status = 'pending'
    ORDER BY c.created_at ASC
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.getContainerById = async (containerId) => {
  const query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description,
           lp.company_name as lsp_company_name,
           u.first_name || ' ' || u.last_name as lsp_name,
           u.email as lsp_email,
           u.phone_number as lsp_phone
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.id = $1
  `;
  const result = await db.query(query, [containerId]);
  return result.rows[0];
};

exports.approveContainer = async (containerId, adminId, approvalNotes = null) => {
  const query = `
    UPDATE containers 
    SET container_approval_status = 'approved', 
        is_available = true,
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

exports.getApprovedContainers = async () => {
  const query = `
    SELECT c.*, ct.type_name, ct.description as container_type_description,
           lp.company_name as lsp_company_name,
           u.first_name || ' ' || u.last_name as lsp_name,
           u.email as lsp_email
    FROM containers c
    LEFT JOIN container_types ct ON c.container_type_id = ct.id
    LEFT JOIN lsp_profiles lp ON c.lsp_id = lp.id
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE c.container_approval_status = 'approved'
    ORDER BY c.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.approveUser = async (userId, adminId) => {
  const query = `
    UPDATE users 
    SET is_active = true,
        approval_status = 'approved',
        verification_status = 'approved',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND role != 'ADMIN'
    RETURNING *
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

exports.rejectUser = async (userId, adminId, rejectionReason) => {
  const query = `
    UPDATE users 
    SET is_active = false,
        approval_status = 'rejected',
        verification_status = 'rejected',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND role != 'ADMIN'
    RETURNING *
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

exports.fetchUserById = async (userId) => {
  const userQuery = `
    SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 
           u.is_active as is_approved, u.created_at, u.updated_at,
           u.company_name, u.gst_number, u.pan_number, u.phone_number, u.address,
           u.verification_status, u.city, u.state,
           CASE WHEN lp.id IS NOT NULL THEN 'lsp' ELSE 'trader' END as role
    FROM users u
    LEFT JOIN lsp_profiles lp ON u.id = lp.user_id
    WHERE u.id = $1
  `;
  const userResult = await db.query(userQuery, [userId]);
  if (!userResult.rows.length) return null;

  const user = userResult.rows[0];

  if (user.role === 'lsp') {
    const lspQuery = `
      SELECT company_name, pan_number, gst_number, phone, address,
             business_license, insurance_certificate,
             gst_certificate_path, company_registration_doc_path,
             business_license_doc_path, insurance_certificate_doc_path,
             is_verified, verification_status
      FROM lsp_profiles
      WHERE user_id = $1
    `;
    const lspResult = await db.query(lspQuery, [userId]);
    user.profile = lspResult.rows[0] || {};
  }
  else if (user.role === 'trader') {
    // For traders, use the company info from the users table
    user.profile = {
      company_name: user.company_name,
      phone: user.phone_number,
      address: user.address
    };
  }

  return user;
};

exports.updateUserAndProfileApproval = async (userId, is_approved) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Update users table
    const userUpdateRes = await client.query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, first_name || ' ' || last_name as name, email, is_active, created_at, updated_at`,
      [is_approved, userId]
    );

    if (userUpdateRes.rows.length === 0) {
      throw new Error('User not found');
    }

    // Update lsp_profiles table if record exists (only for LSP role)
    let verificationStatus = null;
    if (is_approved === true) {
      verificationStatus = 'approved';
    } else if (is_approved === false) {
      verificationStatus = 'rejected';
    }

    await client.query(
      `UPDATE lsp_profiles
       SET is_verified = $1,
           verification_status = $2,
           updated_at = NOW()
       WHERE user_id = $3`,
      [is_approved, verificationStatus, userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Return updated user with profile
  const updatedUser = await exports.fetchUserById(userId);
  return updatedUser;
};

// -------------------- Bookings --------------------
exports.fetchAllBookings = async () => {
  const query = `
    SELECT b.*, 
           c.container_number, c.size AS container_size, c.type AS container_type,
           lsp.company_name AS lsp_company,
           u.first_name || ' ' || u.last_name AS exporter_name, 
           u.email AS exporter_email,
           u.company_name AS exporter_company,
           u.first_name || ' ' || u.last_name AS importer_name,
           u.email AS importer_email,
           u.company_name AS importer_company
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    JOIN lsp_profiles lsp ON c.lsp_id = lsp.id
    LEFT JOIN users u ON u.id = b.user_id
    ORDER BY b.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.fetchBookingById = async (id) => {
  const query = `
    SELECT 
      b.*, 
      c.container_number, 
      c.size AS container_size, 
      c.type AS container_type,
      c.origin_port,
      c.destination_port,
      lsp.company_name AS lsp_company_name,
      lsp.id AS lsp_profile_id,
      COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') AS user_name, 
      u.email AS user_email,
      u.company_name AS user_company_name,
      u.phone_number AS user_phone,
      b.weight AS cargo_weight,
      b.volume AS cargo_volume,
      CASE 
        WHEN b.shipment_details IS NOT NULL AND b.shipment_details::text != '{}'::text
        THEN COALESCE(b.shipment_details->>'cargo_type', b.shipment_details->>'type', 'General')
        ELSE 'General'
      END AS cargo_type
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    JOIN lsp_profiles lsp ON c.lsp_id = lsp.id
    LEFT JOIN users u ON u.id = b.user_id
    WHERE b.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

exports.deleteBooking = async (id) => {
  const result = await db.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

// LSP Management
exports.fetchLSPs = async (status = null) => {
  try {
    let query = `
      SELECT u.id, 
             u.first_name, 
             u.last_name,
             COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as name,
             u.email, 
             u.phone_number,
             'lsp' as role, 
             u.is_active, 
             u.is_active as is_approved, 
             u.approval_status,
             u.verification_status,
             u.created_at,
             lp.id as lsp_profile_id,
             lp.company_name, 
             lp.pan_number, 
             lp.gst_number, 
             lp.phone, 
             lp.address,
             lp.company_registration,
             lp.business_license,
             lp.insurance_certificate,
             lp.is_verified, 
             lp.verification_status as lsp_verification_status, 
             lp.created_at as profile_created_at,
             lp.gst_certificate_path, 
             lp.company_registration_doc_path, 
             lp.business_license_doc_path, 
             lp.insurance_certificate_doc_path
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
    `;
    
    const params = [];
    
    if (status) {
      if (status === 'pending') {
        query += ` WHERE lp.is_verified = false AND lp.verification_status = 'pending'`;
      } else if (status === 'approved') {
        query += ` WHERE lp.is_verified = true AND lp.verification_status = 'approved'`;
      } else if (status === 'rejected') {
        query += ` WHERE lp.verification_status = 'rejected'`;
      }
    }
    
    query += ` ORDER BY u.created_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in fetchLSPs:', error.message);
    throw error;
  }
};

exports.fetchLSPById = async (id) => {
  try {
    // The id parameter is lsp_profiles.id, not user.id
    const query = `
      SELECT u.id, 
             u.first_name, 
             u.last_name,
             COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as name,
             u.email, 
             u.phone_number,
             u.role, 
             u.is_active as is_approved,
             u.approval_status,
             u.verification_status,
             u.created_at,
             lp.*, 
             lp.created_at as profile_created_at
      FROM lsp_profiles lp
      JOIN users u ON u.id = lp.user_id
      WHERE lp.id = $1
    `;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in fetchLSPById:', error.message);
    throw error;
  }
};

exports.approveLSP = async (lspId, adminId) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // First get the user_id from lsp_profiles
    const lspProfileQuery = await client.query(
      'SELECT user_id FROM lsp_profiles WHERE id = $1',
      [lspId]
    );
    
    if (lspProfileQuery.rows.length === 0) {
      throw new Error('LSP profile not found');
    }
    
    const userId = lspProfileQuery.rows[0].user_id;
    
    // Update user to active and approved
    await client.query(
      `UPDATE users 
       SET is_active = true, 
           approval_status = 'approved',
           verification_status = 'approved',
           updated_at = NOW() 
       WHERE id = $1`,
      [userId]
    );
    
    // Update LSP profile to verified
    await client.query(
      `UPDATE lsp_profiles 
       SET is_verified = true, 
           verification_status = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      ['approved', lspId]
    );
    
    await client.query('COMMIT');
    
    // Return updated LSP data
    const result = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 'lsp' as role, 
             u.is_active as is_approved, u.approval_status, u.created_at,
             lp.id as lsp_profile_id, lp.company_name, lp.pan_number, lp.gst_number, lp.phone, lp.address,
             lp.is_verified, lp.verification_status, lp.created_at as profile_created_at
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.id = $1
    `, [lspId]);
    
    if (result.rows.length === 0) {
      throw new Error('LSP data not found after update');
    }
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in approveLSP:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

exports.rejectLSP = async (lspId, reason, adminId) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // First get the user_id from lsp_profiles
    const lspProfileQuery = await client.query(
      'SELECT user_id FROM lsp_profiles WHERE id = $1',
      [lspId]
    );
    
    if (lspProfileQuery.rows.length === 0) {
      throw new Error('LSP profile not found');
    }
    
    const userId = lspProfileQuery.rows[0].user_id;
    
    // Update user to inactive and rejected
    await client.query(
      `UPDATE users 
       SET is_active = false, 
           approval_status = 'rejected',
           verification_status = 'rejected',
           updated_at = NOW() 
       WHERE id = $1`,
      [userId]
    );
    
    // Update LSP profile to rejected
    await client.query(
      `UPDATE lsp_profiles 
       SET is_verified = false, 
           verification_status = $1, 
           updated_at = NOW() 
       WHERE id = $2`,
      ['rejected', lspId]
    );
    
    await client.query('COMMIT');
    
    // Return updated LSP data
    const result = await client.query(`
      SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, 'lsp' as role, 
             u.is_active as is_approved, u.approval_status, u.created_at,
             lp.id as lsp_profile_id, lp.company_name, lp.pan_number, lp.gst_number, lp.phone, lp.address,
             lp.is_verified, lp.verification_status, lp.created_at as profile_created_at
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.id = $1
    `, [lspId]);
    
    if (result.rows.length === 0) {
      throw new Error('LSP data not found after update');
    }
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in rejectLSP:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

exports.verifyLSP = async (id, { is_verified, verification_status }) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // First get the user_id from lsp_profiles
    const lspProfileQuery = await client.query(
      'SELECT user_id FROM lsp_profiles WHERE id = $1',
      [id]
    );
    
    if (lspProfileQuery.rows.length === 0) {
      throw new Error('LSP profile not found');
    }
    
    const userId = lspProfileQuery.rows[0].user_id;
    
    // Update LSP profile (id is lsp_profiles.id)
    const lspQuery = `
      UPDATE lsp_profiles 
      SET is_verified = $1, verification_status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    await client.query(lspQuery, [is_verified, verification_status, id]);
    
    // Update user is_active and approval_status based on verification status
    let userActiveStatus = false;
    let userApprovalStatus = 'pending';
    
    if (verification_status === 'approved') {
      userActiveStatus = true;
      userApprovalStatus = 'approved';
    } else if (verification_status === 'rejected') {
      userActiveStatus = false;
      userApprovalStatus = 'rejected';
    }
    // For 'pending', keep the current status
    
    const userQuery = `
      UPDATE users 
      SET is_active = $1, 
          approval_status = $2,
          verification_status = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    await client.query(userQuery, [userActiveStatus, userApprovalStatus, verification_status, userId]);
    
    await client.query('COMMIT');
    
    // Return updated LSP data with user info
    const result = await client.query(`
      SELECT u.id, 
             u.first_name, 
             u.last_name,
             COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name, '') as name, 
             u.email, 
             u.phone_number,
             'lsp' as role, 
             u.is_active, 
             u.is_active as is_approved, 
             u.approval_status,
             u.verification_status,
             u.created_at,
             lp.id as lsp_profile_id,
             lp.company_name, 
             lp.pan_number, 
             lp.gst_number, 
             lp.phone, 
             lp.address,
             lp.company_registration,
             lp.business_license,
             lp.insurance_certificate,
             lp.is_verified, 
             lp.verification_status as lsp_verification_status, 
             lp.created_at as profile_created_at,
             lp.gst_certificate_path, 
             lp.company_registration_doc_path, 
             lp.business_license_doc_path, 
             lp.insurance_certificate_doc_path
      FROM users u
      JOIN lsp_profiles lp ON u.id = lp.user_id
      WHERE lp.id = $1
    `, [id]);
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Shipments
exports.fetchAllShipments = async () => {
  const query = `
    SELECT s.*, 
           b.booking_date, b.departure_date, b.arrival_date, b.shipment_details,
           c.container_number, c.size, c.type,
           c.origin_port AS departure_port, c.destination_port AS arrival_port,
           lsp.company_name AS lsp_company,
           u.first_name || ' ' || u.last_name AS exporter_name, 
           u.email AS exporter_email,
           u.first_name || ' ' || u.last_name AS importer_name,
           u.email AS importer_email
    FROM shipments s
    JOIN bookings b ON s.booking_id = b.id
    JOIN containers c ON s.container_id = c.id
    JOIN lsp_profiles lsp ON s.lsp_id = lsp.id
    LEFT JOIN users u ON u.id = b.user_id
    ORDER BY s.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.fetchShipmentById = async (id) => {
  const query = `
    SELECT s.*, 
           b.booking_date, b.departure_date, b.arrival_date, b.shipment_details,
           c.container_number, c.size, c.type,
           lsp.company_name AS lsp_company,
           u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email
    FROM shipments s
    JOIN bookings b ON s.booking_id = b.id
    JOIN containers c ON s.container_id = c.id
    JOIN lsp_profiles lsp ON s.lsp_id = lsp.id
    LEFT JOIN users u ON u.id = b.user_id
    WHERE s.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

// Complaints
exports.fetchAllComplaints = async () => {
  const query = `
    SELECT c.*, 
           b.booking_date, cont.container_number,
           lsp.company_name AS lsp_company,
           complainant.first_name || ' ' || complainant.last_name AS complainant_name, complainant.email AS complainant_email
    FROM complaints c
    LEFT JOIN bookings b ON c.booking_id = b.id
    LEFT JOIN containers cont ON b.container_id = cont.id
    LEFT JOIN lsp_profiles lsp ON c.lsp_id = lsp.id
    LEFT JOIN users complainant ON c.user_id = complainant.id
    ORDER BY c.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.fetchComplaintById = async (id) => {
  const query = `
    SELECT c.*, 
           b.booking_date, cont.container_number,
           lsp.company_name AS lsp_company,
           complainant.first_name || ' ' || complainant.last_name AS complainant_name, complainant.email AS complainant_email
    FROM complaints c
    LEFT JOIN bookings b ON c.booking_id = b.id
    LEFT JOIN containers cont ON b.container_id = cont.id
    LEFT JOIN lsp_profiles lsp ON c.lsp_id = lsp.id
    LEFT JOIN users complainant ON c.user_id = complainant.id
    WHERE c.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

exports.resolveComplaint = async (id, { status, resolution }) => {
  const query = `
    UPDATE complaints 
    SET status = $1, resolution = $2, resolved_at = NOW(), updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  const result = await db.query(query, [status, resolution, id]);
  return result.rows[0];
};
