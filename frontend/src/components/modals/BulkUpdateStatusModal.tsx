import React, { useState } from 'react';
import { Modal, Box, Typography, Select, MenuItem, Button, FormControl, InputLabel } from '@mui/material';
import { assetsAPI } from '../../services/api.ts';

interface BulkUpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  assetIds: string[];
  onSuccess: () => void;
}

const BulkUpdateStatusModal: React.FC<BulkUpdateStatusModalProps> = ({ open, onClose, assetIds, onSuccess }) => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    try {
      await assetsAPI.bulkUpdateStatus(assetIds, status);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update assets status');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ padding: 4, backgroundColor: 'white', margin: 'auto', mt: 10, width: 400 }}>
        <Typography variant="h6">Bulk Update Status</Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="In-service">In-service</MenuItem>
            <MenuItem value="Retired">Retired</MenuItem>
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

export default BulkUpdateStatusModal;
