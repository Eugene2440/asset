import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { assetsAPI, usersAPI, locationsAPI } from '../../services/api.ts';
import { User, Location, AssetCategory, AssetStatus } from '../../types/index.ts';

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onAssetAdded: () => void;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function AddAssetModal({ open, onClose, onAssetAdded }: AddAssetModalProps) {
  const [formData, setFormData] = useState({
    asset_type: '',
    asset_make: '',
    asset_model: '',
    tag_no: '',
    serial_number: '',
    assigned_user_id: '',
    location_id: '',
    os_version: '',
  });
  const [assetModels, setAssetModels] = useState([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [usersData, locationsData, modelsData] = await Promise.all([
            usersAPI.getUsers(),
            locationsAPI.getLocations(),
            assetsAPI.getAssetModels()
          ]);
          setUsers(usersData);
          setLocations(locationsData);
          setAssetModels(modelsData);
        } catch (err) {
          setError('Failed to load data.');
        }
      };
      fetchData();
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const status = (formData.assigned_user_id && formData.location_id) ? 'In-service' : 'Retired';
      const assetData = {
        asset_type: formData.asset_type,
        asset_make: formData.asset_make,
        asset_model: formData.asset_model,
        asset_tag: formData.tag_no,
        tag_no: formData.tag_no,
        os_version: formData.os_version,
        serial_number: formData.serial_number,
        asset_status: status,
        location: formData.location_id,
        user: formData.assigned_user_id
      };
      await assetsAPI.createAsset(assetData);
      onAssetAdded();
      onClose();
      setFormData({
        asset_type: '',
        asset_make: '',
        asset_model: '',
        tag_no: '',
        serial_number: '',
        assigned_user_id: '',
        location_id: '',
        os_version: '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to add asset.';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const showOSVersion = ['Desktop', 'Laptop'].includes(formData.asset_type);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" component="h2" gutterBottom>
          Add New Asset
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          select
          name="asset_type"
          label="Asset Type"
          value={formData.asset_type}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {[...new Set(assetModels.map((model: any) => model.asset_type))].map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          freeSolo
          options={[...new Set(assetModels.filter((model: any) => model.asset_type === formData.asset_type).map((model: any) => model.asset_make))]}
          value={formData.asset_make}
          onChange={(event, newValue) => setFormData({...formData, asset_make: newValue || ''})}
          renderInput={(params) => (
            <TextField
              {...params}
              name="asset_make"
              label="Asset Make"
              required
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
        />
        <Autocomplete
          freeSolo
          options={assetModels
            .filter((model: any) => 
              model.asset_type === formData.asset_type && 
              model.asset_make === formData.asset_make &&
              model.model
            )
            .map((model: any) => model.model)
            .filter(Boolean)
          }
          value={formData.asset_model}
          onChange={(event, newValue) => setFormData({...formData, asset_model: newValue || ''})}
          onInputChange={(event, newInputValue) => setFormData({...formData, asset_model: newInputValue})}
          renderInput={(params) => (
            <TextField
              {...params}
              name="asset_model"
              label="Asset Model"
              required
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
        />
        <TextField
          name="tag_no"
          label="Tag No (Optional)"
          value={formData.tag_no}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          name="serial_number"
          label="Serial Number"
          value={formData.serial_number}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          select
          name="location_id"
          label="Assign Location (Optional)"
          value={formData.location_id}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">None</MenuItem>
          {locations.map((location) => (
            <MenuItem key={location.id} value={location.id}>
              {location.name}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          freeSolo
          options={users
            .filter(user => user.full_name || user.name)
            .map((user) => user.full_name || user.name)
            .filter(Boolean)
          }
          value={users.find(u => u.id === formData.assigned_user_id)?.full_name || users.find(u => u.id === formData.assigned_user_id)?.name || ''}
          onChange={(event, newValue) => {
            const user = users.find(u => (u.full_name || u.name) === newValue);
            setFormData({...formData, assigned_user_id: user?.id || ''});
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              name="assigned_user_id"
              label="Assign User (Optional)"
              fullWidth
              sx={{ mb: 2 }}
            />
          )}
        />
        {showOSVersion && (
          <TextField
            name="os_version"
            label="OS Version"
            value={formData.os_version}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        )}
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Add Asset'}
        </Button>
      </Box>
    </Modal>
  );
}
