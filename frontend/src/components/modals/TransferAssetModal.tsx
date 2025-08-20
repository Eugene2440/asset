import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { usersAPI, locationsAPI, assetsAPI } from '../../services/api.ts';
import { User, Location, Asset } from '../../types/index.ts';

interface TransferAssetModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onTransferSuccess: () => void;
}

const TransferAssetModal: React.FC<TransferAssetModalProps> = ({ open, onClose, asset, onTransferSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [toUserId, setToUserId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const usersData = await usersAPI.getUsers();
          const locationsData = await locationsAPI.getLocations();
          setUsers(usersData);
          setLocations(locationsData);
        } catch (err) {
          setError('Failed to load users or locations');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!asset) return;

    setError(null);
    setLoading(true);

    try {
      await assetsAPI.createTransfer({
        asset_id: asset.id,
        to_user_id: toUserId || null,
        to_location_id: toLocationId || null,
        reason,
        notes,
      });
      onTransferSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create transfer request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Asset</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {asset && (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6">{asset.name}</Typography>
              <Typography color="textSecondary">Serial: {asset.serial_number}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">Current User</Typography>
                <Typography variant="subtitle1">{asset.assigned_user?.full_name || 'N/A'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">Current Location</Typography>
                <Typography variant="subtitle1">{asset.location?.name || 'N/A'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="New User"
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                fullWidth
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="New Location"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                fullWidth
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Reason for Transfer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferAssetModal;
