const { cloudinary, getPublicIdFromUrl, getViewableUrl, makeFilePublic } = require('./src/config/cloudinary');

async function testCloudinaryViewing() {
  console.log('Testing Cloudinary Document Viewing...\n');
  
  // Test URLs from the database (example format)
  const testUrls = [
    'https://res.cloudinary.com/dyxknaok0/raw/upload/v1762006528/cargomatch/traders/booking_1762006525668/shipping_permit/_1762006525668.pdf',
    'https://res.cloudinary.com/dyxknaok0/raw/upload/v1762009318/cargomatch/traders/booking_1762009315858/shipping_permit/_1762009315859.pdf'
  ];
  
  for (const url of testUrls) {
    console.log('\n' + '='.repeat(60));
    console.log('Testing URL:', url);
    console.log('='.repeat(60));
    
    try {
      // Extract public ID
      const publicId = getPublicIdFromUrl(url);
      console.log('Extracted Public ID:', publicId);
      
      if (!publicId) {
        console.error('❌ Could not extract public ID');
        continue;
      }
      
      // Generate viewable URL
      const viewableUrl = getViewableUrl(publicId);
      console.log('Generated Viewable URL:', viewableUrl);
      
      // Try to make file public
      try {
        const result = await makeFilePublic(publicId);
        console.log('✅ File made public:', result.secure_url || 'Success');
      } catch (error) {
        console.warn('⚠️  Could not make file public (may already be public):', error.message);
        
        // Generate URL anyway
        const viewableUrl2 = getViewableUrl(publicId);
        console.log('Generated URL (without explicit):', viewableUrl2);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test completed!');
  console.log('='.repeat(60));
}

testCloudinaryViewing().catch(console.error);

