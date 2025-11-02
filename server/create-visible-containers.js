const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Sample container data for November, December, and January
// Creating containers for immediate testing with dates in the coming months
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-11

// Determine dates based on current month
const containerListings = [
  // NOVEMBER (current year or next year)
  {
    month: 'November',
    count: 8,
    startDate: new Date(currentYear, 10, 1), // November 1
    endDate: new Date(currentYear, 10, 30)   // November 30
  },
  // DECEMBER (current year or next year)
  {
    month: 'December',
    count: 10,
    startDate: new Date(currentYear, 11, 1), // December 1
    endDate: new Date(currentYear, 11, 31)   // December 31
  },
  // JANUARY (next year)
  {
    month: 'January',
    count: 8,
    startDate: new Date(currentYear + 1, 0, 1), // January 1 next year
    endDate: new Date(currentYear + 1, 0, 31)   // January 31 next year
  }
];

const ports = [
  { origin: 'Mumbai', destination: 'Dubai' },
  { origin: 'Chennai', destination: 'Singapore' },
  { origin: 'Kochi', destination: 'Colombo' },
  { origin: 'Tuticorin', destination: 'Port Klang' },
  { origin: 'Visakhapatnam', destination: 'Hong Kong' },
  { origin: 'Kolkata', destination: 'Chittagong' },
  { origin: 'Mangalore', destination: 'Jebel Ali' },
  { origin: 'Goa', destination: 'Karachi' }
];

const containerTypes = [
  { type: 'Dry Container', size: '20ft', capacity: 25, length: 6.06, width: 2.44, height: 2.59, weight: 2300 },
  { type: 'Dry Container', size: '40ft', capacity: 28, length: 12.19, width: 2.44, height: 2.59, weight: 3800 },
  { type: 'Refrigerated', size: '20ft', capacity: 20, length: 6.06, width: 2.44, height: 2.59, weight: 2800 },
  { type: 'Refrigerated', size: '40ft', capacity: 25, length: 12.19, width: 2.44, height: 2.59, weight: 4200 },
  { type: 'Open Top', size: '40ft', capacity: 30, length: 12.19, width: 2.44, height: 2.59, weight: 3500 },
  { type: 'Flat Rack', size: '40ft', capacity: 32, length: 12.19, width: 2.44, height: 2.59, weight: 4000 }
];

const currencies = ['INR', 'USD', 'EUR'];
const priceRanges = [
  { min: 15000, max: 35000, currency: 'INR' },
  { min: 180, max: 420, currency: 'USD' },
  { min: 160, max: 380, currency: 'EUR' }
];

async function getApprovedLSPs() {
  // First try to get approved LSPs
  let query = `
    SELECT lp.id as lsp_id, lp.user_id
    FROM lsp_profiles lp
    JOIN users u ON lp.user_id = u.id
    WHERE lp.is_verified = true 
    AND lp.verification_status = 'approved'
    AND u.approval_status = 'approved'
    ORDER BY lp.id
    LIMIT 10;
  `;
  let result = await pool.query(query);
  
  // If no approved LSPs, get any LSPs for testing
  if (result.rows.length === 0) {
    console.log('⚠️  No approved LSPs found. Using any available LSPs for testing...');
    const fallbackQuery = `
      SELECT lp.id as lsp_id, lp.user_id
      FROM lsp_profiles lp
      ORDER BY lp.id
      LIMIT 10;
    `;
    result = await pool.query(fallbackQuery);
  }
  
  return result.rows;
}

async function getContainerTypes() {
  const query = `SELECT id, type_name, size, capacity FROM container_types ORDER BY id LIMIT 10;`;
  const result = await pool.query(query);
  return result.rows;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

function generateContainerNumber() {
  const prefix = 'CONT';
  const number = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${number}`;
}

async function createContainerListings() {
  try {
    console.log('🚢 Creating container listings for November, December, and January...\n');
    
    // Get approved LSPs
    const approvedLSPs = await getApprovedLSPs();
    if (approvedLSPs.length === 0) {
      console.log('❌ No approved LSPs found. Please approve at least one LSP first.');
      return;
    }
    
    console.log(`✅ Found ${approvedLSPs.length} approved LSPs\n`);
    
    // Get container types
    const containerTypesFromDB = await getContainerTypes();
    if (containerTypesFromDB.length === 0) {
      console.log('❌ No container types found. Please add container types first.');
      return;
    }
    
    console.log(`✅ Found ${containerTypesFromDB.length} container types\n`);
    
    let totalCreated = 0;
    
    for (const listing of containerListings) {
      const year = listing.startDate.getFullYear();
      console.log(`📅 Creating containers for ${listing.month} ${year}...`);
      
      for (let i = 0; i < listing.count; i++) {
        const lsp = getRandomElement(approvedLSPs);
        const port = getRandomElement(ports);
        const containerSpec = getRandomElement(containerTypes);
        const priceInfo = getRandomElement(priceRanges);
        
        // Find matching container type from DB
        const containerTypeFromDB = containerTypesFromDB.find(
          ct => ct.type_name.includes(containerSpec.type.split(' ')[0]) && ct.size === containerSpec.size
        ) || containerTypesFromDB[0];
        
        // Generate dates
        const departureDate = getRandomDate(listing.startDate, listing.endDate);
        const arrivalDate = new Date(departureDate);
        arrivalDate.setDate(arrivalDate.getDate() + Math.floor(Math.random() * 15) + 7); // 7-21 days transit
        
        // Generate container number
        let containerNumber = generateContainerNumber();
        
        // Ensure unique container number
        let exists = true;
        while (exists) {
          const checkQuery = `SELECT id FROM containers WHERE container_number = $1;`;
          const checkResult = await pool.query(checkQuery, [containerNumber]);
          if (checkResult.rows.length === 0) {
            exists = false;
          } else {
            containerNumber = generateContainerNumber();
          }
        }
        
        const price = Math.floor(Math.random() * (priceInfo.max - priceInfo.min + 1)) + priceInfo.min;
        
        const insertQuery = `
          INSERT INTO containers (
            lsp_id, 
            container_type_id,
            container_number,
            size,
            type,
            capacity,
            current_location,
            status,
            is_available,
            departure_date,
            arrival_date,
            origin_port,
            destination_port,
            route_description,
            price_per_unit,
            currency,
            length,
            width,
            height,
            weight,
            container_approval_status,
            container_documents
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          RETURNING id, container_number;
        `;
        
        try {
          const result = await pool.query(insertQuery, [
            lsp.lsp_id,
            containerTypeFromDB.id,
            containerNumber,
            containerSpec.size,
            containerSpec.type,
            containerSpec.capacity,
            port.origin,
            'available',
            true,
            departureDate.toISOString(),
            arrivalDate.toISOString(),
            port.origin,
            port.destination,
            `Regular route from ${port.origin} to ${port.destination}`,
            price,
            priceInfo.currency,
            containerSpec.length,
            containerSpec.width,
            containerSpec.height,
            containerSpec.weight,
            'approved', // IMPORTANT: Set as approved so traders can see them
            '{}'
          ]);
          
          console.log(`   ✅ Created: ${containerNumber} (${port.origin} → ${port.destination}) - ${price} ${priceInfo.currency}`);
          totalCreated++;
        } catch (err) {
          console.error(`   ❌ Error creating container ${containerNumber}:`, err.message);
        }
      }
      
      console.log(`\n✅ ${listing.month}: ${listing.count} containers created\n`);
    }
    
    console.log('='.repeat(80));
    console.log(`🎉 SUCCESS! Created ${totalCreated} approved containers`);
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    const novYear = containerListings[0].startDate.getFullYear();
    const decYear = containerListings[1].startDate.getFullYear();
    const janYear = containerListings[2].startDate.getFullYear();
    console.log(`   • November ${novYear}: ${containerListings[0].count} containers`);
    console.log(`   • December ${decYear}: ${containerListings[1].count} containers`);
    console.log(`   • January ${janYear}: ${containerListings[2].count} containers`);
    console.log('\n✅ All containers are APPROVED and visible to traders');
    console.log('💰 Ready for payment flow testing!\n');
    
  } catch (error) {
    console.error('❌ Error creating containers:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

createContainerListings();
