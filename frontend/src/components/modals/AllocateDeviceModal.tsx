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

interface AllocateDeviceModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onAllocateSuccess: () => void;
}

const AllocateDeviceModal: React.FC<AllocateDeviceModalProps> = ({ open, onClose, asset, onAllocateSuccess }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>('');
  const [newUserName, setNewUserName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
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

    let userIdToAllocate = selectedUserId;

    try {
      if (newUserName) {
        const newUser = await usersAPI.createUser({ name: newUserName });
        userIdToAllocate = newUser.id;
      }

      await assetsAPI.updateAsset(asset.id, {
        user: userIdToAllocate,
        location: selectedLocationId,
      });

      onAllocateSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to allocate device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Allocate Device</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {asset && (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6">{asset.name}</Typography>
              <Typography color="textSecondary">Serial: {asset.serial_number}</Typography>
            </Box>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.name || ''}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name || 'Unnamed User'}
                </li>
              )}
              onChange={(event, newValue) => {
                setSelectedUserId(newValue ? newValue.id : null);
              }}
              renderInput={(params) => <TextField {...params} label="Select User" />}
              fullWidth
            />
            <TextField
              label="Or Create New User"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
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
                setSelectedLocationId(newValue ? newValue.id : '');
              }}
              renderInput={(params) => <TextField {...params} label="Select Location" />}
              fullWidth
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Allocate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AllocateDeviceModal;
