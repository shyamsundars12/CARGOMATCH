const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Error serving file' });
  }
});

// Handle mobile file paths (placeholder files)
router.get('/mobile-files/:userId/:docType', (req, res) => {
  try {
    const { userId, docType } = req.params;
    
    // Create a placeholder PDF for mobile-uploaded files
    const placeholderHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Document Uploaded from Mobile</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 500px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
          .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            border-left: 4px solid #2196f3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
          <h1>Mobile Document Upload</h1>
          <p>This document was uploaded from the mobile application.</p>
          <div class="info">
            <strong>Document Type:</strong> ${docType}<br>
            <strong>User ID:</strong> ${userId}<br>
            <strong>Status:</strong> Document uploaded successfully
          </div>
          <p style="margin-top: 20px; font-size: 14px; color: #999;">
            The actual document file is stored on the mobile device and cannot be accessed directly from the web interface.
          </p>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(placeholderHtml);
    
  } catch (error) {
    console.error('Error serving mobile file:', error);
    res.status(500).json({ error: 'Error serving mobile file' });
  }
});

module.exports = router;
