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
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  SwapHoriz as TransferIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';
import { Transfer } from '../types';

const DetailItem = ({ title, value, icon }: { title: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      {icon}
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Typography>
    </Stack>
    <Typography variant="body1" component="div" sx={{ fontWeight: 500, color: 'text.primary' }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return 'success';
    case 'PENDING': return 'warning';
    case 'REJECTED': return 'error';
    case 'COMPLETED': return 'info';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return <CheckIcon />;
    case 'PENDING': return <PendingIcon />;
    case 'REJECTED': return <CancelIcon />;
    case 'COMPLETED': return <CheckIcon />;
    default: return <ScheduleIcon />;
  }
};

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
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
          <TransferIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Transfer Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Asset Transfer Request #{transfer.id?.slice(-8)}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            icon={getStatusIcon(transfer.status)}
            label={transfer.status}
            color={getStatusColor(transfer.status) as any}
            variant="filled"
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          />
        </Box>
      </Box>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ComputerIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Asset Information
                </Typography>
              </Stack>
              <Grid container spacing={3}>
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

          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TransferIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Transfer Details
                </Typography>
              </Stack>
              <Grid container spacing={4}>
                <Grid xs={12} sm={6}>
                  <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                      From
                    </Typography>
                    <DetailItem title="User" value={transfer.from_user?.name} icon={<PersonIcon fontSize="small" />} />
                    <DetailItem title="Location" value={transfer.from_location?.name} icon={<LocationIcon fontSize="small" />} />
                  </Paper>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                      To
                    </Typography>
                    <DetailItem title="User" value={transfer.to_user?.name} icon={<PersonIcon fontSize="small" />} />
                    <DetailItem title="Location" value={transfer.to_location?.name} icon={<LocationIcon fontSize="small" />} />
                  </Paper>
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <DetailItem title="Reason for Transfer" value={transfer.reason} />
              {transfer.notes && <DetailItem title="Notes" value={transfer.notes} />}
              {transfer.status === 'REJECTED' && (
                <DetailItem title="Rejection Reason" value={transfer.rejection_reason} />
              )}
            </CardContent>
          </Card>
          </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3, position: 'sticky', top: 20 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <ScheduleIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Status & Timeline
                </Typography>
              </Stack>
              
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={getStatusIcon(transfer.status)}
                  label={transfer.status}
                  color={getStatusColor(transfer.status) as any}
                  variant="filled"
                  sx={{ fontWeight: 600, fontSize: '0.875rem', width: '100%', height: 40 }}
                />
              </Box>

              <Stack spacing={3}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                    Requested
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>By: {transfer.requester?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {transfer.requested_at ? new Date(transfer.requested_at).toLocaleString() : 'N/A'}
                  </Typography>
                </Paper>

                {transfer.approver && (
                  <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main', mb: 1 }}>
                      Approved
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>By: {transfer.approver?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {transfer.approved_at ? new Date(transfer.approved_at).toLocaleString() : 'N/A'}
                    </Typography>
                  </Paper>
                )}

                {transfer.completed_at && (
                  <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main', mb: 1 }}>
                      Completed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(transfer.completed_at).toLocaleString()}
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransferDetailsPage;
