import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';
import { Transfer } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';

const TransfersPage = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FFD700'; // yellowish-orange
      case 'APPROVED':
      case 'ACCEPTED':
        return '#228B22'; // green
      case 'REJECTED':
        return '#FF4500'; // red
      default:
        return '#000000'; // default black
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const data = await assetsAPI.getTransfers();
      setTransfers(data);
      setFilteredTransfers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  // Filter transfers based on status
  const filterTransfers = (statusFilter: string, transfersList: Transfer[]) => {
    if (statusFilter === 'All') {
      return transfersList;
    }
    return transfersList.filter(transfer => 
      transfer.status?.toUpperCase() === statusFilter.toUpperCase()
    );
  };

  // Handle status filter change
  const handleStatusFilterChange = (event: any) => {
    const newStatusFilter = event.target.value;
    setStatusFilter(newStatusFilter);
    setFilteredTransfers(filterTransfers(newStatusFilter, transfers));
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Update filtered transfers when transfers or status filter changes
  useEffect(() => {
    setFilteredTransfers(filterTransfers(statusFilter, transfers));
  }, [transfers, statusFilter]);

  const handleRowClick = (transferId: string) => {
    navigate(`/transfers/${transferId}`);
  };

  const handleAccept = async (transferId: string) => {
    try {
      await assetsAPI.updateTransfer(transferId, { status: 'APPROVED' });
      await fetchTransfers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept transfer');
    }
  };

  const handleReject = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedTransfer) return;
    try {
      await assetsAPI.updateTransfer(selectedTransfer.id, {
        status: 'REJECTED',
        rejection_reason: rejectionReason,
      });
      setOpen(false);
      setRejectionReason('');
      await fetchTransfers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject transfer');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          Asset Transfers
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
              sx={{ 
                fontSize: '0.75rem',
                height: '32px'
              }}
            >
              <MenuItem value="All" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
              <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: '0.75rem' }}>Accepted</MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            component={RouterLink}
            to="/assets"
            size="small"
            sx={{ 
              fontSize: '0.75rem', 
              padding: '4px 12px',
              minWidth: 'auto',
              height: '32px'
            }}
          >
            Initiate Transfer
          </Button>
        </Box>
      </Box>
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="transfers table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>Asset</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>From User</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>To User</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>From Location</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>To Location</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>Requested At</TableCell>
              {user?.role === 'admin' && <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '8px 8px', whiteSpace: 'nowrap' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransfers.map((transfer) => (
              <TableRow
                key={transfer.id}
                hover
                onClick={() => handleRowClick(transfer.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px 8px', whiteSpace: 'nowrap' }}>{transfer.asset?.asset_model}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px 8px', whiteSpace: 'nowrap' }}>{transfer.from_user?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px 8px', whiteSpace: 'nowrap' }}>{transfer.to_user?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px 8px', whiteSpace: 'nowrap' }}>{transfer.from_location?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px 8px', whiteSpace: 'nowrap' }}>{transfer.to_location?.name}</TableCell>
                <TableCell sx={{ 
                  fontSize: '0.75rem', 
                  padding: '8px 8px', 
                  whiteSpace: 'nowrap',
                  color: getStatusColor(transfer.status || ''),
                  fontWeight: 'bold'
                }}>{transfer.status}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px 8px', whiteSpace: 'nowrap' }}>{transfer.requested_at ? new Date(transfer.requested_at).toLocaleString() : 'N/A'}</TableCell>
                {user?.role === 'admin' && (
                  <TableCell sx={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>
                    {transfer.status === 'PENDING' && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(transfer.id);
                          }}
                          sx={{ mr: 1, fontSize: '0.65rem' }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(transfer);
                          }}
                          sx={{ fontSize: '0.65rem' }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Reject Transfer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this transfer request.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Rejection Reason"
            type="text"
            fullWidth
            variant="standard"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleRejectSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransfersPage;