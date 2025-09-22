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
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{ 
          fontWeight: 700,
          color: '#333',
          mb: 3
        }}
      >
        Quick Actions
      </Typography>
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 2,
        mt: 2 
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddAsset}
          sx={{ 
            background: '#1976d2',
            borderRadius: 2,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: '#1565c0',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)'
            }
          }}
        >
          Add New Asset
        </Button>
        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={onAddUser}
          sx={{ 
            background: '#1976d2',
            borderRadius: 2,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: '#1565c0',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)'
            }
          }}
        >
          Add New User
        </Button>
        <Button
          variant="contained"
          startIcon={<LocationIcon />}
          onClick={onAddLocation}
          sx={{ 
            background: '#1976d2',
            borderRadius: 2,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: '#1565c0',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)'
            }
          }}
        >
          Add New Location
        </Button>
      </Box>
    </Box>
  );
}
