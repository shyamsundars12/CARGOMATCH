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
import { getFileUrl } from "../../config/api";

export default function AdminLSPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lsp, setLSP] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [currentPdfTitle, setCurrentPdfTitle] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoadingTimeout, setPdfLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    // Validate LSP ID before making API call
    if (!id || id === 'undefined' || id === 'null') {
      setError('Invalid LSP ID provided');
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);
    fetch(`/api/admin/lsps/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 400) {
            throw new Error("Invalid LSP ID format");
          } else if (res.status === 404) {
            throw new Error("LSP not found");
          } else {
            throw new Error("Failed to fetch LSP details");
          }
        }
        return res.json();
      })
      .then((data) => setLSP(data))
      .catch((err) => {
        console.error('Error fetching LSP:', err);
        setError(err.message || "Failed to load LSP details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Approve LSP
  const handleApprove = async () => {
    if (!lsp || !id) return;

    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/lsps/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to approve LSP");
      }

      const updatedData = await res.json();
      setLSP(updatedData.lsp);

      toast.success("LSP approved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error('Error approving LSP:', err);
      setError(err.message || "Failed to approve LSP");
      toast.error(err.message || "Failed to approve LSP", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Reject LSP
  const handleReject = async () => {
    if (!lsp || !id || !rejectionReason.trim()) return;

    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/lsps/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reject LSP");
      }

      const updatedData = await res.json();
      setLSP(updatedData.lsp);
      setRejectionDialogOpen(false);
      setRejectionReason("");

      toast.success("LSP rejected successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      console.error('Error rejecting LSP:', err);
      setError(err.message || "Failed to reject LSP");
      toast.error(err.message || "Failed to reject LSP", {
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

    // Use the centralized file URL helper
    if (filePath.includes('cloudinary.com')) {
      pdfUrl = filePath;
    } else {
      pdfUrl = getFileUrl(filePath);
    }

    console.log('PDF URL:', pdfUrl);
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
      }
    }, 15000);

    setPdfLoadingTimeout(timeout);
  };

  // Close PDF viewer
  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdfUrl("");
    setCurrentPdfTitle("");
    setPdfError(false);
    setPdfLoading(false);

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

    if (pdfLoadingTimeout) {
      clearTimeout(pdfLoadingTimeout);
      setPdfLoadingTimeout(null);
    }

    if (currentPdfUrl.includes('cloudinary.com')) {
      toast.error('PDF document not found in cloud storage. Please re-upload the document.', {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  // Handle PDF load success
  const handlePdfLoad = () => {
    setPdfError(false);
    setPdfLoading(false);

    if (pdfLoadingTimeout) {
      clearTimeout(pdfLoadingTimeout);
      setPdfLoadingTimeout(null);
    }
  };

  // Retry PDF loading
  const retryPdfLoad = () => {
    setPdfError(false);
    setPdfLoading(true);
    const separator = currentPdfUrl.includes('?') ? '&' : '?';
    const newUrl = `${currentPdfUrl}${separator}t=${Date.now()}`;
    setCurrentPdfUrl(newUrl);

    const timeout = setTimeout(() => {
      console.log('PDF retry timeout - assuming error');
      setPdfError(true);
      setPdfLoading(false);
    }, 15000);

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

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pending':
        return { label: "Pending", color: "warning" };
      case 'approved':
        return { label: "Approved", color: "success" };
      case 'rejected':
        return { label: "Rejected", color: "error" };
      default:
        return { label: "Unknown", color: "default" };
    }
  };

  const approvalStatus = getStatusLabel(lsp?.approval_status);
  const verificationStatus = getStatusLabel(lsp?.lsp_verification_status || lsp?.verification_status);
  const showActionButtons = (lsp?.approval_status === 'pending' || lsp?.lsp_verification_status === 'pending');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Back to LSPs</Button>
      </Box>
    );
  }

  if (!lsp) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">LSP not found</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Back to LSPs</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Back to LSPs
        </Button>
        {showActionButtons && (
          <Box>
            <Button
              startIcon={<CheckCircle />}
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={updating}
              sx={{ mr: 1 }}
            >
              Approve
            </Button>
            <Button
              startIcon={<Cancel />}
              variant="contained"
              color="error"
              onClick={() => setRejectionDialogOpen(true)}
              disabled={updating}
            >
              Reject
            </Button>
          </Box>
        )}
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        LSP Verification Details
      </Typography>

      <Grid container spacing={3}>
        {/* Verification Status Card */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" component="div">
                  Verification Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label={`Approval: ${approvalStatus.label}`} color={approvalStatus.color as any} size="medium" />
                  <Chip label={`Verification: ${verificationStatus.label}`} color={verificationStatus.color as any} size="medium" />
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                <strong>LSP Profile ID:</strong> {lsp.lsp_profile_id || lsp.id}
              </Typography>
              <Typography variant="body1">
                <strong>User ID:</strong> {lsp.id}
              </Typography>
              <Typography variant="body1">
                <strong>Registered:</strong> {lsp.created_at ? new Date(lsp.created_at).toLocaleDateString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                Contact Person
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                <strong>Name:</strong> {lsp.name || `${lsp.first_name || ''} ${lsp.last_name || ''}`.trim() || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {lsp.email || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Phone:</strong> {lsp.phone_number || lsp.phone || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business color="primary" />
                Company Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                <strong>Company Name:</strong> {lsp.company_name || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>PAN Number:</strong> {lsp.pan_number || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>GST Number:</strong> {lsp.gst_number || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Company Registration:</strong> {lsp.company_registration || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Business License:</strong> {lsp.business_license || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Insurance Certificate:</strong> {lsp.insurance_certificate || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOn color="primary" />
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                <strong>Address:</strong> {lsp.address || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Verification Card */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description color="primary" />
                Document Verification
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">GST Certificate</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {lsp.gst_certificate_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {lsp.gst_certificate_path && (
                        <Tooltip title="View Document">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => viewPDF(lsp.gst_certificate_path, 'GST Certificate')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {lsp.gst_certificate_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {lsp.gst_certificate_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Company Registration</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {lsp.company_registration_doc_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {lsp.company_registration_doc_path && (
                        <Tooltip title="View Document">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => viewPDF(lsp.company_registration_doc_path, 'Company Registration')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {lsp.company_registration_doc_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {lsp.company_registration_doc_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Business License</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {lsp.business_license_doc_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {lsp.business_license_doc_path && (
                        <Tooltip title="View Document">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => viewPDF(lsp.business_license_doc_path, 'Business License')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {lsp.business_license_doc_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {lsp.business_license_doc_path}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Insurance Certificate</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {lsp.insurance_certificate_doc_path ? '✅ Uploaded' : '❌ Not uploaded'}
                      </Typography>
                      {lsp.insurance_certificate_doc_path && (
                        <Tooltip title="View Document">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => viewPDF(lsp.insurance_certificate_doc_path, 'Insurance Certificate')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {lsp.insurance_certificate_doc_path && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {lsp.insurance_certificate_doc_path}
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
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mt: 3 }}>
                <Button variant="outlined" onClick={retryPdfLoad} startIcon={<Visibility />}>
                  Retry
                </Button>
                <Button variant="contained" onClick={openPdfInNewTab} startIcon={<Download />}>
                  Open in New Tab
                </Button>
                <Button variant="contained" color="secondary" onClick={openWithGoogleViewer} startIcon={<Visibility />}>
                  Google Viewer
                </Button>
              </Box>
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
                p: 4
              }}>
                <Typography variant="h6" color="error">No PDF URL available</Typography>
              </Box>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject LSP</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Company: {lsp.company_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Contact: {lsp.name || lsp.email}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejection:
          </Typography>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={updating || !rejectionReason.trim()}
            startIcon={updating ? <CircularProgress size={20} /> : <Cancel />}
          >
            {updating ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Box>
  );
}
