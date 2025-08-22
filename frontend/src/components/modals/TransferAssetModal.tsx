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
  Autocomplete,
} from '@mui/material';
import { usersAPI, locationsAPI, assetsAPI } from '../../services/api.ts';
import { User, Location, Asset } from '../../types/index.ts';

interface TransferAssetModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onTransferSuccess: () => void;
  currentUser: User | null;
}

const TransferAssetModal: React.FC<TransferAssetModalProps> = ({ open, onClose, asset, onTransferSuccess, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [toUserId, setToUserId] = useState<string | null>('');
  const [toLocationId, setToLocationId] = useState('');
  const [reason, setReason] = useState('');
  const [damageReport, setDamageReport] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
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

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPhoto(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!asset) return;

    setError(null);
    setLoading(true);

    try {
      await assetsAPI.createTransfer({
        asset_id: asset.id,
        to_user_id: toUserId,
        to_location_id: toLocationId || null,
        reason,
        damage_report: damageReport,
        assigned_to_id: assignedTo,
        // photo_url will be handled by the backend, for now, we send the name
        photo_url: photo ? photo.name : null,
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
                <Typography variant="subtitle1">{asset.assigned_user?.name || 'N/A'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">Current Location</Typography>
                <Typography variant="subtitle1">{asset.location?.name || 'N/A'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">Requester</Typography>
                <Typography variant="subtitle1">{currentUser?.name || 'N/A'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.name || ''}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name || 'Unnamed User'}
                  </li>
                )}
                onChange={(event, newValue) => {
                  setToUserId(newValue ? newValue.id : null);
                }}
                renderInput={(params) => <TextField {...params} label="New User" />}
                fullWidth
              />
              <Autocomplete
                options={locations}
                getOptionLabel={(option) => option.name || ''}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name || 'Unnamed Location'}
                  </li>
                )}
                onChange={(event, newValue) => {
                  setToLocationId(newValue ? newValue.id : '');
                }}
                renderInput={(params) => <TextField {...params} label="New Location" />}
                fullWidth
              />
            </Box>
            <TextField
              label="Reason for Transfer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Damage Report"
              value={damageReport}
              onChange={(e) => setDamageReport(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button variant="contained" component="label">
                Upload Photo
                <input type="file" hidden onChange={handlePhotoChange} />
              </Button>
              {photo && <Typography variant="body2">{photo.name}</Typography>}
            </Box>
             <TextField
              label="Assigned To"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              fullWidth
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