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
    asset_tag: '',
    name: '',
    category: '',
    brand: '',
    model: '',
    serial_number: '',
    status: AssetStatus.ACTIVE,
    purchase_date: '',
    warranty_expiry: '',
    description: '',
    specifications: '',
    assigned_user_id: '',
    location_id: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const usersData = await usersAPI.getUsers();
          setUsers(usersData);
          const locationsData = await locationsAPI.getLocations();
          setLocations(locationsData);
        } catch (err) {
          setError('Failed to load users or locations.');
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
      await assetsAPI.createAsset(formData);
      onAssetAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" component="h2" gutterBottom>
          Add New Asset
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          name="name"
          label="Asset Name"
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          name="asset_tag"
          label="Asset Tag"
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          select
          name="category"
          label="Category"
          value={formData.category}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {Object.values(AssetCategory).map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          name="status"
          label="Status"
          value={formData.status}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {Object.values(AssetStatus).map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          name="assigned_user_id"
          label="Assign to User (Optional)"
          value={formData.assigned_user_id}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          <MenuItem value="">None</MenuItem>
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          name="location_id"
          label="Location (Optional)"
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
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Add Asset'}
        </Button>
      </Box>
    </Modal>
  );
}
