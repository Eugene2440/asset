import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              color: 'white',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
