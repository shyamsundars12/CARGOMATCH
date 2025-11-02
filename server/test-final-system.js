const fetch = require('node-fetch').default || require('node-fetch');

async function testFinalSystem() {
  console.log('🎯 CargoMatch Final System Test');
  console.log('================================\n');
  
  let lspToken = null;
  let adminToken = null;
  let testResults = {
    lsp: { passed: 0, failed: 0, tests: [] },
    admin: { passed: 0, failed: 0, tests: [] }
  };
  
  function addTestResult(module, testName, passed, details = '') {
    testResults[module].tests.push({ name: testName, passed, details });
    if (passed) {
      testResults[module].passed++;
      console.log(`✅ ${testName}${details ? ` - ${details}` : ''}`);
    } else {
      testResults[module].failed++;
      console.log(`❌ ${testName}${details ? ` - ${details}` : ''}`);
    }
  }
  
  try {
    // Test 1: LSP System
    console.log('1️⃣  Testing LSP System...');
    
    // LSP Login
    try {
      const lspLoginResponse = await fetch('http://localhost:5000/api/lsp/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testlsp@example.com', password: 'password123' })
      });
      
      if (lspLoginResponse.ok) {
        const lspData = await lspLoginResponse.json();
        lspToken = lspData.token;
        addTestResult('lsp', 'LSP Login', true, `Token received`);
      } else {
        addTestResult('lsp', 'LSP Login', false, 'Login failed');
      }
    } catch (error) {
      addTestResult('lsp', 'LSP Login', false, error.message);
    }
    
    if (lspToken) {
      // LSP Analytics
      try {
        const analyticsResponse = await fetch('http://localhost:5000/api/lsp/analytics', {
          headers: { 'Authorization': `Bearer ${lspToken}` }
        });
        
        if (analyticsResponse.ok) {
          const analytics = await analyticsResponse.json();
          addTestResult('lsp', 'LSP Analytics', true, 
            `Containers: ${analytics.containers.total_containers}, Revenue: $${parseFloat(analytics.revenue.total_revenue).toFixed(2)}`);
        } else {
          addTestResult('lsp', 'LSP Analytics', false, 'Analytics failed');
        }
      } catch (error) {
        addTestResult('lsp', 'LSP Analytics', false, error.message);
      }
      
      // LSP Containers
      try {
        const containersResponse = await fetch('http://localhost:5000/api/lsp/containers', {
          headers: { 'Authorization': `Bearer ${lspToken}` }
        });
        
        if (containersResponse.ok) {
          const containers = await containersResponse.json();
          addTestResult('lsp', 'LSP Containers', true, `Count: ${containers.length}`);
        } else {
          addTestResult('lsp', 'LSP Containers', false, 'Containers failed');
        }
      } catch (error) {
        addTestResult('lsp', 'LSP Containers', false, error.message);
      }
      
      // LSP Bookings
      try {
        const bookingsResponse = await fetch('http://localhost:5000/api/lsp/bookings', {
          headers: { 'Authorization': `Bearer ${lspToken}` }
        });
        
        if (bookingsResponse.ok) {
          const bookings = await bookingsResponse.json();
          addTestResult('lsp', 'LSP Bookings', true, `Count: ${bookings.length}`);
        } else {
          addTestResult('lsp', 'LSP Bookings', false, 'Bookings failed');
        }
      } catch (error) {
        addTestResult('lsp', 'LSP Bookings', false, error.message);
      }
      
      // LSP Shipments
      try {
        const shipmentsResponse = await fetch('http://localhost:5000/api/lsp/shipments', {
          headers: { 'Authorization': `Bearer ${lspToken}` }
        });
        
        if (shipmentsResponse.ok) {
          const shipments = await shipmentsResponse.json();
          addTestResult('lsp', 'LSP Shipments', true, `Count: ${shipments.length}`);
        } else {
          addTestResult('lsp', 'LSP Shipments', false, 'Shipments failed');
        }
      } catch (error) {
        addTestResult('lsp', 'LSP Shipments', false, error.message);
      }
    }
    
    console.log('\n2️⃣  Testing Admin System...');
    
    // Admin Login
    try {
      const adminLoginResponse = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@cargomatch.in', password: 'adminCargomatch123' })
      });
      
      if (adminLoginResponse.ok) {
        const adminData = await adminLoginResponse.json();
        adminToken = adminData.token;
        addTestResult('admin', 'Admin Login', true, 'Token received');
      } else {
        addTestResult('admin', 'Admin Login', false, 'Login failed');
      }
    } catch (error) {
      addTestResult('admin', 'Admin Login', false, error.message);
    }
    
    if (adminToken) {
      // Admin Dashboard
      try {
        const dashboardResponse = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (dashboardResponse.ok) {
          const dashboard = await dashboardResponse.json();
          addTestResult('admin', 'Admin Dashboard', true, 
            `Users: ${dashboard.users}, LSPs: ${dashboard.lsps}, Containers: ${dashboard.containers}`);
        } else {
          addTestResult('admin', 'Admin Dashboard', false, 'Dashboard failed');
        }
      } catch (error) {
        addTestResult('admin', 'Admin Dashboard', false, error.message);
      }
      
      // Admin Users
      try {
        const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          addTestResult('admin', 'Admin Users', true, `Count: ${users.length}`);
        } else {
          addTestResult('admin', 'Admin Users', false, 'Users failed');
        }
      } catch (error) {
        addTestResult('admin', 'Admin Users', false, error.message);
      }
      
      // Admin LSPs
      try {
        const lspsResponse = await fetch('http://localhost:5000/api/admin/lsps', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (lspsResponse.ok) {
          const lsps = await lspsResponse.json();
          addTestResult('admin', 'Admin LSPs', true, `Count: ${lsps.length}`);
        } else {
          addTestResult('admin', 'Admin LSPs', false, 'LSPs failed');
        }
      } catch (error) {
        addTestResult('admin', 'Admin LSPs', false, error.message);
      }
      
      // Admin Bookings
      try {
        const bookingsResponse = await fetch('http://localhost:5000/api/admin/bookings', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (bookingsResponse.ok) {
          const bookings = await bookingsResponse.json();
          addTestResult('admin', 'Admin Bookings', true, `Count: ${bookings.length}`);
        } else {
          addTestResult('admin', 'Admin Bookings', false, 'Bookings failed');
        }
      } catch (error) {
        addTestResult('admin', 'Admin Bookings', false, error.message);
      }
      
      // Admin Shipments
      try {
        const shipmentsResponse = await fetch('http://localhost:5000/api/admin/shipments', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (shipmentsResponse.ok) {
          const shipments = await shipmentsResponse.json();
          addTestResult('admin', 'Admin Shipments', true, `Count: ${shipments.length}`);
        } else {
          addTestResult('admin', 'Admin Shipments', false, 'Shipments failed');
        }
      } catch (error) {
        addTestResult('admin', 'Admin Shipments', false, error.message);
      }
      
      // Admin Complaints
      try {
        const complaintsResponse = await fetch('http://localhost:5000/api/admin/complaints', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (complaintsResponse.ok) {
          const complaints = await complaintsResponse.json();
          addTestResult('admin', 'Admin Complaints', true, `Count: ${complaints.length}`);
        } else {
          addTestResult('admin', 'Admin Complaints', false, 'Complaints failed');
        }
      } catch (error) {
        addTestResult('admin', 'Admin Complaints', false, error.message);
      }
    }
    
    // Test 3: Database Integrity
    console.log('\n3️⃣  Testing Database Integrity...');
    try {
      const db = require('./src/config/db');
      
      const dbStats = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM lsp_profiles WHERE is_verified = TRUE) as verified_lsps,
          (SELECT COUNT(*) FROM containers) as containers,
          (SELECT COUNT(*) FROM bookings) as bookings,
          (SELECT COUNT(*) FROM shipments) as shipments,
          (SELECT COUNT(*) FROM complaints) as complaints;
      `);
      const stats = dbStats.rows[0];
      
      addTestResult('admin', 'Database Integrity', true, 
        `Users: ${stats.total_users}, LSPs: ${stats.verified_lsps}, Containers: ${stats.containers}`);
    } catch (error) {
      addTestResult('admin', 'Database Integrity', false, error.message);
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    console.log('\n🔵 LSP System:');
    console.log(`   ✅ Passed: ${testResults.lsp.passed}`);
    console.log(`   ❌ Failed: ${testResults.lsp.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((testResults.lsp.passed / (testResults.lsp.passed + testResults.lsp.failed)) * 100)}%`);
    
    console.log('\n🔴 Admin System:');
    console.log(`   ✅ Passed: ${testResults.admin.passed}`);
    console.log(`   ❌ Failed: ${testResults.admin.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((testResults.admin.passed / (testResults.admin.passed + testResults.admin.failed)) * 100)}%`);
    
    const totalPassed = testResults.lsp.passed + testResults.admin.passed;
    const totalTests = testResults.lsp.passed + testResults.lsp.failed + testResults.admin.passed + testResults.admin.failed;
    
    console.log('\n🎯 Overall System:');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalTests - totalPassed}`);
    console.log(`   📈 Overall Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
    
    if (totalPassed === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! The CargoMatch system is fully functional!');
      console.log('\n🚀 System Status:');
      console.log('✅ LSP Authentication & Analytics');
      console.log('✅ LSP Container Management');
      console.log('✅ LSP Booking Management');
      console.log('✅ LSP Shipment Management');
      console.log('✅ Admin Authentication & Dashboard');
      console.log('✅ Admin User Management');
      console.log('✅ Admin LSP Management');
      console.log('✅ Admin Booking Management');
      console.log('✅ Admin Shipment Management');
      console.log('✅ Admin Complaint Management');
      console.log('✅ Database Integrity');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
  }
  
  process.exit(0);
}

testFinalSystem();
