const db = require('../config/db');

// -------------------- Dashboard --------------------
exports.fetchDashboardStats = async () => {
  const containers = await db.query('SELECT COUNT(*) FROM containers');
  const bookings = await db.query('SELECT COUNT(*) FROM bookings');
  const users = await db.query("SELECT COUNT(*) FROM users");
  const lsps = await db.query("SELECT COUNT(*) FROM users WHERE role='lsp'");
  const traders = await db.query("SELECT COUNT(*) FROM users WHERE role='trader'");
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
  let query = 'SELECT * FROM containers';
  const params = [];
  if (status) {
    query += ' WHERE status = $1';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
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
           u.name AS lsp_name, u.email AS lsp_email, u.is_approved AS lsp_is_approved
    FROM containers c
    JOIN lsp_profiles lp ON c.lsp_id = lp.id
    JOIN users u ON lp.user_id = u.id
    WHERE c.id = $1
  `;
  const result = await db.query(query, [id]);
  if (result.rows.length === 0) return null;

  const bookingsQuery = `
    SELECT b.*, u.name AS trader_name, u.email AS trader_email
    FROM bookings b
    JOIN users u ON u.id = b.exporter_id OR u.id = b.importer_id
    WHERE b.container_id = $1
  `;
  const bookingsResult = await db.query(bookingsQuery, [id]);

  return {
    container: result.rows[0],
    bookings: bookingsResult.rows
  };
};

exports.updateContainerStatus = (id, status) =>
  db
    .query('UPDATE containers SET status = $1 WHERE id = $2 RETURNING *', [status, id])
    .then(res => res.rows[0]);

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

// -------------------- Users --------------------
exports.fetchUsers = async (role = null) => {
  let query = `
    SELECT u.id, u.name, u.email, u.role, u.is_approved, u.created_at,
           lp.is_verified,
           lp.verification_status
    FROM users u
    LEFT JOIN lsp_profiles lp ON u.id = lp.user_id
  `;
  const params = [];
  if (role) {
    query += ` WHERE u.role = $1`;
    params.push(role);
  }
  query += ` ORDER BY u.created_at DESC`;
  const result = await db.query(query, params);
  return result.rows;
};

exports.fetchUserById = async (userId) => {
  const userQuery = `
    SELECT id, name, email, role, is_approved, created_at, updated_at
    FROM users
    WHERE id = $1
  `;
  const userResult = await db.query(userQuery, [userId]);
  if (!userResult.rows.length) return null;

  const user = userResult.rows[0];

  if (user.role === 'lsp') {
    const lspQuery = `
      SELECT company_name, pan_number, gst_number, phone, address,
             business_license, insurance_certificate,
             gst_certificate_path, company_registration_doc_path,
             business_license_doc_path, insurance_certificate_doc_path
      FROM lsp_profiles
      WHERE user_id = $1
    `;
    const lspResult = await db.query(lspQuery, [userId]);
    user.profile = lspResult.rows[0] || {};
  }
  else if (user.role === 'trader') {
    const traderQuery = `
      SELECT company_name, phone, address
      FROM trader_profiles
      WHERE user_id = $1
    `;
    const traderResult = await db.query(traderQuery, [userId]);
    user.profile = traderResult.rows[0] || {};
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
       SET is_approved = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, is_approved, created_at, updated_at`,
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
           importer.name AS importer_name, importer.email AS importer_email,
           exporter.name AS exporter_name, exporter.email AS exporter_email
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    JOIN lsp_profiles lsp ON c.lsp_id = lsp.id
    LEFT JOIN users importer ON importer.id = b.importer_id
    LEFT JOIN users exporter ON exporter.id = b.exporter_id
    ORDER BY b.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
};

exports.fetchBookingById = async (id) => {
  const query = `
    SELECT b.*, 
           c.container_number, c.size AS container_size, c.type AS container_type,
           lsp.company_name AS lsp_company,
           importer.name AS importer_name, importer.email AS importer_email,
           exporter.name AS exporter_name, exporter.email AS exporter_email
    FROM bookings b
    JOIN containers c ON b.container_id = c.id
    JOIN lsp_profiles lsp ON c.lsp_id = lsp.id
    LEFT JOIN users importer ON importer.id = b.importer_id
    LEFT JOIN users exporter ON exporter.id = b.exporter_id
    WHERE b.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

exports.deleteBooking = async (id) => {
  const result = await db.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
