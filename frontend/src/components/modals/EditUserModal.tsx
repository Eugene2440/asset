import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { usersAPI, locationsAPI } from '../../services/api.ts';
import { User, UserRole, Location } from '../../types/index.ts';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  user: User;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, onEdit, user }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState(user.role || '');
  const [isActive, setIsActive] = useState(user.is_active || false);
  const [locationId, setLocationId] = useState(user.location?.id || '');
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await locationsAPI.getLocations();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    };
    fetchLocations();
  }, []);

  const handleSubmit = async () => {
    try {
      await usersAPI.updateUser(user.id, { 
        name, 
        email, 
        role, 
        is_active: isActive, 
        location_id: locationId 
      });
      onEdit();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <TextField
          autoFocus
          margin="dense"
          label="Full Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Email Address"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormControl fullWidth margin="dense" variant="outlined">
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            label="Role"
          >
            {Object.values(UserRole).map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense" variant="outlined">
          <InputLabel>Location</InputLabel>
          <Select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value as string)}
            label="Location"
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
          label="Active"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
