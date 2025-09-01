import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Select, MenuItem, Button, FormControl, InputLabel } from '@mui/material';
import { locationsAPI, assetsAPI } from '../../services/api.ts';

interface BulkUpdateLocationModalProps {
  open: boolean;
  onClose: () => void;
  assetIds: string[];
  onSuccess: () => void;
}

const BulkUpdateLocationModal: React.FC<BulkUpdateLocationModalProps> = ({ open, onClose, assetIds, onSuccess }) => {
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const locationsData = await locationsAPI.getLocations();
      setLocations(locationsData);
    };
    fetchLocations();
  }, []);

  const handleUpdate = async () => {
    try {
      await assetsAPI.bulkUpdateLocation(assetIds, location);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update assets location');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ padding: 4, backgroundColor: 'white', margin: 'auto', mt: 10, width: 400 }}>
        <Typography variant="h6">Bulk Update Location</Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Location</InputLabel>
          <Select value={location} label="Location" onChange={(e) => setLocation(e.target.value)}>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" sx={{ ml: 2 }}>Update</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default BulkUpdateLocationModal;
