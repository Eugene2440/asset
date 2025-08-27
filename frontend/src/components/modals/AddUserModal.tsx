import React, { useState } from 'react';
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
import { usersAPI } from '../../services/api.ts';
import { UserRole } from '../../types/index.ts';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserAdded: () => void;
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

export default function AddUserModal({ open, onClose, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: UserRole.USER,
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
      await usersAPI.createUser(formData);
      onUserAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" component="h2" gutterBottom>
          Add New User
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          name="full_name"
          label="Full Name"
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          select
          name="role"
          label="Role"
          value={formData.role}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {Object.values(UserRole).map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Add User'}
        </Button>
      </Box>
    </Modal>
  );
}