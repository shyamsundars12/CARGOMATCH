const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Create Cloudinary storage for multer
// IMPORTANT: For PDF files, we MUST use resource_type: "raw" and access_mode: "public"
// This is because PDFs are not images and need special handling in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Generate unique public_id with timestamp
    const timestamp = Date.now();
    const userId = req.params.id || req.user?.id || 'anonymous';
    const docType = req.params.docType || 'document';
    
    // CloudinaryStorage internally calls cloudinary.uploader.upload with these params
    // For PDFs, we MUST specify resource_type: "raw" to allow public viewing
    return {
      folder: 'cargomatch/documents', // Folder in Cloudinary
      allowed_formats: ['pdf'],
      resource_type: 'raw', // REQUIRED: PDFs are raw files, not images
      public_id: `trader-${userId}-${docType}-${timestamp}`,
      access_mode: 'public', // REQUIRED: Make files publicly accessible for viewing
      overwrite: false,
      use_filename: false,
      unique_filename: true
    };
  }
});

// Configure multer with Cloudinary storage
const multer = require('multer');
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Direct upload function for PDF files (using cloudinary.uploader.upload)
// Use this when uploading files directly without multer
// This explicitly uses cloudinary.uploader.upload with resource_type: "raw" and access_mode: "public"
// as recommended by Cloudinary documentation for PDF files
const uploadPDFDirect = async (filePath, options = {}) => {
  try {
    // IMPORTANT: For PDF files, we MUST use resource_type: "raw" and access_mode: "public"
    // This is exactly as specified in Cloudinary documentation:
    // cloudinary.uploader.upload(filePath, { resource_type: "raw", access_mode: "public" })
    const uploadOptions = {
      resource_type: 'raw', // REQUIRED: PDFs are raw files, not images
      access_mode: 'public', // REQUIRED: Make files publicly accessible for viewing
      folder: options.folder || 'cargomatch/documents',
      public_id: options.public_id || undefined,
      overwrite: options.overwrite || false,
      use_filename: options.use_filename || false,
      unique_filename: options.unique_filename !== false, // Default to true
      ...options
    };

    console.log('Uploading PDF directly to Cloudinary:', {
      filePath,
      options: uploadOptions
    });

    // This is the exact pattern from Cloudinary documentation:
    // cloudinary.uploader.upload(filePath, { resource_type: "raw", access_mode: "public" })
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log('PDF uploaded successfully:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      access_mode: result.access_mode
    });

    return result;
  } catch (error) {
    console.error('Error uploading PDF directly to Cloudinary:', error);
    throw error;
  }
};

// Helper function to make existing files publicly accessible
const makeFilePublic = async (publicId) => {
  try {
    // Remove file extension from public_id if present
    let cleanPublicId = publicId;
    if (cleanPublicId.endsWith('.pdf')) {
      cleanPublicId = cleanPublicId.replace(/\.pdf$/i, '');
    }
    
    // Use explicit to set access mode and get secure URL
    const result = await cloudinary.uploader.explicit(cleanPublicId, {
      resource_type: 'raw',
      type: 'upload',
      access_mode: 'public',
      overwrite: false
    });
    
    console.log('File made public:', cleanPublicId, 'URL:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Error making file public:', error);
    // If explicit fails, try to get the URL anyway - it might already be public
    try {
      const url = cloudinary.url(publicId, {
        resource_type: 'raw',
        secure: true,
        access_mode: 'public'
      });
      return {
        secure_url: url,
        public_id: publicId,
        access_mode: 'public'
      };
    } catch (urlError) {
      throw error; // Throw original error
    }
  }
};

// Helper function to get Cloudinary URL for viewing
const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true,
    format: 'pdf',
    flags: options.inline ? 'inline' : 'attachment', // Force download or inline viewing
    ...options
  });
};

// Helper function to get public ID from URL
const getPublicIdFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    // Clean the URL - remove query parameters and fragments
    let cleanUrl = url.split('?')[0].split('#')[0];
    
    // Format: https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{path}/{filename}
    // Example: https://res.cloudinary.com/dyxknaok0/raw/upload/v1762009318/cargomatch/traders/booking_1762009315858/shipping_permit/_1762009315859.pdf
    // We need to extract: cargomatch/traders/booking_1762009315858/shipping_permit/_1762009315859
    
    // Pattern 1: With version number
    let match = cleanUrl.match(/res\.cloudinary\.com\/[^/]+\/raw\/upload\/v\d+\/(.+?)(?:\.pdf)?$/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // Pattern 2: Without version number
    match = cleanUrl.match(/res\.cloudinary\.com\/[^/]+\/raw\/upload\/(.+?)(?:\.pdf)?$/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // Pattern 3: Alternative format
    match = cleanUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+?)(?:\.pdf)?$/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // Pattern 4: Just the path after raw/upload
    match = cleanUrl.match(/raw\/upload\/(?:v\d+\/)?(.+?)(?:\.pdf)?$/i);
    if (match && match[1]) {
      return match[1];
    }
    
    console.warn('Could not extract public ID from URL:', url);
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Helper function to generate proper viewing URL from public ID
const getViewableUrl = (publicId) => {
  try {
    if (!publicId) return null;
    
    // Remove .pdf extension if present (Cloudinary handles it automatically)
    let cleanPublicId = publicId.replace(/\.pdf$/i, '');
    
    // Generate secure URL for viewing raw PDF files
    // For raw files, we use the secure URL without transformations
    const url = cloudinary.url(cleanPublicId, {
      resource_type: 'raw',
      secure: true,
      // Don't add format for raw files - Cloudinary serves them as-is
      // Add fetch_format: false to prevent automatic format conversion
    });
    
    return url;
  } catch (error) {
    console.error('Error generating viewable URL:', error);
    return null;
  }
};

// Helper function to fix/clean Cloudinary URL for viewing
const fixCloudinaryUrl = (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return url; // Return as-is if not Cloudinary URL
    }
    
    // Clean URL - remove query parameters that might interfere
    let cleanUrl = url.split('?')[0].split('#')[0];
    
    // Ensure it's using HTTPS
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }
    
    // If URL doesn't have proper structure, try to fix it
    // Ensure it has the correct format: https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}.pdf
    const cloudNameMatch = cleanUrl.match(/res\.cloudinary\.com\/([^/]+)/);
    if (cloudNameMatch && !cleanUrl.includes('/raw/upload/')) {
      // Try to construct proper URL if missing path
      const publicId = getPublicIdFromUrl(cleanUrl);
      if (publicId) {
        return getViewableUrl(publicId);
      }
    }
    
    return cleanUrl;
  } catch (error) {
    console.error('Error fixing Cloudinary URL:', error);
    return url; // Return original if fixing fails
  }
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadPDFDirect, // Direct upload function for PDFs
  getCloudinaryUrl,
  deleteFromCloudinary,
  makeFilePublic,
  getPublicIdFromUrl,
  getViewableUrl,
  fixCloudinaryUrl
};
