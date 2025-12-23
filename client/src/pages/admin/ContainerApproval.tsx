import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Business,
  LocationOn,
  LocalShipping,
  Schedule,
  AttachMoney,
  Description,
  FilterList,
  Refresh,
  Search,
  Clear
} from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ContainerApproval() {
  const navigate = useNavigate();
  
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('pending');
  const [lspFilter, setLspFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContainers, setFilteredContainers] = useState([]);

  useEffect(() => {
    fetchContainers();
  }, [page, rowsPerPage, statusFilter, lspFilter]);

  // Filter containers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContainers(containers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = containers.filter((container) => {
      // Search in container number
      if (container.container_number?.toLowerCase().includes(query)) return true;
      
      // Search in LSP company name
      if (container.lsp_company_name?.toLowerCase().includes(query)) return true;
      
      // Search in LSP name
      if (container.lsp_name?.toLowerCase().includes(query)) return true;
      
      // Search in LSP email
      if (container.lsp_email?.toLowerCase().includes(query)) return true;
      
      // Search in origin port
      if (container.origin_port?.toLowerCase().includes(query)) return true;
      
      // Search in destination port
      if (container.destination_port?.toLowerCase().includes(query)) return true;
      
      // Search in container type
      if (container.type?.toLowerCase().includes(query)) return true;
      if (container.type_name?.toLowerCase().includes(query)) return true;
      
      // Search in container size
      if (container.size?.toLowerCase().includes(query)) return true;
      
      // Search in current location
      if (container.current_location?.toLowerCase().includes(query)) return true;
      
      return false;
    });

    setFilteredContainers(filtered);
  }, [searchQuery, containers]);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = statusFilter === 'pending' 
        ? '/api/admin/containers/pending' 
        : '/api/admin/containers/approved';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch containers');
      }

      const data = await response.json();
      setContainers(data);
      setFilteredContainers(data);
      setTotalCount(data.length);
    } catch (err) {
      console.error('Error fetching containers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedContainer) return;

    try {
      setProcessing(true);
      
      const response = await fetch(`/api/admin/containers/${selectedContainer.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          approvalNotes: approvalNotes || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve container');
      }

      toast.success('Container approved successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      setApprovalDialogOpen(false);
      setSelectedContainer(null);
      setApprovalNotes('');
      fetchContainers();
    } catch (err) {
      console.error('Error approving container:', err);
      toast.error(err.message || 'Failed to approve container', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedContainer || !rejectionReason.trim()) return;

    try {
      setProcessing(true);
      
      const response = await fetch(`/api/admin/containers/${selectedContainer.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject container');
      }

      toast.success('Container rejected successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      setRejectionDialogOpen(false);
      setSelectedContainer(null);
      setRejectionReason('');
      fetchContainers();
    } catch (err) {
      console.error('Error rejecting container:', err);
      toast.error(err.message || 'Failed to reject container', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalDialog = (container) => {
    setSelectedContainer(container);
    setApprovalNotes('');
    setApprovalDialogOpen(true);
  };

  const openRejectionDialog = (container) => {
    setSelectedContainer(container);
    setRejectionReason('');
    setRejectionDialogOpen(true);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'warning' },
      approved: { label: 'Approved', color: 'success' },
      rejected: { label: 'Rejected', color: 'error' }
    };
    
    const config = statusConfig[status] || { label: 'Unknown', color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Container Approval Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0); // Reset to first page when filter changes
                }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<Refresh />}
              onClick={fetchContainers}
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by container number, LSP name, company, ports, type, or size..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0); // Reset to first page when search changes
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchQuery && (
              <IconButton
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setPage(0);
                }}
                edge="end"
              >
                <Clear fontSize="small" />
              </IconButton>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Search Results Info */}
        {searchQuery && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {filteredContainers.length} container(s) matching "{searchQuery}"
              {filteredContainers.length !== containers.length && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(0);
                  }}
                  sx={{ ml: 1 }}
                >
                  Clear Search
                </Button>
              )}
            </Typography>
          </Box>
        )}
      </Box>

      <Card elevation={3}>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Container Details</TableCell>
                  <TableCell>LSP Information</TableCell>
                  <TableCell>Route & Schedule</TableCell>
                  <TableCell>Pricing</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContainers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchQuery ? 'No containers found matching your search.' : 'No containers found.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContainers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((container) => (
                  <TableRow key={container.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {container.container_number}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {container.type_name || container.type} - {container.size}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Capacity: {container.capacity} tons
                        </Typography>
                        {container.length && container.width && container.height && (
                          <Typography variant="body2" color="textSecondary">
                            Dimensions: {container.length}×{container.width}×{container.height}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {container.lsp_company_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {container.lsp_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {container.lsp_email}
                        </Typography>
                        {container.lsp_phone && (
                          <Typography variant="body2" color="textSecondary">
                            {container.lsp_phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {container.origin_port} → {container.destination_port}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Departure: {formatDate(container.departure_date)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Arrival: {formatDate(container.arrival_date)}
                        </Typography>
                        {container.current_location && (
                          <Typography variant="body2" color="textSecondary">
                            Current: {container.current_location}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {formatCurrency(container.price_per_unit, container.currency)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        per unit
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusChip(container.container_approval_status)}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {formatDate(container.created_at)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/containers/${container.id}`)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {container.container_approval_status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => openApprovalDialog(container)}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openRejectionDialog(container)}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredContainers.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog 
        open={approvalDialogOpen} 
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Approve Container
        </DialogTitle>
        <DialogContent>
          {selectedContainer && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Container: {selectedContainer.container_number}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                LSP: {selectedContainer.lsp_company_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Route: {selectedContainer.origin_port} → {selectedContainer.destination_port}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Notes (Optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes about the approval..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="success"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {processing ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={rejectionDialogOpen} 
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reject Container
        </DialogTitle>
        <DialogContent>
          {selectedContainer && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Container: {selectedContainer.container_number}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                LSP: {selectedContainer.lsp_company_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Route: {selectedContainer.origin_port} → {selectedContainer.destination_port}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={processing || !rejectionReason.trim()}
            startIcon={processing ? <CircularProgress size={20} /> : <Cancel />}
          >
            {processing ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Box>
  );
}
