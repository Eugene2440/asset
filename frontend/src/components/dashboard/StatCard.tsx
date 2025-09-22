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
    <Card sx={{ 
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      borderRadius: 3,
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 15px 40px rgba(0,0,0,0.15)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography 
              color="textSecondary" 
              gutterBottom 
              variant="overline"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: 'uppercase'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="h2"
              sx={{ 
                fontWeight: 700,
                color: color,
                fontSize: '2rem',
                lineHeight: 1.2
              }}
            >
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${color}dd, ${color})`,
              color: 'white',
              borderRadius: '50%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 25px ${color}33`,
              transform: 'scale(1)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)'
              },
              '& svg': {
                fontSize: '1.8rem'
              }
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
