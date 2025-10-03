import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  TextField,
} from '@mui/material';
import { locationsAPI } from '../../services/api.ts';
import { Location } from '../../types/index.ts';

interface EditLocationModalProps {
  open: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
  location: Location | null;
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

const mainLocations = ['ACT', 'LC1', 'LC2', 'ICDN', 'KIBARANI', 'SHIMANZI'];
const departments = ['Main office', 'WH1', 'WH2', 'WH3', 'WH4', 'Operations', 'Acceptance', 'Security', 'IT', 'HR', 'Finance', 'Procurement'];

export default function EditLocationModal({ open, onClose, onLocationUpdated, location }: EditLocationModalProps) {
  const [mainLocation, setMainLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location && open) {
      const [main, ...deptParts] = location.name.split(' ');
      setMainLocation(main);
      setDepartment(deptParts.join(' '));
    }
  }, [location, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainLocation || !department || !location) {
      setError('Please select both main location and department');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await locationsAPI.updateLocation(location.id, {
        name: `${mainLocation} ${department}`,
      });
      onLocationUpdated();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update location.';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to update location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" component="h2" gutterBottom>
          Edit Location
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel>Main Location</InputLabel>
          <Select
            value={mainLocation}
            label="Main Location"
            onChange={(e) => setMainLocation(e.target.value)}
          >
            {mainLocations.map((location) => (
              <MenuItem key={location} value={location}>
                {location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          options={departments}
          value={department}
          onChange={(event, newValue) => setDepartment(newValue || '')}
          onInputChange={(event, newInputValue) => setDepartment(newInputValue)}
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              label="Department/Office"
              required
              fullWidth
            />
          )}
          sx={{ mb: 2 }}
        />
        {mainLocation && department && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Location will be updated to: <strong>{mainLocation} {department}</strong>
          </Alert>
        )}
        <Button type="submit" variant="contained" disabled={loading} fullWidth>
          {loading ? <CircularProgress size={24} /> : 'Update Location'}
        </Button>
      </Box>
    </Modal>
  );
}