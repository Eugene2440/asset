import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  SwapHoriz as TransferIcon,
  Edit as EditIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { analyticsAPI } from '../../services/api.ts';

interface Activity {
  id: string;
  type: 'asset_added' | 'asset_transferred' | 'asset_updated' | 'user_added';
  description: string;
  timestamp: string;
  user: string;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'asset_added':
      return <AddIcon sx={{ color: '#2e7d32' }} />;
    case 'asset_transferred':
      return <TransferIcon sx={{ color: '#ed6c02' }} />;
    case 'asset_updated':
      return <EditIcon sx={{ color: '#1976d2' }} />;
    case 'user_added':
      return <PersonIcon sx={{ color: '#9c27b0' }} />;
    default:
      return <AddIcon />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'asset_added':
      return '#2e7d32';
    case 'asset_transferred':
      return '#ed6c02';
    case 'asset_updated':
      return '#1976d2';
    case 'user_added':
      return '#9c27b0';
    default:
      return '#666';
  }
};

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await analyticsAPI.getRecentActivities(10);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Recent Activities
      </Typography>
      <List sx={{ 
        p: 0, 
        maxHeight: 300, 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '3px'
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '3px'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8'
        }
      }}>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No recent activities
          </Typography>
        ) : (
          activities.map((activity) => (
          <ListItem
            key={activity.id}
            sx={{
              px: 0,
              py: 1,
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              '&:last-child': { borderBottom: 'none' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getActivityIcon(activity.type)}
            </ListItemIcon>
            <ListItemText
              primary={activity.description}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {activity.timestamp}
                  </Typography>
                  <Chip
                    label={activity.user}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: getActivityColor(activity.type),
                      color: 'white'
                    }}
                  />
                </Box>
              }
            />
          </ListItem>
        ))
        )}
      </List>
    </Box>
  );
}