# Cloudinary Setup Guide for CargoMatch

## Overview
This guide will help you set up Cloudinary cloud storage for PDF document management in the CargoMatch admin panel.

## What is Cloudinary?
Cloudinary is a cloud-based image and video management platform that also supports document storage. It provides:
- **Secure cloud storage** for PDF documents
- **Direct URL access** for viewing documents
- **Automatic optimization** and compression
- **CDN delivery** for fast access worldwide
- **Free tier** with generous limits

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Fill in your details and create account
4. Verify your email address

### 2. Get Your Credentials
1. After login, go to your **Dashboard**
2. You'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these three values

### 3. Configure Environment Variables
Update your `server/env-neon.txt` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=demo-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 4. Copy to .env File
Copy the updated configuration to your `.env` file:
```bash
cp env-neon.txt .env
```

### 5. Restart Server
Restart your server to load the new environment variables:
```bash
node server.js
```

## Features Enabled

### ✅ Cloud PDF Storage
- **Upload**: Admins can upload PDF documents directly to cloud storage
- **View**: PDFs are served directly from Cloudinary CDN
- **Secure**: Documents are stored securely in your private cloud space

### ✅ Document Management
- **PAN Documents**: Upload and view PAN certificates
- **GST Documents**: Upload and view GST certificates  
- **IEC Documents**: Upload and view IEC certificates
- **Company Registration**: Upload and view company registration documents

### ✅ Admin Interface
- **Upload Buttons**: Click the cloud upload icon next to each document type
- **Progress Indicators**: Real-time upload progress
- **Error Handling**: Clear error messages for failed uploads
- **File Validation**: Only PDF files accepted, 10MB size limit

## How It Works

### 1. Document Upload Flow
```
Admin clicks Upload → Selects PDF → Uploads to Cloudinary → URL stored in database
```

### 2. Document Viewing Flow
```
Admin clicks View → Cloudinary URL → PDF served from CDN → Displayed in modal
```

### 3. File Organization
Documents are organized in Cloudinary as:
```
cargomatch/documents/
├── trader-{userId}-pan-{timestamp}
├── trader-{userId}-gst-{timestamp}
├── trader-{userId}-iec-{timestamp}
└── trader-{userId}-company-registration-{timestamp}
```

## Benefits

### 🚀 Performance
- **Fast Loading**: CDN delivery worldwide
- **Optimized**: Automatic compression and optimization
- **Scalable**: Handles high traffic loads

### 🔒 Security
- **Private Storage**: Documents stored in your private cloud space
- **Access Control**: Only authenticated admins can upload/view
- **Secure URLs**: Time-limited access URLs available

### 💰 Cost Effective
- **Free Tier**: 25GB storage, 25GB bandwidth/month
- **Pay as you grow**: Only pay for what you use
- **No server storage**: Reduces server storage costs

## Troubleshooting

### Common Issues

#### 1. "Invalid Cloudinary credentials"
- **Solution**: Check your environment variables are correct
- **Check**: Ensure no extra spaces in credentials

#### 2. "Upload failed"
- **Solution**: Check file size (must be < 10MB)
- **Check**: Ensure file is PDF format

#### 3. "Cannot view document"
- **Solution**: Check Cloudinary URL is accessible
- **Check**: Verify document was uploaded successfully

### Testing Upload
1. Go to any trader detail page
2. Click the cloud upload icon next to any document type
3. Select a PDF file
4. Watch the upload progress
5. Verify the document appears as "✅ Uploaded"

## Support
- **Cloudinary Docs**: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Free Support**: Available in Cloudinary dashboard
- **Community**: Active community forums

## Next Steps
After setup, you can:
1. **Upload test documents** to verify functionality
2. **Configure additional settings** in Cloudinary dashboard
3. **Set up monitoring** for upload success rates
4. **Implement backup strategies** for important documents
