const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Create Cloudinary storage for booking documents
// IMPORTANT: For PDF files, we MUST use resource_type: "raw" and access_mode: "public"
// This ensures PDFs are uploaded correctly and can be viewed publicly
const bookingStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const timestamp = Date.now();
    const userId = req.user?.id || 'anonymous';
    const docType = req.body.docType || 'document';
    const bookingId = req.body.bookingId || `booking_${timestamp}`;
    
    // CloudinaryStorage internally calls cloudinary.uploader.upload with these params
    // Equivalent to: cloudinary.uploader.upload(filePath, { resource_type: "raw", access_mode: "public" })
    return {
      folder: `cargomatch/traders/${bookingId}`,
      allowed_formats: ['pdf'],
      resource_type: 'raw', // REQUIRED: PDFs are raw files, not images
      public_id: `${docType}/${timestamp}`,
      access_mode: 'public', // REQUIRED: Make files publicly accessible for viewing
      use_filename: false,
      unique_filename: true
    };
  }
});

// Configure multer for booking documents
const multer = require('multer');
const uploadBookingDoc = multer({
  storage: bookingStorage,
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

module.exports = {
  cloudinary,
  uploadBookingDoc
};

