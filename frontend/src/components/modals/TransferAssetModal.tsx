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
        to_user_id: toUserId || null,
        to_location_id: toLocationId || null,
        reason: reason || '',
        damage_report: damageReport || null,
        assigned_to_id: assignedTo || null,
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
      <DialogTitle sx={{ fontSize: '1.1rem', py: 1.5 }}>Transfer Asset</DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.875rem' }}>{error}</Alert>}
        {asset && (
          <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5 }}>{asset.name}</Typography>
              <Typography color="textSecondary" sx={{ fontSize: '0.75rem' }}>Serial: {asset.serial_number}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Current User</Typography>
                <Typography variant="subtitle1" sx={{ fontSize: '0.875rem' }}>{asset.assigned_user?.name || 'N/A'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Current Location</Typography>
                <Typography variant="subtitle1" sx={{ fontSize: '0.875rem' }}>{asset.location?.name || 'N/A'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.name || ''}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ fontSize: '0.875rem', padding: '4px 12px', minHeight: '32px' }}>
                    {option.name || 'Unnamed User'}
                  </li>
                )}
                onChange={(event, newValue) => {
                  setToUserId(newValue ? newValue.id : null);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="New User" 
                    size="small"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                      '& .MuiInputBase-input': { fontSize: '0.875rem' }
                    }}
                  />
                )}
                componentsProps={{
                  popper: {
                    sx: {
                      '& .MuiAutocomplete-listbox': {
                        fontSize: '0.875rem',
                        '& .MuiAutocomplete-option': {
                          fontSize: '0.875rem',
                          minHeight: '32px',
                          padding: '4px 12px'
                        }
                      }
                    }
                  }
                }}
                fullWidth
              />
              <Autocomplete
                options={locations}
                getOptionLabel={(option) => option.name || ''}
                renderOption={(props, option) => (
                  <li {...props} key={option.id} style={{ fontSize: '0.875rem', padding: '4px 12px', minHeight: '32px' }}>
                    {option.name || 'Unnamed Location'}
                  </li>
                )}
                onChange={(event, newValue) => {
                  setToLocationId(newValue ? newValue.id : '');
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="New Location" 
                    size="small"
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                      '& .MuiInputBase-input': { fontSize: '0.875rem' }
                    }}
                  />
                )}
                componentsProps={{
                  popper: {
                    sx: {
                      '& .MuiAutocomplete-listbox': {
                        fontSize: '0.875rem',
                        '& .MuiAutocomplete-option': {
                          fontSize: '0.875rem',
                          minHeight: '32px',
                          padding: '4px 12px'
                        }
                      }
                    }
                  }
                }}
                fullWidth
              />
            </Box>
            <TextField
              label="Reason for Transfer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
              size="small"
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                '& .MuiInputBase-input': { fontSize: '0.875rem' }
              }}
            />
            <TextField
              label="Damage Report"
              value={damageReport}
              onChange={(e) => setDamageReport(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                '& .MuiInputBase-input': { fontSize: '0.875rem' }
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button 
                variant="contained" 
                component="label" 
                size="small"
                sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
              >
                Upload Photo
                <input type="file" hidden onChange={handlePhotoChange} />
              </Button>
              {photo && <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{photo.name}</Typography>}
            </Box>
             <TextField
              label="Assigned To"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              fullWidth
              size="small"
              sx={{ 
                '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                '& .MuiInputBase-input': { fontSize: '0.875rem' }
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button 
          onClick={onClose} 
          size="small"
          sx={{ fontSize: '0.875rem' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          size="small"
          sx={{ fontSize: '0.875rem' }}
        >
          {loading ? <CircularProgress size={16} /> : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferAssetModal;