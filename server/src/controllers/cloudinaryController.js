const { makeFilePublic, getPublicIdFromUrl, getViewableUrl } = require('../config/cloudinary');

/**
 * Make a Cloudinary file public
 * POST /api/cloudinary/make-public
 * Body: { url: "https://res.cloudinary.com/..." }
 */
exports.makeFilePublic = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes('cloudinary.com')) {
      return res.status(400).json({ error: 'Invalid Cloudinary URL' });
    }

    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      return res.status(400).json({ 
        error: 'Could not extract public ID from URL',
        url: url
      });
    }

    console.log('Extracted public ID:', publicId, 'from URL:', url);
    
    // Make file public
    let result;
    try {
      result = await makeFilePublic(publicId);
    } catch (makePublicError) {
      console.warn('Error making file public, trying to generate viewable URL anyway:', makePublicError.message);
      // Try to generate viewable URL even if making public fails
      const viewableUrl = getViewableUrl(publicId);
      if (viewableUrl) {
        return res.json({
          message: 'Generated viewable URL (file may already be public)',
          public_id: publicId,
          secure_url: viewableUrl,
          original_url: url
        });
      }
      throw makePublicError;
    }
    
    // Get proper viewable URL - always generate fresh URL from public ID
    const viewableUrl = getViewableUrl(publicId);
    
    // Also try to use the secure_url from the result
    const finalUrl = viewableUrl || result.secure_url || url;
    
    console.log('Final viewable URL:', finalUrl);
    
    res.json({
      message: 'File made public successfully',
      public_id: publicId,
      secure_url: finalUrl,
      viewable_url: finalUrl,
      original_url: url
    });
  } catch (error) {
    console.error('Error making file public:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to make file public',
      details: error.toString()
    });
  }
};

