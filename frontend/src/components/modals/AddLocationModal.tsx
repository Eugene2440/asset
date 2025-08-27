import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { locationsAPI } from '../../services/api.ts';

interface AddLocationModalProps {
  open: boolean;
  onClose: () => void;
  onLocationAdded: () => void;
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

export default function AddLocationModal({ open, onClose, onLocationAdded }: AddLocationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await locationsAPI.createLocation(formData);
      onLocationAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" component="h2" gutterBottom>
          Add New Location
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          name="name"
          label="Location Name"
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          name="address"
          label="Address"
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          name="description"
          label="Description"
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Add Location'}
        </Button>
      </Box>
    </Modal>
  );
}
