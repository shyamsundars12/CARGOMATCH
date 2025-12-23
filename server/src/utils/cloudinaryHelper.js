const { cloudinary, makeFilePublic } = require('../config/cloudinary');

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if invalid
 */
function extractPublicIdFromUrl(url) {
  try {
    // Format: https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{path}/{filename}
    // Example: https://res.cloudinary.com/dyxknaok0/raw/upload/v1762009318/cargomatch/traders/booking_1762009315858/shipping_permit/_1762009315859.pdf
    const match = url.match(/res\.cloudinary\.com\/[^/]+\/raw\/upload\/(?:v\d+\/)?(.+?)\.pdf/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

/**
 * Make a Cloudinary file public given its URL
 * @param {string} url - Cloudinary URL
 * @returns {Promise<Object>} - Cloudinary response
 */
async function ensureFileIsPublic(url) {
  try {
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) {
      throw new Error('Could not extract public ID from URL');
    }

    console.log('Making file public:', publicId);
    const result = await makeFilePublic(publicId);
    return result;
  } catch (error) {
    console.error('Error making file public:', error);
    throw error;
  }
}

/**
 * Get Cloudinary URL with proper format for viewing
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Cleaned URL for viewing
 */
function getViewableUrl(url) {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  let cleanUrl = url.trim();
  // Remove trailing punctuation
  cleanUrl = cleanUrl.replace(/[.,;:!?)}\]]+$/, '');
  
  // Remove any transformation flags that might cause issues
  // Keep the URL as-is if it's a direct raw upload URL
  return cleanUrl;
}

module.exports = {
  extractPublicIdFromUrl,
  ensureFileIsPublic,
  getViewableUrl
};

