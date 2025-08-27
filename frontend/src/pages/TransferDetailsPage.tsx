import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';
import { Transfer } from '../types';

const DetailItem = ({ title, value }: { title: string; value: React.ReactNode }) => (
  <Box mb={2}>
    <Typography variant="caption" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="body1" component="div">{value || 'N/A'}</Typography>
  </Box>
);

const TransferDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransferDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
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
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Asset Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <DetailItem title="Asset Name" value={transfer.asset?.name} />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <DetailItem title="Serial Number" value={transfer.asset?.serial_number} />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <DetailItem title="Asset Model" value={transfer.asset?.asset_model} />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <DetailItem title="Asset Type" value={transfer.asset?.asset_type} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Transfer Details
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="h6">From</Typography>
                    <DetailItem title="User" value={transfer.from_user?.name} />
                    <DetailItem title="Location" value={transfer.from_location?.name} />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="h6">To</Typography>
                    <DetailItem title="User" value={transfer.to_user?.name} />
                    <DetailItem title="Location" value={transfer.to_location?.name} />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <DetailItem title="Reason for Transfer" value={transfer.reason} />
                {transfer.notes && <DetailItem title="Notes" value={transfer.notes} />}
                {transfer.status === 'REJECTED' && (
                  <DetailItem title="Rejection Reason" value={transfer.rejection_reason} />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Status & Timeline
                </Typography>
                <Divider sx={{ my: 2 }} />
                <DetailItem title="Status" value={transfer.status} />
                <DetailItem
                  title="Requested"
                  value={
                    <>
                      <Typography variant="body2">By: {transfer.requester?.name}</Typography>
                      <Typography variant="body2">
                        At: {transfer.requested_at ? new Date(transfer.requested_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </>
                  }
                />
                {transfer.approver && (
                  <DetailItem
                    title="Approved"
                    value={
                      <>
                        <Typography variant="body2">By: {transfer.approver?.name}</Typography>
                        <Typography variant="body2">
                          At: {transfer.approved_at ? new Date(transfer.approved_at).toLocaleString() : 'N/A'}
                        </Typography>
                      </>
                    }
                  />
                )}
                {transfer.completed_at && (
                  <DetailItem
                    title="Completed"
                    value={
                      <Typography variant="body2">
                        At: {new Date(transfer.completed_at).toLocaleString()}
                      </Typography>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TransferDetailsPage;
