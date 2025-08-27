import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon, People as PeopleIcon, LocationOn as LocationIcon } from '@mui/icons-material';

interface QuickActionsProps {
  onAddAsset: () => void;
  onAddUser: () => void;
  onAddLocation: () => void;
}

export default function QuickActions({ onAddAsset, onAddUser, onAddLocation }: QuickActionsProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddAsset}
          sx={{ justifyContent: 'flex-start' }}
        >
          Add New Asset
        </Button>
        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={onAddUser}
          sx={{ justifyContent: 'flex-start' }}
        >
          Add New User
        </Button>
        <Button
          variant="contained"
          startIcon={<LocationIcon />}
          onClick={onAddLocation}
          sx={{ justifyContent: 'flex-start' }}
        >
          Add New Location
        </Button>
      </Box>
    </Box>
  );
}
