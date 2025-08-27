import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Asset, Transfer, User as UserType, Location } from '../../types/index.ts';
import { assetsAPI, usersAPI, locationsAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

export default function UserDashboard() {
  const { user } = useAuth();
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userTransfers, setUserTransfers] = useState<Transfer[]>([]);
  const [newTransfer, setNewTransfer] = useState({
    asset_id: '',
    reason: '',
    notes: '',
    to_user_id: '',
    to_location_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTransfer({
      ...newTransfer,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormSuccess(false);

    try {
      const payload = {
        asset_id: parseInt(newTransfer.asset_id),
        reason: newTransfer.reason,
        notes: newTransfer.notes || undefined,
        to_user_id: newTransfer.to_user_id ? parseInt(newTransfer.to_user_id) : undefined,
        to_location_id: newTransfer.to_location_id ? parseInt(newTransfer.to_location_id) : undefined,
      };
      await assetsAPI.createTransfer(payload);
      setFormSuccess(true);
      setNewTransfer({
        asset_id: '',
        reason: '',
        notes: '',
        to_user_id: '',
        to_location_id: '',
      });
      if (user) {
        const transfersData = await assetsAPI.getTransfers({ userId: user.id });
        setUserTransfers(transfersData);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserSpecificData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const assetsData = await assetsAPI.getAssets({ assigned_user_id: user.id });
        setUserAssets(assetsData.assets);

        const usersData = await usersAPI.getUsers();
        setUsers(usersData);
        const locationsData = await locationsAPI.getLocations();
        setLocations(locationsData);

        const transfersData = await assetsAPI.getTransfers({ userId: user.id });
        setUserTransfers(transfersData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSpecificData();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.full_name}
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Asset Transfers
        </Typography>
        <Box component="form" onSubmit={handleTransferSubmit} sx={{ mt: 2, mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">Request New Asset Transfer</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {formSuccess && <Alert severity="success">Transfer request submitted successfully!</Alert>}
          <TextField
            select
            label="Asset"
            name="asset_id"
            value={newTransfer.asset_id}
            onChange={handleTransferChange}
            fullWidth
            required
          >
            {userAssets.map((asset) => (
              <MenuItem key={asset.id} value={asset.id}>
                {asset.name} ({asset.asset_tag})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Reason"
            name="reason"
            value={newTransfer.reason}
            onChange={handleTransferChange}
            fullWidth
            required
          />
          <TextField
            label="Notes (Optional)"
            name="notes"
            value={newTransfer.notes}
            onChange={handleTransferChange}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            select
            label="Transfer To User (Optional)"
            name="to_user_id"
            value={newTransfer.to_user_id}
            onChange={handleTransferChange}
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.full_name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Transfer To Location (Optional)"
            name="to_location_id"
            value={newTransfer.to_location_id}
            onChange={handleTransferChange}
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            Request Transfer
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Your Pending Transfer Requests
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : userTransfers.length === 0 ? (
          <Typography>No transfer requests found.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested At</TableCell>
                  <TableCell>To User</TableCell>
                  <TableCell>To Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{transfer.id}</TableCell>
                    <TableCell>{userAssets.find(a => a.id === transfer.asset_id)?.name || 'N/A'}</TableCell>
                    <TableCell>{transfer.reason}</TableCell>
                    <TableCell>{transfer.status}</TableCell>
                    <TableCell>{new Date(transfer.requested_at).toLocaleDateString()}</TableCell>
                    <TableCell>{users.find(u => u.id === transfer.to_user_id)?.full_name || 'N/A'}</TableCell>
                    <TableCell>{locations.find(loc => loc.id === transfer.to_location_id)?.name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
