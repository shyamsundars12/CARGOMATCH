import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BookingApproval() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // PDF viewer states
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [currentPdfTitle, setCurrentPdfTitle] = useState('');
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLoadingTimeout, setPdfLoadingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookings(bookings);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = bookings.filter((booking) => {
      if (booking.id?.toString().includes(query)) return true;
      if (booking.container_number?.toLowerCase().includes(query)) return true;
      if (booking.user_name?.toLowerCase().includes(query)) return true;
      if (booking.user_email?.toLowerCase().includes(query)) return true;
      if (booking.user_company_name?.toLowerCase().includes(query)) return true;
      if (booking.origin_port?.toLowerCase().includes(query)) return true;
      if (booking.destination_port?.toLowerCase().includes(query)) return true;
      return false;
    });

    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/lsp/bookings/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending bookings');
      }

      const data = await response.json();
      setBookings(data);
      setFilteredBookings(data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      toast.error('Failed to fetch pending bookings', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (booking: any) => {
    setSelectedBooking(booking);
    setApprovalNotes('');
    setApprovalDialogOpen(true);
  };

  const handleReject = (booking: any) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setRejectionDialogOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedBooking) return;
    
    try {
      setProcessing(true);
      const response = await fetch(`/api/lsp/bookings/${selectedBooking.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          approvalNotes: approvalNotes || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve booking');
      }

      toast.success('Booking approved successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      setApprovalDialogOpen(false);
      setSelectedBooking(null);
      setApprovalNotes('');
      fetchPendingBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve booking', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    try {
      setProcessing(true);
      const response = await fetch(`/api/lsp/bookings/${selectedBooking.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject booking');
      }

      toast.success('Booking rejected successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      
      setRejectionDialogOpen(false);
      setSelectedBooking(null);
      setRejectionReason('');
      fetchPendingBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject booking', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const viewPDF = async (filePath: string, title: string) => {
    if (!filePath) {
      toast.error('No document available to view', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    let pdfUrl: string;
    
    // Check if it's a Cloudinary URL
    if (filePath.includes('cloudinary.com') || filePath.includes('res.cloudinary.com')) {
      if (filePath.includes('solve the =') || !filePath.includes('dyxknaok0')) {
        toast.error('Invalid document URL detected. Please check the document.', {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
      
      // Ensure the Cloudinary URL is properly formatted for viewing
      let cleanUrl = filePath.trim();
      
      // Remove trailing slashes or invalid characters
      cleanUrl = cleanUrl.replace(/[.,;:!?)}\]]+$/, '');
      
      // First, ensure the file is publicly accessible
      try {
        setPdfLoading(true);
        const response = await fetch('/api/cloudinary/make-public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ url: cleanUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          // Use the viewable_url or secure_url from response
          pdfUrl = data.viewable_url || data.secure_url || cleanUrl;
          console.log('File made public successfully:', pdfUrl);
          console.log('Response data:', data);
        } else {
          // Even if making public fails, try to use the URL anyway
          const errorData = await response.json().catch(() => ({}));
          console.warn('Failed to make file public:', errorData.error || 'Unknown error');
          pdfUrl = cleanUrl;
        }
      } catch (error) {
        console.error('Error ensuring file is public:', error);
        // Continue with original URL
        pdfUrl = cleanUrl;
      }
    } 
    // Check if it's a local uploads path
    else if (filePath.startsWith('/uploads/')) {
      pdfUrl = `http://localhost:5000${filePath}`;
      setPdfLoading(true);
    }
    // Regular file path - convert to URL
    else {
      const cleanPath = filePath.replace(/\\\\/g, "/").replace(/\\/g, "/");
      pdfUrl = `http://localhost:5000/${cleanPath}`;
      setPdfLoading(true);
    }
    
    console.log('Opening PDF:', pdfUrl);
    setCurrentPdfUrl(pdfUrl);
    setCurrentPdfTitle(title);
    setPdfError(false);
    setPdfViewerOpen(true);
    
    // Clear any existing timeout
    if (pdfLoadingTimeout) {
      clearTimeout(pdfLoadingTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (pdfLoading) {
        console.log('PDF loading timeout');
        setPdfError(true);
        setPdfLoading(false);
        toast.error('PDF loading timed out. Trying alternative viewer...', {
          position: "top-right",
          autoClose: 5000,
        });
        
        // Try Google Docs Viewer as fallback
        if (pdfUrl.includes('cloudinary.com')) {
          const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
          setCurrentPdfUrl(googleViewerUrl);
          setPdfLoading(true);
          setPdfError(false);
        }
      }
    }, 15000);
    
    setPdfLoadingTimeout(timeout);
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdfUrl("");
    setCurrentPdfTitle("");
    setPdfError(false);
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    console.error('PDF load error for URL:', currentPdfUrl);
    
    // Try Google Docs Viewer as fallback for Cloudinary URLs
    if (currentPdfUrl.includes('cloudinary.com')) {
      console.log('Trying Google Docs Viewer as fallback...');
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentPdfUrl)}&embedded=true`;
      setCurrentPdfUrl(googleViewerUrl);
      setPdfLoading(true);
      setPdfError(false);
      return;
    }
    
    setPdfError(true);
    setPdfLoading(false);
    toast.error('Failed to load PDF document. Try opening in a new tab or downloading.', {
      position: "top-right",
      autoClose: 5000,
    });
  };

  const handlePdfLoad = () => {
    setPdfError(false);
    setPdfLoading(false);
  };

  const getDocuments = (booking: any) => {
    const docs: { title: string; path: string }[] = [];
    const seenUrls = new Set<string>(); // To avoid duplicates
    
    // Helper function to extract Cloudinary URLs from text
    const extractCloudinaryUrls = (text: string): string[] => {
      if (!text) return [];
      // Match Cloudinary URLs ending with .pdf
      // Pattern: https://res.cloudinary.com/.../...pdf or https://...cloudinary.com/.../...pdf
      const urlRegex = /https?:\/\/[^\s]*cloudinary\.com\/[^\s]*\.pdf/gi;
      const matches = text.match(urlRegex);
      if (matches) {
        // Clean up URLs - remove trailing punctuation if any
        return matches.map(url => {
          let cleanUrl = url.trim();
          // Remove trailing commas, periods, parentheses, etc.
          cleanUrl = cleanUrl.replace(/[.,;:!?)}\]]+$/, '');
          return cleanUrl;
        });
      }
      return [];
    };
    
    // Helper function to get document title from URL or text context
    const getDocumentTitle = (url: string, context?: string): string => {
      // Try to extract title from context (e.g., "Permit Document: URL")
      if (context) {
        const match = context.match(/([^:]+):\s*https?/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      // Extract from URL path
      if (url.includes('shipping_permit')) return 'Shipping Permit';
      if (url.includes('permit')) return 'Permit Document';
      if (url.includes('shipping')) return 'Shipping Document';
      
      return 'Booking Document';
    };
    
    // 1. Check documents JSONB field
    if (booking.documents) {
      try {
        const docObj = typeof booking.documents === 'string' 
          ? JSON.parse(booking.documents) 
          : booking.documents;
        
        // Handle various document field names
        const documentFields = {
          shipping_permit: 'Shipping Permit',
          permit_document: 'Permit Document',
          shipping_document: 'Shipping Document',
          document: 'Shipping Document',
          permit: 'Shipping Permit',
          shipping_permit_document: 'Shipping Permit Document'
        };
        
        // Extract all document fields
        Object.keys(documentFields).forEach(key => {
          if (docObj[key] && typeof docObj[key] === 'string') {
            const url = docObj[key];
            if (url && !seenUrls.has(url)) {
              docs.push({ title: documentFields[key], path: url });
              seenUrls.add(url);
            }
          }
        });
        
        // Also check if it's an array of documents
        if (Array.isArray(docObj)) {
          docObj.forEach((doc: any, idx: number) => {
            let url = '';
            if (typeof doc === 'string') {
              url = doc;
            } else if (doc.path || doc.url) {
              url = doc.path || doc.url;
            }
            
            if (url && !seenUrls.has(url)) {
              docs.push({ 
                title: (doc.title || doc.name || `Document ${idx + 1}`), 
                path: url 
              });
              seenUrls.add(url);
            }
          });
        }
        
        // Check for nested objects with URLs
        const findUrlsInObject = (obj: any, prefix = '') => {
          Object.keys(obj || {}).forEach(key => {
            const value = obj[key];
            if (typeof value === 'string' && value.includes('cloudinary.com')) {
              if (!seenUrls.has(value)) {
                docs.push({ 
                  title: documentFields[key] || prefix || key || 'Document', 
                  path: value 
                });
                seenUrls.add(value);
              }
            } else if (typeof value === 'object' && value !== null) {
              findUrlsInObject(value, key);
            }
          });
        };
        
        findUrlsInObject(docObj);
      } catch (e) {
        console.error('Error parsing documents JSONB:', e);
      }
    }
    
    // 2. Check notes field for document URLs (common pattern from mobile app)
    // This handles cases where document URLs are stored as plain text in notes
    if (booking.notes) {
      // Extract URLs from entire notes field
      const urls = extractCloudinaryUrls(booking.notes);
      urls.forEach(url => {
        if (!seenUrls.has(url)) {
          const title = getDocumentTitle(url, booking.notes);
          docs.push({ title, path: url });
          seenUrls.add(url);
        }
      });
      
      // Also parse line by line for better context extraction
      const lines = booking.notes.split(/[\n\r]+/);
      lines.forEach(line => {
        const lineUrls = extractCloudinaryUrls(line);
        lineUrls.forEach(url => {
          if (!seenUrls.has(url)) {
            const title = getDocumentTitle(url, line);
            docs.push({ title, path: url });
            seenUrls.add(url);
          }
        });
      });
    }
    
    return docs;
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>Loading pending bookings...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Booking Approval</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Review and approve pending bookings. Traders can proceed with payment after approval.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 300, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by booking ID, container number, customer name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: 14
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: '#eee',
                color: '#666',
                padding: '10px 16px',
                borderRadius: 4,
                border: '1px solid #ddd',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={fetchPendingBookings}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 4,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Refresh
        </button>
      </div>

      {searchQuery && (
        <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
          Showing {filteredBookings.length} of {bookings.length} pending bookings
        </div>
      )}

      {error && (
        <div style={{ 
          padding: 12, 
          background: '#fee', 
          color: '#c33', 
          borderRadius: 4, 
          marginBottom: 16 
        }}>
          {error}
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          background: '#fff', 
          borderRadius: 8, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          color: '#666'
        }}>
          {searchQuery ? 'No bookings found matching your search.' : 'No pending bookings at the moment.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredBookings.map((booking) => {
            const documents = getDocuments(booking);
            
            // Debug logging (remove in production)
            if (booking.notes && booking.notes.includes('cloudinary.com')) {
              console.log('Booking', booking.id, 'has notes with Cloudinary URL:', booking.notes);
              console.log('Extracted documents:', documents);
            }
            
            return (
              <div
                key={booking.id}
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: 24
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                      Booking #{booking.id}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Created: {new Date(booking.booking_date || booking.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span style={{
                    background: '#f59e0b20',
                    color: '#f59e0b',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    PENDING
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Container</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{booking.container_number || 'N/A'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {booking.container_size} {booking.container_type}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Customer</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{booking.user_name || 'N/A'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{booking.user_email || ''}</div>
                    {booking.user_company_name && (
                      <div style={{ fontSize: 12, color: '#888' }}>{booking.user_company_name}</div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Route</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{booking.origin_port || 'N/A'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>→ {booking.destination_port || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Cargo</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{booking.cargo_type || 'General'}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {booking.cargo_weight ? `${booking.cargo_weight} kg` : ''} 
                      {booking.cargo_volume ? ` • ${booking.cargo_volume} m³` : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Total Price</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>
                      {booking.total_price 
                        ? `${new Intl.NumberFormat('en-IN').format(booking.total_price)} ${booking.currency || 'INR'}`
                        : 'N/A'}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {booking.booked_units ? `${booking.booked_units} unit(s)` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600 }}>
                    Uploaded Documents
                  </div>
                  {documents.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {documents.map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => viewPDF(doc.path, doc.title)}
                          style={{
                            background: '#e0e7ff',
                            border: '1px solid #818cf8',
                            color: '#4f46e5',
                            padding: '8px 16px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 500
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#c7d2fe';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#e0e7ff';
                          }}
                        >
                          📄 {doc.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      fontSize: 13, 
                      color: '#999', 
                      fontStyle: 'italic',
                      padding: '8px 0'
                    }}>
                      No documents uploaded
                    </div>
                  )}
                </div>

                {booking.notes && (() => {
                  // Remove Cloudinary URLs from notes display (they're shown as documents above)
                  let displayNotes = booking.notes;
                  const cloudinaryUrlRegex = /https?:\/\/[^\s]+cloudinary\.com[^\s]+\.pdf/g;
                  const urls = displayNotes.match(cloudinaryUrlRegex);
                  if (urls && urls.length > 0) {
                    // Remove lines that only contain URLs
                    displayNotes = displayNotes.split('\n')
                      .filter(line => {
                        const lineTrimmed = line.trim();
                        return !lineTrimmed.match(/^https?:\/\/[^\s]+cloudinary\.com[^\s]+\.pdf$/g);
                      })
                      .filter(line => {
                        // Remove lines like "Permit Document: URL" since we show it as a document
                        const urlMatch = line.match(/https?:\/\/[^\s]+cloudinary\.com[^\s]+\.pdf/g);
                        return !urlMatch || line.trim().length > (urlMatch[0].length + 50);
                      })
                      .join('\n')
                      .trim();
                  }
                  
                  // Only show notes if there's meaningful content left
                  return displayNotes && displayNotes.length > 0 ? (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f9f9f9', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 600 }}>Notes</div>
                      <div style={{ fontSize: 14, color: '#333', whiteSpace: 'pre-wrap' }}>{displayNotes}</div>
                    </div>
                  ) : null;
                })()}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: 16 }}>
                  <button
                    onClick={() => handleReject(booking)}
                    style={{
                      background: 'white',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      padding: '10px 20px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(booking)}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Dialog */}
      {approvalDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Approve Booking</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Booking #{selectedBooking?.id} will be approved. Trader can proceed with payment.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Approval Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes for this approval..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setApprovalDialogOpen(false);
                  setSelectedBooking(null);
                  setApprovalNotes('');
                }}
                disabled={processing}
                style={{
                  background: '#eee',
                  color: '#333',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 4,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={processing}
                style={{
                  background: processing ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 4,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {processing ? 'Approving...' : 'Approve Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectionDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Reject Booking</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Booking #{selectedBooking?.id} will be rejected. Please provide a reason.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                required
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ddd',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setRejectionDialogOpen(false);
                  setSelectedBooking(null);
                  setRejectionReason('');
                }}
                disabled={processing}
                style={{
                  background: '#eee',
                  color: '#333',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 4,
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing || !rejectionReason.trim()}
                style={{
                  background: processing || !rejectionReason.trim() ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 4,
                  cursor: processing || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {processing ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: 16,
            background: '#1f2937',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ color: 'white', fontWeight: 600 }}>{currentPdfTitle}</div>
            <button
              onClick={closePdfViewer}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {pdfLoading && !pdfError && (
              <div style={{ color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 16, marginBottom: 12 }}>Loading PDF...</div>
              </div>
            )}
            {pdfError && (
              <div style={{ color: 'white', textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>Failed to load PDF</div>
                <div style={{ fontSize: 14, marginBottom: 24, opacity: 0.9 }}>
                  The PDF could not be displayed. Try one of the options below:
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Open in New Tab
                  </a>
                  <a
                    href={currentPdfUrl}
                    download
                    style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Download PDF
                  </a>
                  <button
                    onClick={() => {
                      // Try Google Docs Viewer
                      if (currentPdfUrl.includes('cloudinary.com') && !currentPdfUrl.includes('docs.google.com')) {
                        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentPdfUrl)}&embedded=true`;
                        setCurrentPdfUrl(googleViewerUrl);
                        setPdfError(false);
                        setPdfLoading(true);
                      } else {
                        setPdfError(false);
                        setPdfLoading(true);
                      }
                    }}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Try Alternative Viewer
                  </button>
                </div>
              </div>
            )}
            {!pdfError && (
              <>
                <iframe
                  src={currentPdfUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: pdfLoading ? 'none' : 'block'
                  }}
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
                  title={currentPdfTitle}
                />
                <div style={{ 
                  position: 'absolute', 
                  top: 80, 
                  right: 20, 
                  display: 'flex', 
                  gap: 8 
                }}>
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Open in New Tab
                  </a>
                  <a
                    href={currentPdfUrl}
                    download
                    style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Download
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

