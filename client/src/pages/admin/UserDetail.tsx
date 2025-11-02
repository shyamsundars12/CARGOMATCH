import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack,
  Download,
  Person,
  Business,
  LocationOn,
  Phone,
  Email,
  Description,
  CheckCircle,
  Cancel,
  Visibility,
  CloudUpload,
} from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trader, setTrader] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [currentPdfTitle, setCurrentPdfTitle] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoadingTimeout, setPdfLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    // Validate trader ID before making API call
    if (!id || id === 'undefined' || id === 'null') {
      setError('Invalid trader ID provided');
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);
    fetch(`/api/admin/traders/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 400) {
            throw new Error("Invalid trader ID format");
          } else if (res.status === 404) {
            throw new Error("Trader not found");
          } else {
            throw new Error("Failed to fetch trader details");
          }
        }
        return res.json();
      })
      .then((data) => setTrader(data))
      .catch((err) => {
        console.error('Error fetching trader:', err);
        setError(err.message || "Failed to load trader details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Update approval status API call
  const updateApprovalStatus = async (approved: boolean) => {
    if (!trader || !id || id === 'undefined' || id === 'null') {
      setError('Invalid trader ID for update');
      return;
    }

    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}/${approved ? 'approve' : 'reject'}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: approved ? undefined : JSON.stringify({ rejectionReason: 'Rejected by admin' }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update approval status");
      }
      
      // Refresh trader data after successful approval/rejection
      const refreshRes = await fetch(`/api/admin/traders/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (refreshRes.ok) {
        const updatedTrader = await refreshRes.json();
        setTrader(updatedTrader);
      }
      
      toast.success(`Trader ${approved ? 'approved' : 'rejected'} successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error('Error updating approval status:', err);
      setError(err.message || "Failed to update approval status");
      toast.error(err.message || "Failed to update approval status", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // View PDF in modal
  const viewPDF = (filePath: string, title: string) => {
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
      // Validate Cloudinary URL format
      if (filePath.includes('solve the =') || !filePath.includes('dyxknaok0')) {
        toast.error('Invalid document URL detected. Please re-upload the document.', {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
      pdfUrl = filePath; // Use Cloudinary URL directly
    }
    // Check if it's a mobile file path
    else if (filePath.includes('/data/user/0/com.example.cargomatch/')) {
      // Extract user ID and document type from the path
      const userId = id; // Use current trader ID
      const docType = title.toLowerCase().replace(' document', '').replace(' ', '-');
      pdfUrl = `/api/files/mobile-files/${userId}/${docType}`;
    } 
    // Check if it's a local uploads path
    else if (filePath.startsWith('/uploads/')) {
      pdfUrl = `http://localhost:5000${filePath}`;
    }
    // Regular file path - convert to URL
    else {
      const cleanPath = filePath.replace(/\\\\/g, "/").replace(/\\/g, "/");
      pdfUrl = `http://localhost:5000/${cleanPath}`;
    }
    
    console.log('PDF URL:', pdfUrl); // Debug log
    setCurrentPdfUrl(pdfUrl);
    setCurrentPdfTitle(title);
    setPdfError(false);
    setPdfLoading(true);
    setPdfViewerOpen(true);
    
    // Set a timeout to detect if PDF fails to load
    const timeout = setTimeout(() => {
      if (!pdfError && pdfLoading) {
        console.log('PDF loading timeout - assuming error');
        setPdfError(true);
        setPdfLoading(false);
        
        // Show timeout error message
        toast.error('PDF loading timed out. The document may be too large or the server is slow.', {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }, 15000); // Increased to 15 seconds for better reliability
    
    setPdfLoadingTimeout(timeout);
  };

  // Close PDF viewer
  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdfUrl("");
    setCurrentPdfTitle("");
    setPdfError(false);
    setPdfLoading(false);
    
    // Clear timeout if exists
    if (pdfLoadingTimeout) {
      clearTimeout(pdfLoadingTimeout);
      setPdfLoadingTimeout(null);
    }
  };

  // Handle PDF load error
  const handlePdfError = () => {
    console.error('PDF failed to load:', currentPdfUrl);
    setPdfError(true);
    setPdfLoading(false);
    
    // Clear timeout
    if (pdfLoadingTimeout) {
      clearTimeout(pdfLoadingTimeout);
      setPdfLoadingTimeout(null);
    }
    
    // Show specific error message based on URL type
    if (currentPdfUrl.includes('cloudinary.com')) {
      toast.error('PDF document not found in cloud storage. Please re-upload the document.', {
        position: "top-right",
        autoClose: 5000,
      });
    } else {
      toast.error('Failed to load PDF document. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle PDF load success
  const handlePdfLoad = () => {
    setPdfError(false);
    setPdfLoading(false);
    
    // Clear timeout
    if (pdfLoadingTimeout) {
      clearTimeout(pdfLoadingTimeout);
      setPdfLoadingTimeout(null);
    }
  };

  // Retry PDF loading
  const retryPdfLoad = () => {
    setPdfError(false);
    setPdfLoading(true);
    // Force iframe reload by updating the URL slightly
    const separator = currentPdfUrl.includes('?') ? '&' : '?';
    const newUrl = `${currentPdfUrl}${separator}t=${Date.now()}`;
    setCurrentPdfUrl(newUrl);
    
    // Set a new timeout
    const timeout = setTimeout(() => {
      console.log('PDF retry timeout - assuming error');
      setPdfError(true);
      setPdfLoading(false);
      
      toast.error('PDF retry timed out. Please try a different viewing option.', {
        position: "top-right",
        autoClose: 5000,
      });
    }, 15000); // Match the main timeout
    
    setPdfLoadingTimeout(timeout);
  };

  // Open PDF in new tab
  const openPdfInNewTab = () => {
    window.open(currentPdfUrl, '_blank');
  };

  // Open PDF with Google Docs Viewer
  const openWithGoogleViewer = () => {
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(currentPdfUrl)}&embedded=true`;
    window.open(googleViewerUrl, '_blank');
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`/api/admin/traders/${id}/upload/${selectedDocType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Refresh trader data
      const refreshRes = await fetch(`/api/admin/traders/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      if (refreshRes.ok) {
        const updatedTrader = await refreshRes.json();
        setTrader(updatedTrader);
      }

      setUploadDialogOpen(false);
      setSelectedDocType("");
      
      toast.success('Document uploaded to cloud successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Open upload dialog
  const openUploadDialog = (docType: string) => {
    setSelectedDocType(docType);
    setUploadDialogOpen(true);
  };

  // Download PDF verification document
  const downloadPDF = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/admin/traders/${id}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trader-verification-${id}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          ← Back to Traders
        </Button>
      </Box>
    );
  }

  if (!trader) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Trader not found</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          ← Back to Traders
        </Button>
      </Box>
    );
  }

  // Show Approve/Reject only if still pending
  const showApproveRejectButtons = trader.approval_status === 'pending';

  // Display readable status
  const getStatusLabel = () => {
    if (trader.approval_status === 'pending') return "Pending";
    if (trader.approval_status === 'approved') return "Approved";
    if (trader.approval_status === 'rejected') return "Rejected";
    return "Unknown";
  };

  const getStatusColor = () => {
    if (trader.approval_status === 'pending') return "warning";
    if (trader.approval_status === 'approved') return "success";
    if (trader.approval_status === 'rejected') return "error";
    return "default";
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} color="primary">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Trader Verification Details
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Download Verification PDF">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadPDF}
              color="primary"
            >
              Download PDF
            </Button>
          </Tooltip>
      {showApproveRejectButtons && (
            <>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => updateApprovalStatus(true)}
            disabled={updating}
                color="success"
          >
            Approve
              </Button>
              <Button
                variant="contained"
                startIcon={<Cancel />}
                onClick={() => updateApprovalStatus(false)}
            disabled={updating}
                color="error"
          >
            Reject
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Verification Status</Typography>
            <Chip 
              label={getStatusLabel()} 
              color={getStatusColor() as any} 
              size="large"
            />
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Trader ID: {trader.id} | Registered: {new Date(trader.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="primary" />
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Full Name</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {trader.first_name} {trader.last_name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">Email Address</Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    {trader.email}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    {trader.phone_number || 'Not provided'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                Company Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Business Name</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {trader.company_name || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">GST Number</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {trader.gst_number || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">PAN Number</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {trader.pan_number || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">IEC Number</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {trader.iec_number || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="textSecondary">Company Registration</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {trader.company_registration || 'Not provided'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Complete Address</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {trader.address || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">City</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {trader.city || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">State</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {trader.state || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Pincode</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {trader.pincode || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Country</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {trader.country || 'India'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Verification */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                Document Verification
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">PAN Document</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {trader.pan_document_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {trader.pan_document_path && (
                        <Tooltip title="View Document">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => viewPDF(trader.pan_document_path, 'PAN Document')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Upload Document">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => openUploadDialog('pan')}
                        >
                          <CloudUpload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {trader.pan_document_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {trader.pan_document_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">GST Document</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {trader.gst_document_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {trader.gst_document_path && (
                        <Tooltip title="View Document">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => viewPDF(trader.gst_document_path, 'GST Document')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Upload Document">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => openUploadDialog('gst')}
                        >
                          <CloudUpload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {trader.gst_document_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {trader.gst_document_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">IEC Document</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {trader.iec_document_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {trader.iec_document_path && (
                        <Tooltip title="View Document">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => viewPDF(trader.iec_document_path, 'IEC Document')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Upload Document">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => openUploadDialog('iec')}
                        >
                          <CloudUpload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {trader.iec_document_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {trader.iec_document_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Company Registration Document</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {trader.company_registration_document_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {trader.company_registration_document_path && (
                        <Tooltip title="View Document">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => viewPDF(trader.company_registration_document_path, 'Company Registration Document')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Upload Document">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => openUploadDialog('company-registration')}
                        >
                          <CloudUpload fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {trader.company_registration_document_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {trader.company_registration_document_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PDF Viewer Modal */}
      <Dialog 
        open={pdfViewerOpen} 
        onClose={closePdfViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {currentPdfTitle}
          <Box>
            <Tooltip title="Download PDF">
              <IconButton 
                color="primary"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = currentPdfUrl;
                  a.download = `${currentPdfTitle}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <IconButton onClick={closePdfViewer}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {pdfLoading && !pdfError ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '70vh',
              p: 4
            }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Loading PDF Document...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Please wait while the document loads
              </Typography>
            </Box>
          ) : pdfError ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '70vh',
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="h6" color="error" gutterBottom>
                Failed to load PDF document
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                The document could not be displayed in the viewer.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={retryPdfLoad}
                  startIcon={<Visibility />}
                >
                  Retry
                </Button>
                <Button 
                  variant="contained" 
                  onClick={openPdfInNewTab}
                  startIcon={<Download />}
                >
                  Open in New Tab
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={openWithGoogleViewer}
                  startIcon={<Visibility />}
                >
                  Google Viewer
                </Button>
                {currentPdfUrl.includes('cloudinary.com') && (
                  <Button 
                    variant="contained" 
                    color="warning"
                    onClick={() => {
                      const docType = currentPdfTitle.toLowerCase().replace(' document', '').replace(' ', '-');
                      openUploadDialog(docType);
                      setPdfViewerOpen(false);
                    }}
                    startIcon={<CloudUpload />}
                  >
                    Re-upload Document
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
                PDF URL: {currentPdfUrl}
              </Typography>
            </Box>
          ) : (
            currentPdfUrl ? (
              <iframe
                src={currentPdfUrl}
                width="100%"
                height="100%"
                style={{ border: 'none', minHeight: '70vh' }}
                title={currentPdfTitle}
                onError={handlePdfError}
                onLoad={handlePdfLoad}
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '70vh',
                p: 4,
                textAlign: 'center'
              }}>
                <Typography variant="h6" color="error" gutterBottom>
                  No PDF URL available
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Please try uploading the document again.
                </Typography>
              </Box>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload {selectedDocType.toUpperCase()} Document
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                disabled={uploading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose PDF File
              </Button>
            </label>
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Uploading to cloud storage...
                </Typography>
                <LinearProgress />
              </Box>
            )}
            <Typography variant="caption" color="textSecondary" display="block">
              Only PDF files are allowed. Maximum file size: 10MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Box>
  );
}