const db = require('./src/config/db');

async function checkTableStructure() {
  try {
    console.log('Checking bookings table structure...');
    const result = await db.query('SELECT * FROM bookings LIMIT 1');
    if (result.rows.length > 0) {
      console.log('Bookings table columns:', Object.keys(result.rows[0]));
    } else {
      console.log('Bookings table is empty');
    }
    
    console.log('\nChecking containers table structure...');
    const containerResult = await db.query('SELECT * FROM containers LIMIT 1');
    if (containerResult.rows.length > 0) {
      console.log('Containers table columns:', Object.keys(containerResult.rows[0]));
    } else {
      console.log('Containers table is empty');
    }
    
    console.log('\nChecking shipments table structure...');
    const shipmentResult = await db.query('SELECT * FROM shipments LIMIT 1');
    if (shipmentResult.rows.length > 0) {
      console.log('Shipments table columns:', Object.keys(shipmentResult.rows[0]));
    } else {
      console.log('Shipments table is empty');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
