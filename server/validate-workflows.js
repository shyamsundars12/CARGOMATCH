const fetch = require('node-fetch').default || require('node-fetch');
const db = require('./src/config/db');

class WorkflowValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.lspToken = null;
    this.adminToken = null;
    this.testResults = {
      lsp: { passed: 0, failed: 0, tests: [] },
      admin: { passed: 0, failed: 0, tests: [] },
      database: { passed: 0, failed: 0, tests: [] }
    };
    this.testData = {
      lspUser: null,
      containerId: null,
      bookingId: null,
      shipmentId: null,
      complaintId: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
  }

  addTestResult(module, testName, passed, details = '') {
    this.testResults[module].tests.push({ name: testName, passed, details });
    if (passed) {
      this.testResults[module].passed++;
      console.log(`✅ ${testName}${details ? ` - ${details}` : ''}`);
    } else {
      this.testResults[module].failed++;
      console.log(`❌ ${testName}${details ? ` - ${details}` : ''}`);
    }
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = response.ok ? await response.json() : null;
      return { response, data, ok: response.ok };
    } catch (error) {
      return { response: null, data: null, ok: false, error: error.message };
    }
  }

  async testDatabaseConnection() {
    this.log('Testing database connection and integrity...');
    
    try {
      // Test basic connection
      const result = await db.query('SELECT NOW() as current_time');
      this.addTestResult('database', 'Database Connection', true, 
        `Connected at ${result.rows[0].current_time}`);
      
      // Test table existence
      const tables = ['users', 'lsp_profiles', 'containers', 'bookings', 'shipments', 'complaints'];
      for (const table of tables) {
        const tableResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        this.addTestResult('database', `Table ${table}`, true, 
          `${tableResult.rows[0].count} records`);
      }
      
      // Test foreign key relationships
      const fkTest = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM lsp_profiles lp JOIN users u ON lp.user_id = u.id) as lsp_users,
          (SELECT COUNT(*) FROM containers c JOIN lsp_profiles lp ON c.lsp_id = lp.id) as container_lsps,
          (SELECT COUNT(*) FROM bookings b JOIN containers c ON b.container_id = c.id) as booking_containers
      `);
      
      this.addTestResult('database', 'Foreign Key Relationships', true, 
        `LSP-Users: ${fkTest.rows[0].lsp_users}, Container-LSPs: ${fkTest.rows[0].container_lsps}, Booking-Containers: ${fkTest.rows[0].booking_containers}`);
      
    } catch (error) {
      this.addTestResult('database', 'Database Connection', false, error.message);
    }
  }

  async testLSPWorkflows() {
    this.log('Testing LSP Module Workflows...');
    
    // 1. LSP Registration & Login
    await this.testLSPRegistration();
    await this.testLSPLogin();
    
    if (this.lspToken) {
      // 2. LSP Profile Management
      await this.testLSPProfileUpdate();
      
      // 3. Container Management
      await this.testContainerCRUD();
      
      // 4. Booking Management
      await this.testBookingManagement();
      
      // 5. Shipment Management
      await this.testShipmentManagement();
      
      // 6. Complaint Handling
      await this.testLSPComplaintHandling();
      
      // 7. Analytics
      await this.testLSPAnalytics();
    }
  }

  async testLSPRegistration() {
    const testUser = {
      name: 'Test LSP',
      email: `testlsp${Date.now()}@example.com`,
      password: 'password123',
      role: 'lsp',
      company_name: 'Test Logistics Co',
      pan_number: `PAN${Date.now()}`,
      gst_number: `GST${Date.now()}`,
      phone: '9876543210',
      address: 'Test Address'
    };

    const { ok, data } = await this.makeRequest('/api/lsp/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    this.addTestResult('lsp', 'LSP Registration', ok, 
      ok ? `User created: ${data.user?.email}` : 'Registration failed');
    
    if (ok) {
      this.testData.lspUser = testUser;
    }
  }

  async testLSPLogin() {
    if (!this.testData.lspUser) {
      this.addTestResult('lsp', 'LSP Login', false, 'No test user available');
      return;
    }

    const { ok, data } = await this.makeRequest('/api/lsp/login', {
      method: 'POST',
      body: JSON.stringify({
        email: this.testData.lspUser.email,
        password: this.testData.lspUser.password
      })
    });

    this.addTestResult('lsp', 'LSP Login', ok, 
      ok ? 'Token received' : 'Login failed');
    
    if (ok) {
      this.lspToken = data.token;
    }
  }

  async testLSPProfileUpdate() {
    if (!this.lspToken) {
      this.addTestResult('lsp', 'LSP Profile Update', false, 'No token available');
      return;
    }

    const profileData = {
      company_name: 'Updated Test Logistics Co',
      phone: '9876543211',
      address: 'Updated Test Address'
    };

    const { ok } = await this.makeRequest('/api/lsp/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.lspToken}` },
      body: JSON.stringify(profileData)
    });

    this.addTestResult('lsp', 'LSP Profile Update', ok, 
      ok ? 'Profile updated successfully' : 'Profile update failed');
  }

  async testContainerCRUD() {
    if (!this.lspToken) {
      this.addTestResult('lsp', 'Container CRUD', false, 'No token available');
      return;
    }

    // Create Container
    const containerData = {
      container_number: `CONT${Date.now()}`,
      size: '40ft',
      type: 'Standard',
      capacity: 67.7,
      current_location: 'Mumbai Port',
      origin_port: 'Mumbai',
      destination_port: 'Dubai',
      route_description: 'Mumbai to Dubai via sea',
      price_per_unit: 1500,
      currency: 'USD',
      departure_date: '2024-02-01',
      arrival_date: '2024-02-15'
    };

    const { ok, data } = await this.makeRequest('/api/lsp/containers', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.lspToken}` },
      body: JSON.stringify(containerData)
    });

    this.addTestResult('lsp', 'Container Creation', ok, 
      ok ? `Container created: ${data.container?.container_number}` : 'Container creation failed');
    
    if (ok) {
      this.testData.containerId = data.container.id;
    }

    // List Containers
    const { ok: listOk, data: containers } = await this.makeRequest('/api/lsp/containers', {
      headers: { 'Authorization': `Bearer ${this.lspToken}` }
    });

    this.addTestResult('lsp', 'Container Listing', listOk, 
      listOk ? `${containers.length} containers found` : 'Container listing failed');

    // Update Container
    if (this.testData.containerId) {
      const updateData = { status: 'booked' };
      const { ok: updateOk } = await this.makeRequest(`/api/lsp/containers/${this.testData.containerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.lspToken}` },
        body: JSON.stringify(updateData)
      });

      this.addTestResult('lsp', 'Container Update', updateOk, 
        updateOk ? 'Container updated successfully' : 'Container update failed');
    }
  }

  async testBookingManagement() {
    if (!this.lspToken) {
      this.addTestResult('lsp', 'Booking Management', false, 'No token available');
      return;
    }

    // List Bookings
    const { ok, data: bookings } = await this.makeRequest('/api/lsp/bookings', {
      headers: { 'Authorization': `Bearer ${this.lspToken}` }
    });

    this.addTestResult('lsp', 'Booking Listing', ok, 
      ok ? `${bookings.length} bookings found` : 'Booking listing failed');

    // Update Booking Status (if bookings exist)
    if (ok && bookings.length > 0) {
      this.testData.bookingId = bookings[0].id;
      const { ok: updateOk } = await this.makeRequest(`/api/lsp/bookings/${this.testData.bookingId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.lspToken}` },
        body: JSON.stringify({ status: 'approved' })
      });

      this.addTestResult('lsp', 'Booking Status Update', updateOk, 
        updateOk ? 'Booking status updated' : 'Booking status update failed');
    }
  }

  async testShipmentManagement() {
    if (!this.lspToken) {
      this.addTestResult('lsp', 'Shipment Management', false, 'No token available');
      return;
    }

    // List Shipments
    const { ok, data: shipments } = await this.makeRequest('/api/lsp/shipments', {
      headers: { 'Authorization': `Bearer ${this.lspToken}` }
    });

    this.addTestResult('lsp', 'Shipment Listing', ok, 
      ok ? `${shipments.length} shipments found` : 'Shipment listing failed');

    // Create Shipment (if booking exists)
    if (this.testData.bookingId) {
      const shipmentData = {
        booking_id: this.testData.bookingId,
        shipment_number: `SHIP${Date.now()}`,
        status: 'scheduled',
        departure_port: 'Mumbai',
        arrival_port: 'Dubai',
        estimated_arrival_date: '2024-02-15T10:00:00Z'
      };

      const { ok: createOk, data: shipment } = await this.makeRequest('/api/lsp/shipments', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.lspToken}` },
        body: JSON.stringify(shipmentData)
      });

      this.addTestResult('lsp', 'Shipment Creation', createOk, 
        createOk ? `Shipment created: ${shipment.shipment?.shipment_number}` : 'Shipment creation failed');
      
      if (createOk) {
        this.testData.shipmentId = shipment.shipment.id;
      }
    }

    // Update Shipment Status
    if (this.testData.shipmentId) {
      const { ok: updateOk } = await this.makeRequest(`/api/lsp/shipments/${this.testData.shipmentId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.lspToken}` },
        body: JSON.stringify({ status: 'in_transit' })
      });

      this.addTestResult('lsp', 'Shipment Status Update', updateOk, 
        updateOk ? 'Shipment status updated' : 'Shipment status update failed');
    }
  }

  async testLSPComplaintHandling() {
    if (!this.lspToken) {
      this.addTestResult('lsp', 'LSP Complaint Handling', false, 'No token available');
      return;
    }

    // List Complaints
    const { ok, data: complaints } = await this.makeRequest('/api/lsp/complaints', {
      headers: { 'Authorization': `Bearer ${this.lspToken}` }
    });

    this.addTestResult('lsp', 'Complaint Listing', ok, 
      ok ? `${complaints.length} complaints found` : 'Complaint listing failed');

    // Respond to Complaint (if complaints exist)
    if (ok && complaints.length > 0) {
      this.testData.complaintId = complaints[0].id;
      const { ok: responseOk } = await this.makeRequest(`/api/lsp/complaints/${this.testData.complaintId}/respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.lspToken}` },
        body: JSON.stringify({ response: 'We are looking into this matter and will resolve it soon.' })
      });

      this.addTestResult('lsp', 'Complaint Response', responseOk, 
        responseOk ? 'Complaint response sent' : 'Complaint response failed');
    }
  }

  async testLSPAnalytics() {
    if (!this.lspToken) {
      this.addTestResult('lsp', 'LSP Analytics', false, 'No token available');
      return;
    }

    const { ok, data: analytics } = await this.makeRequest('/api/lsp/analytics', {
      headers: { 'Authorization': `Bearer ${this.lspToken}` }
    });

    this.addTestResult('lsp', 'LSP Analytics', ok, 
      ok ? `Revenue: $${analytics.revenue?.total_revenue || 0}, Containers: ${analytics.containers?.total_containers || 0}` : 'Analytics failed');
  }

  async testAdminWorkflows() {
    this.log('Testing Admin Module Workflows...');
    
    // 1. Admin Login
    await this.testAdminLogin();
    
    if (this.adminToken) {
      // 2. User Management
      await this.testUserManagement();
      
      // 3. LSP Management
      await this.testLSPManagement();
      
      // 4. Container Management
      await this.testAdminContainerManagement();
      
      // 5. Booking Management
      await this.testAdminBookingManagement();
      
      // 6. Shipment Management
      await this.testAdminShipmentManagement();
      
      // 7. Complaint Management
      await this.testAdminComplaintManagement();
      
      // 8. Dashboard Analytics
      await this.testAdminDashboard();
    }
  }

  async testAdminLogin() {
    const { ok, data } = await this.makeRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@cargomatch.in',
        password: 'adminCargomatch123'
      })
    });

    this.addTestResult('admin', 'Admin Login', ok, 
      ok ? 'Admin token received' : 'Admin login failed');
    
    if (ok) {
      this.adminToken = data.token;
    }
  }

  async testUserManagement() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'User Management', false, 'No admin token available');
      return;
    }

    // List Users
    const { ok, data: users } = await this.makeRequest('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'User Listing', ok, 
      ok ? `${users.length} users found` : 'User listing failed');

    // Approve User (if users exist)
    if (ok && users.length > 0) {
      const pendingUser = users.find(u => u.is_approved === null);
      if (pendingUser) {
        const { ok: approveOk } = await this.makeRequest(`/api/admin/users/${pendingUser.id}/status`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${this.adminToken}` },
          body: JSON.stringify({ is_approved: true })
        });

        this.addTestResult('admin', 'User Approval', approveOk, 
          approveOk ? 'User approved successfully' : 'User approval failed');
      }
    }
  }

  async testLSPManagement() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'LSP Management', false, 'No admin token available');
      return;
    }

    // List LSPs
    const { ok, data: lsps } = await this.makeRequest('/api/admin/lsps', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'LSP Listing', ok, 
      ok ? `${lsps.length} LSPs found` : 'LSP listing failed');

    // Verify LSP (if LSPs exist)
    if (ok && lsps.length > 0) {
      const pendingLSP = lsps.find(lsp => lsp.is_verified === false || lsp.verification_status === 'pending');
      if (pendingLSP) {
        const { ok: verifyOk } = await this.makeRequest(`/api/admin/lsps/${pendingLSP.id}/verify`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${this.adminToken}` },
          body: JSON.stringify({ 
            is_verified: true, 
            verification_status: 'approved' 
          })
        });

        this.addTestResult('admin', 'LSP Verification', verifyOk, 
          verifyOk ? 'LSP verified successfully' : 'LSP verification failed');
      }
    }
  }

  async testAdminContainerManagement() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'Admin Container Management', false, 'No admin token available');
      return;
    }

    // List Containers
    const { ok, data: containers } = await this.makeRequest('/api/admin/containers', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'Admin Container Listing', ok, 
      ok ? `${containers.length} containers found` : 'Admin container listing failed');

    // Update Container Status (if containers exist)
    if (ok && containers.length > 0) {
      const container = containers[0];
      const { ok: updateOk } = await this.makeRequest(`/api/admin/containers/${container.id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
        body: JSON.stringify({ status: 'approved' })
      });

      this.addTestResult('admin', 'Container Status Update', updateOk, 
        updateOk ? 'Container status updated' : 'Container status update failed');
    }
  }

  async testAdminBookingManagement() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'Admin Booking Management', false, 'No admin token available');
      return;
    }

    // List Bookings
    const { ok, data: bookings } = await this.makeRequest('/api/admin/bookings', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'Admin Booking Listing', ok, 
      ok ? `${bookings.length} bookings found` : 'Admin booking listing failed');
  }

  async testAdminShipmentManagement() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'Admin Shipment Management', false, 'No admin token available');
      return;
    }

    // List Shipments
    const { ok, data: shipments } = await this.makeRequest('/api/admin/shipments', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'Admin Shipment Listing', ok, 
      ok ? `${shipments.length} shipments found` : 'Admin shipment listing failed');
  }

  async testAdminComplaintManagement() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'Admin Complaint Management', false, 'No admin token available');
      return;
    }

    // List Complaints
    const { ok, data: complaints } = await this.makeRequest('/api/admin/complaints', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'Admin Complaint Listing', ok, 
      ok ? `${complaints.length} complaints found` : 'Admin complaint listing failed');

    // Resolve Complaint (if complaints exist)
    if (ok && complaints.length > 0) {
      const complaint = complaints[0];
      const { ok: resolveOk } = await this.makeRequest(`/api/admin/complaints/${complaint.id}/resolve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
        body: JSON.stringify({ 
          status: 'resolved', 
          resolution: 'Issue has been resolved after investigation.' 
        })
      });

      this.addTestResult('admin', 'Complaint Resolution', resolveOk, 
        resolveOk ? 'Complaint resolved successfully' : 'Complaint resolution failed');
    }
  }

  async testAdminDashboard() {
    if (!this.adminToken) {
      this.addTestResult('admin', 'Admin Dashboard', false, 'No admin token available');
      return;
    }

    const { ok, data: dashboard } = await this.makeRequest('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });

    this.addTestResult('admin', 'Admin Dashboard', ok, 
      ok ? `Users: ${dashboard.users}, LSPs: ${dashboard.lsps}, Containers: ${dashboard.containers}` : 'Dashboard failed');
  }

  async run() {
    console.log('🎯 CargoMatch Comprehensive Workflow Validation');
    console.log('===============================================\n');
    
    try {
      // Test database connection and integrity
      await this.testDatabaseConnection();
      
      // Test LSP workflows
      await this.testLSPWorkflows();
      
      // Test Admin workflows
      await this.testAdminWorkflows();
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  generateSummary() {
    console.log('\n📊 Workflow Validation Summary:');
    console.log('===============================');
    
    const modules = ['database', 'lsp', 'admin'];
    
    modules.forEach(module => {
      const results = this.testResults[module];
      const total = results.passed + results.failed;
      const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
      
      console.log(`\n${module.toUpperCase()} Module:`);
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   📈 Success Rate: ${successRate}%`);
      
      if (results.failed > 0) {
        console.log('   Failed Tests:');
        results.tests.filter(t => !t.passed).forEach(test => {
          console.log(`     - ${test.name}: ${test.details}`);
        });
      }
    });
    
    const totalPassed = Object.values(this.testResults).reduce((sum, module) => sum + module.passed, 0);
    const totalTests = Object.values(this.testResults).reduce((sum, module) => sum + module.passed + module.failed, 0);
    const overallSuccessRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    console.log('\n🎯 Overall System:');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalTests - totalPassed}`);
    console.log(`   📈 Overall Success Rate: ${overallSuccessRate}%`);
    
    if (overallSuccessRate === 100) {
      console.log('\n🎉 ALL WORKFLOWS VALIDATED SUCCESSFULLY!');
      console.log('✅ Database migration is complete and all features are functional');
    } else if (overallSuccessRate >= 90) {
      console.log('\n⚠️  Most workflows are working. Please review failed tests above.');
    } else {
      console.log('\n❌ Multiple workflow failures detected. Please review and fix issues.');
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new WorkflowValidator();
  validator.run()
    .then(() => {
      console.log('\n✅ Workflow validation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Workflow validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { WorkflowValidator };
