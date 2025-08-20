import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';

interface TransferDetails {
  id: string;
  asset: { name: string, serial_number: string };
  from_user: { name: string, email: string };
  to_user: { name: string, email: string };
  from_location: { name: string };
  to_location: { name: string };
  status: string;
  reason: string;
  notes: string;
  requested_at: string;
  approved_at: string;
  completed_at: string;
  requester: { name: string, email: string };
  approver: { name: string, email: string };
}

const TransferDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransferDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // This needs to be implemented in services/api.ts
        const data = await assetsAPI.getTransferById(id);
        setTransfer(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch transfer details');
      } finally {
        setLoading(false);
      }
    };

    fetchTransferDetails();
  }, [id]);

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

  if (!transfer) {
    return <Typography variant="h6">Transfer not found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transfer Details
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">Asset</Typography>
            <Typography>{transfer.asset?.name} ({transfer.asset?.serial_number})</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">Status</Typography>
            <Typography>{transfer.status}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">From</Typography>
            <Typography>User: {transfer.from_user?.name}</Typography>
            <Typography>Location: {transfer.from_location?.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">To</Typography>
            <Typography>User: {transfer.to_user?.name}</Typography>
            <Typography>Location: {transfer.to_location?.name}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Details</Typography>
            <Typography>Reason: {transfer.reason}</Typography>
            <Typography>Notes: {transfer.notes}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">Requested</Typography>
            <Typography>By: {transfer.requester?.name}</Typography>
            <Typography>At: {new Date(transfer.requested_at).toLocaleString()}</Typography>
          </Grid>
          {transfer.approver && (
            <Grid item xs={12} sm={4}>
              <Typography variant="h6">Approved</Typography>
              <Typography>By: {transfer.approver?.name}</Typography>
              <Typography>At: {new Date(transfer.approved_at).toLocaleString()}</Typography>
            </Grid>
          )}
          {transfer.completed_at && (
            <Grid item xs={12} sm={4}>
              <Typography variant="h6">Completed</Typography>
              <Typography>At: {new Date(transfer.completed_at).toLocaleString()}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default TransferDetailsPage;
