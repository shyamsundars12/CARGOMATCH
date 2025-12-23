import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");
  
  // PDF viewer states
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [currentPdfTitle, setCurrentPdfTitle] = useState('');
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch booking details');
        }
        return res.json();
      })
      .then(setBooking)
      .catch((err) => setError(err.message || "Failed to fetch booking details"));
  }, [id]);

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'confirmed': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'closed': return '#6b7280';
      case 'cancelled': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return {
      background: `${color}20`,
      color: color,
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      display: 'inline-block'
    };
  };

  // Extract documents from booking
  const getDocuments = (booking: any) => {
    const docs: { title: string; path: string }[] = [];
    const seenUrls = new Set<string>();
    
    const extractCloudinaryUrls = (text: string): string[] => {
      if (!text) return [];
      const urlRegex = /https?:\/\/[^\s]*cloudinary\.com\/[^\s]*\.pdf/gi;
      const matches = text.match(urlRegex);
      return matches ? matches.map(url => url.trim().replace(/[.,;:!?)}\]]+$/, '')) : [];
    };
    
    const getDocumentTitle = (url: string, context?: string): string => {
      if (context) {
        const match = context.match(/([^:]+):\s*https?/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      if (url.includes('shipping_permit')) return 'Shipping Permit';
      if (url.includes('permit')) return 'Permit Document';
      if (url.includes('shipping')) return 'Shipping Document';
      return 'Booking Document';
    };
    
    // Check documents JSONB field
    if (booking.documents) {
      try {
        const docObj = typeof booking.documents === 'string' 
          ? JSON.parse(booking.documents) 
          : booking.documents;
        
        Object.keys(docObj || {}).forEach(key => {
          const value = docObj[key];
          if (typeof value === 'string' && value.includes('cloudinary.com') && !seenUrls.has(value)) {
            docs.push({ title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), path: value });
            seenUrls.add(value);
          }
        });
      } catch (e) {
        console.error('Error parsing documents JSONB:', e);
      }
    }
    
    // Check notes field
    if (booking.notes) {
      const urls = extractCloudinaryUrls(booking.notes);
      urls.forEach(url => {
        if (!seenUrls.has(url)) {
          const title = getDocumentTitle(url, booking.notes);
          docs.push({ title, path: url });
          seenUrls.add(url);
        }
      });
    }
    
    return docs;
  };

  const viewPDF = async (filePath: string, title: string) => {
    if (!filePath) {
      toast.error('No document available to view', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    let pdfUrl: string = filePath.trim().replace(/[.,;:!?)}\]]+$/, '');
    
    // Ensure Cloudinary files are public
    if (pdfUrl.includes('cloudinary.com')) {
      try {
        setPdfLoading(true);
        const response = await fetch('/api/cloudinary/make-public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: JSON.stringify({ url: pdfUrl }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Use the viewable_url or secure_url from response
          pdfUrl = data.viewable_url || data.secure_url || pdfUrl;
          console.log('File made public successfully:', pdfUrl);
          console.log('Response data:', data);
        } else {
          // Even if making public fails, try to use the URL anyway
          const errorData = await response.json().catch(() => ({}));
          console.warn('Failed to make file public:', errorData.error || 'Unknown error');
        }
      } catch (error) {
        console.warn('Could not make file public:', error);
      }
    }
    
    setCurrentPdfUrl(pdfUrl);
    setCurrentPdfTitle(title);
    setPdfError(false);
    setPdfViewerOpen(true);
    setPdfLoading(true);
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdfUrl("");
    setCurrentPdfTitle("");
    setPdfError(false);
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    setPdfError(true);
    setPdfLoading(false);
    if (currentPdfUrl.includes('cloudinary.com')) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentPdfUrl)}&embedded=true`;
      setCurrentPdfUrl(googleViewerUrl);
      setPdfLoading(true);
      setPdfError(false);
    } else {
      toast.error('Failed to load PDF. Try opening in a new tab.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handlePdfLoad = () => {
    setPdfError(false);
    setPdfLoading(false);
  };

  if (error) return (
    <div style={{ padding: 32 }}>
      <div style={{ color: 'red', padding: 12, background: '#fee', borderRadius: 4, marginBottom: 16 }}>{error}</div>
      <button 
        style={{ 
          background: '#eee', 
          color: '#222', 
          padding: '12px 24px', 
          borderRadius: 4, 
          fontWeight: 600, 
          border: 'none', 
          cursor: 'pointer'
        }} 
        onClick={() => navigate('/admin/bookings')}
      >
        Back to Bookings
      </button>
    </div>
  );
  
  if (!booking) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Booking Detail</h1>
      
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Booking ID</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>#{booking.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Status</div>
            <span style={getStatusBadge(booking.status || 'pending')}>
              {(booking.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Container Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Container Number</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.container_number || booking.container_id || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Container Type</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {booking.container_size || ''} {booking.container_type || ''} {booking.container_size && booking.container_type ? '' : 'N/A'}
              </div>
            </div>
            {booking.origin_port && booking.destination_port && (
              <>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Origin Port</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.origin_port}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Destination Port</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.destination_port}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>LSP Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>LSP Company</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.lsp_company_name || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Customer Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Customer Name</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_email || 'N/A'}</div>
            </div>
            {booking.user_company_name && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Company</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_company_name}</div>
              </div>
            )}
            {booking.user_phone && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Phone</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.user_phone}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Cargo Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Cargo Type</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.cargo_type || 'General'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Weight</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.cargo_weight ? `${booking.cargo_weight} kg` : booking.weight ? `${booking.weight} kg` : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Volume</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.cargo_volume ? `${booking.cargo_volume} m³` : booking.volume ? `${booking.volume} m³` : 'N/A'}</div>
            </div>
            {booking.booked_units && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Booked Units</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.booked_units}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, color: '#333' }}>Booking Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Booking Date</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
            {booking.total_price && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Total Price</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: booking.currency || 'INR',
                  }).format(booking.total_price)}
                </div>
              </div>
            )}
            {booking.payment_status && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Payment Status</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{booking.payment_status.toUpperCase()}</div>
              </div>
            )}
            {booking.tracking_number && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Tracking Number</div>
                <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{booking.tracking_number}</div>
              </div>
            )}
            {booking.departure_date && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Departure Date</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {new Date(booking.departure_date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
            {booking.arrival_date && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Arrival Date</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {new Date(booking.arrival_date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>
          {(() => {
            const documents = getDocuments(booking);
            const displayNotes = booking.notes ? booking.notes.split('\n')
              .filter(line => !line.match(/https?:\/\/[^\s]+cloudinary\.com[^\s]+\.pdf/gi))
              .filter(line => line.trim())
              .join('\n') : '';
            
            return (
              <>
                {documents.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 8, fontWeight: 600 }}>Uploaded Documents</div>
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
                        >
                          📄 {doc.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {displayNotes && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: '14px', padding: 12, background: '#f9f9f9', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                      {displayNotes}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

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
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
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
                </div>
              </div>
            )}
            {!pdfError && (
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
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          style={{ 
            background: '#eee', 
            color: '#222', 
            padding: '12px 24px', 
            borderRadius: 4, 
            fontWeight: 600, 
            border: 'none', 
            cursor: 'pointer'
          }} 
          onClick={() => navigate('/admin/bookings')}
        >
          Back to Bookings
        </button>
      </div>
    </div>
  );
}
