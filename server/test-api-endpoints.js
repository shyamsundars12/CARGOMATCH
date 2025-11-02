const fetch = require('node-fetch').default || require('node-fetch');
const db = require('./src/config/db');

/**
 * Comprehensive API Endpoint Testing Suite
 * Tests all Admin and LSP endpoints to ensure migration success
 */
class APIEndpointTester {
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
      userId: null,
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
      return { response, data, ok: response.ok, status: response.status };
    } catch (error) {
      return { response: null, data: null, ok: false, error: error.message };
    }
  }

  async testDatabaseOperations() {
    this.log('Testing database operations...');
    
    const dbTests = [
      {
        name: 'Database Connection',
        query: 'SELECT NOW() as current_time',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'Users Table Access',
        query: 'SELECT COUNT(*) as count FROM users',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'LSP Profiles Table Access',
        query: 'SELECT COUNT(*) as count FROM lsp_profiles',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'Containers Table Access',
        query: 'SELECT COUNT(*) as count FROM containers',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'Bookings Table Access',
        query: 'SELECT COUNT(*) as count FROM bookings',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'Shipments Table Access',
        query: 'SELECT COUNT(*) as count FROM shipments',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'Complaints Table Access',
        query: 'SELECT COUNT(*) as count FROM complaints',
        validator: (result) => result.rows.length > 0
      },
      {
        name: 'Foreign Key Integrity',
        query: `
          SELECT 
            (SELECT COUNT(*) FROM lsp_profiles lp JOIN users u ON lp.user_id = u.id) as lsp_users,
            (SELECT COUNT(*) FROM containers c JOIN lsp_profiles lp ON c.lsp_id = lp.id) as container_lsps,
            (SELECT COUNT(*) FROM bookings b JOIN containers c ON b.container_id = c.id) as booking_containers
        `,
        validator: (result) => result.rows.length > 0
      }
    ];

    for (const test of dbTests) {
      try {
        const result = await db.query(test.query);
        const passed = test.validator(result);
        this.addTestResult('database', test.name, passed, 
          passed ? 'Query executed successfully' : 'Query validation failed');
      } catch (error) {
        this.addTestResult('database', test.name, false, error.message);
      }
    }
  }

  async testLSPEndpoints() {
    this.log('Testing LSP API endpoints...');
    
    // Authentication endpoints
    await this.testLSPAuthentication();
    
    if (this.lspToken) {
      // Profile management
      await this.testLSPProfileEndpoints();
      
      // Container management
      await this.testLSPContainerEndpoints();
      
      // Booking management
      await this.testLSPBookingEndpoints();
      
      // Shipment management
      await this.testLSPShipmentEndpoints();
      
      // Complaint management
      await this.testLSPComplaintEndpoints();
      
      // Analytics
      await this.testLSPAnalyticsEndpoints();
    }
  }

  async testLSPAuthentication() {
    // Test LSP registration
    const testUser = {
      name: 'Test LSP User',
      email: `testlsp${Date.now()}@example.com`,
      password: 'password123',
      role: 'lsp',
      company_name: 'Test Logistics Co',
      pan_number: `PAN${Date.now()}`,
      gst_number: `GST${Date.now()}`,
      phone: '9876543210',
      address: 'Test Address'
    };

    const { ok: registerOk, data: registerData } = await this.makeRequest('/api/lsp/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    this.addTestResult('lsp', 'LSP Registration', registerOk, 
      registerOk ? 'User registered successfully' : 'Registration failed');
    
    if (registerOk) {
      this.testData.userId = registerData.user?.id;
    }

    // Test LSP login
    const { ok: loginOk, data: loginData } = await this.makeRequest('/api/lsp/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    this.addTestResult('lsp', 'LSP Login', loginOk, 
      loginOk ? 'Login successful' : 'Login failed');
    
    if (loginOk) {
      this.lspToken = loginData.token;
    }
  }

  async testLSPProfileEndpoints() {
    const endpoints = [
      {
        name: 'Get Profile',
        method: 'GET',
        url: '/api/lsp/profile',
        requiresAuth: true
      },
      {
        name: 'Update Profile',
        method: 'PUT',
        url: '/api/lsp/profile',
        requiresAuth: true,
        body: {
          company_name: 'Updated Test Logistics Co',
          phone: '9876543211'
        }
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('lsp', endpoint);
    }
  }

  async testLSPContainerEndpoints() {
    const endpoints = [
      {
        name: 'List Containers',
        method: 'GET',
        url: '/api/lsp/containers',
        requiresAuth: true
      },
      {
        name: 'Create Container',
        method: 'POST',
        url: '/api/lsp/containers',
        requiresAuth: true,
        body: {
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
        }
      }
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint('lsp', endpoint);
      if (endpoint.name === 'Create Container' && result.ok) {
        this.testData.containerId = result.data?.container?.id;
      }
    }

    // Test container update if container was created
    if (this.testData.containerId) {
      await this.testEndpoint('lsp', {
        name: 'Update Container',
        method: 'PUT',
        url: `/api/lsp/containers/${this.testData.containerId}`,
        requiresAuth: true,
        body: { status: 'booked' }
      });
    }
  }

  async testLSPBookingEndpoints() {
    const endpoints = [
      {
        name: 'List Bookings',
        method: 'GET',
        url: '/api/lsp/bookings',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint('lsp', endpoint);
      if (endpoint.name === 'List Bookings' && result.ok && result.data.length > 0) {
        this.testData.bookingId = result.data[0].id;
      }
    }

    // Test booking status update if booking exists
    if (this.testData.bookingId) {
      await this.testEndpoint('lsp', {
        name: 'Update Booking Status',
        method: 'PUT',
        url: `/api/lsp/bookings/${this.testData.bookingId}/status`,
        requiresAuth: true,
        body: { status: 'approved' }
      });
    }
  }

  async testLSPShipmentEndpoints() {
    const endpoints = [
      {
        name: 'List Shipments',
        method: 'GET',
        url: '/api/lsp/shipments',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint('lsp', endpoint);
      if (endpoint.name === 'List Shipments' && result.ok && result.data.length > 0) {
        this.testData.shipmentId = result.data[0].id;
      }
    }

    // Test shipment creation if booking exists
    if (this.testData.bookingId) {
      const result = await this.testEndpoint('lsp', {
        name: 'Create Shipment',
        method: 'POST',
        url: '/api/lsp/shipments',
        requiresAuth: true,
        body: {
          booking_id: this.testData.bookingId,
          shipment_number: `SHIP${Date.now()}`,
          status: 'scheduled',
          departure_port: 'Mumbai',
          arrival_port: 'Dubai',
          estimated_arrival_date: '2024-02-15T10:00:00Z'
        }
      });

      if (result.ok) {
        this.testData.shipmentId = result.data?.shipment?.id;
      }
    }

    // Test shipment status update if shipment exists
    if (this.testData.shipmentId) {
      await this.testEndpoint('lsp', {
        name: 'Update Shipment Status',
        method: 'PUT',
        url: `/api/lsp/shipments/${this.testData.shipmentId}/status`,
        requiresAuth: true,
        body: { status: 'in_transit' }
      });
    }
  }

  async testLSPComplaintEndpoints() {
    const endpoints = [
      {
        name: 'List Complaints',
        method: 'GET',
        url: '/api/lsp/complaints',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint('lsp', endpoint);
      if (endpoint.name === 'List Complaints' && result.ok && result.data.length > 0) {
        this.testData.complaintId = result.data[0].id;
      }
    }

    // Test complaint response if complaint exists
    if (this.testData.complaintId) {
      await this.testEndpoint('lsp', {
        name: 'Respond to Complaint',
        method: 'POST',
        url: `/api/lsp/complaints/${this.testData.complaintId}/respond`,
        requiresAuth: true,
        body: { response: 'We are looking into this matter and will resolve it soon.' }
      });
    }
  }

  async testLSPAnalyticsEndpoints() {
    const endpoints = [
      {
        name: 'Get Analytics',
        method: 'GET',
        url: '/api/lsp/analytics',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('lsp', endpoint);
    }
  }

  async testAdminEndpoints() {
    this.log('Testing Admin API endpoints...');
    
    // Authentication
    await this.testAdminAuthentication();
    
    if (this.adminToken) {
      // User management
      await this.testAdminUserEndpoints();
      
      // LSP management
      await this.testAdminLSPEndpoints();
      
      // Container management
      await this.testAdminContainerEndpoints();
      
      // Booking management
      await this.testAdminBookingEndpoints();
      
      // Shipment management
      await this.testAdminShipmentEndpoints();
      
      // Complaint management
      await this.testAdminComplaintEndpoints();
      
      // Dashboard
      await this.testAdminDashboardEndpoints();
    }
  }

  async testAdminAuthentication() {
    const { ok, data } = await this.makeRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@cargomatch.in',
        password: 'adminCargomatch123'
      })
    });

    this.addTestResult('admin', 'Admin Login', ok, 
      ok ? 'Admin login successful' : 'Admin login failed');
    
    if (ok) {
      this.adminToken = data.token;
    }
  }

  async testAdminUserEndpoints() {
    const endpoints = [
      {
        name: 'List Users',
        method: 'GET',
        url: '/api/admin/users',
        requiresAuth: true
      },
      {
        name: 'Get User Details',
        method: 'GET',
        url: '/api/admin/users/1',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testAdminLSPEndpoints() {
    const endpoints = [
      {
        name: 'List LSPs',
        method: 'GET',
        url: '/api/admin/lsps',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testAdminContainerEndpoints() {
    const endpoints = [
      {
        name: 'List Containers',
        method: 'GET',
        url: '/api/admin/containers',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testAdminBookingEndpoints() {
    const endpoints = [
      {
        name: 'List Bookings',
        method: 'GET',
        url: '/api/admin/bookings',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testAdminShipmentEndpoints() {
    const endpoints = [
      {
        name: 'List Shipments',
        method: 'GET',
        url: '/api/admin/shipments',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testAdminComplaintEndpoints() {
    const endpoints = [
      {
        name: 'List Complaints',
        method: 'GET',
        url: '/api/admin/complaints',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testAdminDashboardEndpoints() {
    const endpoints = [
      {
        name: 'Get Dashboard',
        method: 'GET',
        url: '/api/admin/dashboard',
        requiresAuth: true
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint('admin', endpoint);
    }
  }

  async testEndpoint(module, endpoint) {
    const headers = {};
    if (endpoint.requiresAuth) {
      const token = module === 'lsp' ? this.lspToken : this.adminToken;
      if (!token) {
        this.addTestResult(module, endpoint.name, false, 'No authentication token');
        return { ok: false };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method: endpoint.method,
      headers
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const { ok, data, status, error } = await this.makeRequest(endpoint.url, options);
    
    this.addTestResult(module, endpoint.name, ok, 
      ok ? `Status: ${status}` : `Failed: ${error || status}`);
    
    return { ok, data, status, error };
  }

  async run() {
    console.log('🎯 CargoMatch API Endpoint Testing Suite');
    console.log('=========================================\n');
    
    try {
      // Test database operations
      await this.testDatabaseOperations();
      
      // Test LSP endpoints
      await this.testLSPEndpoints();
      
      // Test Admin endpoints
      await this.testAdminEndpoints();
      
      // Generate summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ API testing failed:', error.message);
    }
  }

  generateSummary() {
    console.log('\n📊 API Endpoint Testing Summary:');
    console.log('=================================');
    
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
    
    console.log('\n🎯 Overall API Testing:');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalTests - totalPassed}`);
    console.log(`   📈 Overall Success Rate: ${overallSuccessRate}%`);
    
    if (overallSuccessRate === 100) {
      console.log('\n🎉 ALL API ENDPOINTS WORKING PERFECTLY!');
      console.log('✅ Migration is successful and all endpoints are functional');
    } else if (overallSuccessRate >= 90) {
      console.log('\n⚠️  Most API endpoints are working. Please review failed tests above.');
    } else {
      console.log('\n❌ Multiple API endpoint failures detected. Please review and fix issues.');
    }
  }
}

// Run testing if this file is executed directly
if (require.main === module) {
  const tester = new APIEndpointTester();
  tester.run()
    .then(() => {
      console.log('\n✅ API endpoint testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API endpoint testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { APIEndpointTester };
