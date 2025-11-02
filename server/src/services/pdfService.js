const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFService {
  static async generateTraderVerificationPDF(traderData) {
    try {
      console.log('🔍 Generating trader verification PDF...');
      
      // Create HTML content for the PDF
      const htmlContent = this.generateTraderHTML(traderData);
      
      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      
      console.log('✅ PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error.message);
      throw error;
    }
  }
  
  static generateTraderHTML(trader) {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trader Verification Document</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .section {
                background: white;
                padding: 25px;
                margin-bottom: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-left: 4px solid #667eea;
            }
            .section h2 {
                color: #667eea;
                margin-top: 0;
                margin-bottom: 20px;
                font-size: 20px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 10px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            .info-item {
                display: flex;
                flex-direction: column;
            }
            .info-label {
                font-weight: bold;
                color: #555;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .info-value {
                color: #333;
                font-size: 16px;
                padding: 8px 12px;
                background-color: #f8f9fa;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            }
            .full-width {
                grid-column: 1 / -1;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-pending {
                background-color: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            .status-approved {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .status-rejected {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
                color: #666;
                font-size: 14px;
            }
            .document-path {
                background-color: #e3f2fd;
                border: 1px solid #bbdefb;
                padding: 10px;
                border-radius: 4px;
                margin-top: 5px;
                font-family: monospace;
                font-size: 12px;
                color: #1976d2;
            }
            .no-data {
                color: #999;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚢 CargoMatch</h1>
            <p>Trader Verification Document</p>
            <p>Generated on: ${currentDate}</p>
        </div>

        <div class="section">
            <h2>👤 Personal Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${trader.first_name || ''} ${trader.last_name || ''}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${trader.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">${trader.phone_number || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Registration Date</div>
                    <div class="info-value">${trader.created_at ? new Date(trader.created_at).toLocaleDateString('en-IN') : 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🏢 Company Information</h2>
            <div class="info-grid">
                <div class="info-item full-width">
                    <div class="info-label">Business Name (Company Name)</div>
                    <div class="info-value">${trader.company_name || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">GST Number</div>
                    <div class="info-value">${trader.gst_number || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">PAN Number</div>
                    <div class="info-value">${trader.pan_number || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">IEC Number</div>
                    <div class="info-value">${trader.iec_number || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Company Registration</div>
                    <div class="info-value">${trader.company_registration || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📍 Address Information</h2>
            <div class="info-grid">
                <div class="info-item full-width">
                    <div class="info-label">Complete Address</div>
                    <div class="info-value">${trader.address || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">City</div>
                    <div class="info-value">${trader.city || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">State</div>
                    <div class="info-value">${trader.state || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Pincode</div>
                    <div class="info-value">${trader.pincode || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Country</div>
                    <div class="info-value">${trader.country || 'India'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📄 Document Verification</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">PAN Document</div>
                    <div class="info-value">
                        ${trader.pan_document_path ? 
                          `<div class="document-path">📎 ${trader.pan_document_path}</div>` : 
                          '<span class="no-data">No document uploaded</span>'
                        }
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">GST Document</div>
                    <div class="info-value">
                        ${trader.gst_document_path ? 
                          `<div class="document-path">📎 ${trader.gst_document_path}</div>` : 
                          '<span class="no-data">No document uploaded</span>'
                        }
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">IEC Document</div>
                    <div class="info-value">
                        ${trader.iec_document_path ? 
                          `<div class="document-path">📎 ${trader.iec_document_path}</div>` : 
                          '<span class="no-data">No document uploaded</span>'
                        }
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Company Registration Document</div>
                    <div class="info-value">
                        ${trader.company_registration_document_path ? 
                          `<div class="document-path">📎 ${trader.company_registration_document_path}</div>` : 
                          '<span class="no-data">No document uploaded</span>'
                        }
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>✅ Verification Status</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Approval Status</div>
                    <div class="info-value">
                        <span class="status-badge status-${trader.approval_status || 'pending'}">
                            ${trader.approval_status || 'pending'}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Account Status</div>
                    <div class="info-value">
                        <span class="status-badge ${trader.is_active ? 'status-approved' : 'status-pending'}">
                            ${trader.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Verification Status</div>
                    <div class="info-value">
                        <span class="status-badge status-${trader.verification_status || 'pending'}">
                            ${trader.verification_status || 'pending'}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Last Updated</div>
                    <div class="info-value">${trader.updated_at ? new Date(trader.updated_at).toLocaleDateString('en-IN') : 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>CargoMatch Platform</strong> - Sea Shipping Logistics Management</p>
            <p>This document contains sensitive information and should be handled securely.</p>
            <p>Document ID: TRADER-${trader.id}-${Date.now()}</p>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = PDFService;
