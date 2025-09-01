import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';
import { Asset, Transfer } from '../types';
import { Box, CircularProgress, Typography, Paper, Grid, List, ListItem, ListItemText, Divider } from '@mui/material';

const AssetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [assetData, transfersData] = await Promise.all([
          assetsAPI.getAssetById(id),
          assetsAPI.getTransfers({ asset_id: id }),
        ]);
        setAsset(assetData);
        setTransfers(transfersData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch asset details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [id]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!asset) {
    return <Typography>Asset not found</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Asset Details
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">{asset.tag_no}</Typography>
            <Typography color="textSecondary">{asset.asset_type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Typography variant="h6">{asset.status}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Information</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Serial Number" secondary={asset.serial_number} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Model" secondary={asset.model} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Make" secondary={asset.asset_make} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="OS Version" secondary={asset.os_version} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Assignment</Typography>
            <List>
              <ListItem>
                <ListItemText primary="User" secondary={asset.assigned_user?.name || 'N/A'} />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Location" secondary={asset.location?.name || 'N/A'} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Transfer History</Typography>
        <Paper>
          <List>
            {transfers.map((transfer) => (
              <ListItem key={transfer.id}>
                <ListItemText
                  primary={`Status: ${transfer.status}`}
                  secondary={`From: ${transfer.from_location?.name} To: ${transfer.to_location?.name} on ${new Date(transfer.requested_at).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default AssetDetailPage;