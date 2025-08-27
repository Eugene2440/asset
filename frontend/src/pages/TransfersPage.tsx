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
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';
import { Transfer } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';

const TransfersPage = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const data = await assetsAPI.getTransfers();
      setTransfers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleRowClick = (transferId: string) => {
    navigate(`/transfers/${transferId}`);
  };

  const handleAccept = async (transferId: string) => {
    try {
      await assetsAPI.updateTransfer(transferId, { status: 'APPROVED' });
      fetchTransfers();
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
      fetchTransfers();
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
        <Typography variant="h4" gutterBottom>
          Asset Transfers
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/assets"
        >
          Initiate Transfer
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="transfers table">
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>From User</TableCell>
              <TableCell>To User</TableCell>
              <TableCell>From Location</TableCell>
              <TableCell>To Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested At</TableCell>
              {user?.role === 'admin' && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow
                key={transfer.id}
                hover
                onClick={() => handleRowClick(transfer.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{transfer.asset?.asset_model}</TableCell>
                <TableCell>{transfer.from_user?.name}</TableCell>
                <TableCell>{transfer.to_user?.name}</TableCell>
                <TableCell>{transfer.from_location?.name}</TableCell>
                <TableCell>{transfer.to_location?.name}</TableCell>
                <TableCell>{transfer.status}</TableCell>
                <TableCell>{new Date(transfer.requested_at).toLocaleString()}</TableCell>
                {user?.role === 'admin' && (
                  <TableCell>
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
                          sx={{ mr: 1 }}
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