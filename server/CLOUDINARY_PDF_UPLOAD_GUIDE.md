# Cloudinary PDF Upload Guide

## Important: PDF Upload Configuration

When uploading PDF files to Cloudinary, you **MUST** use the following configuration:

```javascript
cloudinary.uploader.upload(filePath, {
  resource_type: "raw",  // REQUIRED: PDFs are raw files, not images
  access_mode: "public"  // REQUIRED: Make files publicly accessible for viewing
}, function(error, result) {
  console.log(result, error);
});
```

## Why This Is Important

1. **PDFs are not images**: Cloudinary treats PDFs as raw files, not images
2. **Public access**: Without `access_mode: "public"`, PDFs cannot be viewed by users
3. **Direct download**: The `resource_type: "raw"` allows proper PDF viewing and downloading

## Current Implementation

### Using Multer + CloudinaryStorage

Our current implementation uses `multer-storage-cloudinary`, which internally calls `cloudinary.uploader.upload` with the parameters we provide.

**File**: `server/src/config/cloudinary.js`

```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      resource_type: 'raw',    // ✅ REQUIRED for PDFs
      access_mode: 'public',   // ✅ REQUIRED for public viewing
      folder: 'cargomatch/documents',
      // ... other options
    };
  }
});
```

### Direct Upload Function

For cases where you need to upload files directly (without multer), use:

**File**: `server/src/config/cloudinary.js`

```javascript
const { uploadPDFDirect } = require('./src/config/cloudinary');

// Upload a PDF file directly
const result = await uploadPDFDirect(filePath, {
  folder: 'cargomatch/documents',
  public_id: 'custom-public-id'
});

console.log('Uploaded:', result.secure_url);
```

## Verification

After uploading, verify the file is accessible:

1. Check the URL format: `https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{public_id}.pdf`
2. Test direct access: Try opening the URL in a browser
3. Check access mode: The file should be publicly accessible

## Troubleshooting

### File Not Viewable

If a PDF is not viewable:

1. **Check access mode**: Ensure `access_mode: "public"` was used during upload
2. **Check resource type**: Ensure `resource_type: "raw"` was used
3. **Make file public**: Use the `makeFilePublic()` function to update existing files:

```javascript
const { makeFilePublic, getPublicIdFromUrl } = require('./src/config/cloudinary');

const publicId = getPublicIdFromUrl(url);
await makeFilePublic(publicId);
```

### URL Generation

For viewing URLs, use:

```javascript
const { getViewableUrl } = require('./src/config/cloudinary');

const viewableUrl = getViewableUrl(publicId);
// Returns: https://res.cloudinary.com/{cloud_name}/raw/upload/{public_id}.pdf
```

## API Endpoint

To make existing files public, use:

```
POST /api/cloudinary/make-public
Body: { url: "https://res.cloudinary.com/..." }
```

This endpoint:
1. Extracts the public ID from the URL
2. Makes the file publicly accessible
3. Returns the viewable URL

