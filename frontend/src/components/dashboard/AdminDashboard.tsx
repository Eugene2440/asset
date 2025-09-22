import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  SwapHoriz as SwapHorizIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import StatCard from './StatCard.tsx';
import QuickActions from './QuickActions.tsx';
import { DashboardStats } from '../../types/index.ts';
import AssetStatusChart from './charts/AssetStatusChart.tsx';
import AssetCategoryChart from './charts/AssetCategoryChart.tsx';

interface AdminDashboardProps {
  stats: DashboardStats;
  onAddAsset: () => void;
  onAddUser: () => void;
  onAddLocation: () => void;
}

export default function AdminDashboard({ stats, onAddAsset, onAddUser, onAddLocation }: AdminDashboardProps) {
  return (
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#666',
          textAlign: 'center',
          mb: 4,
          fontWeight: 400
        }}
      >
        Asset Management Overview
      </Typography>
      
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 3,
        mb: 4
      }}>
        <StatCard
          title="Total Assets"
          value={stats.total_assets}
          icon={<ComputerIcon />}
          color="#1976d2"
        />
        <StatCard
          title="Active Assets"
          value={stats.active_assets}
          icon={<CheckCircleIcon />}
          color="#2e7d32"
        />
        <StatCard
          title="Inactive Assets"
          value={stats.inactive_assets}
          icon={<WarningIcon />}
          color="#f57c00"
        />
        <StatCard
          title="Pending Transfers"
          value={stats.pending_transfers}
          icon={<SwapHorizIcon />}
          color="#ed6c02"
        />
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={<PeopleIcon />}
          color="#9c27b0"
        />
        <StatCard
          title="Total Locations"
          value={stats.total_locations}
          icon={<LocationIcon />}
          color="#d32f2f"
        />
      </Box>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: 3,
        mb: 3
      }}>
        <Card sx={{ 
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <CardContent>
            <AssetStatusChart />
          </CardContent>
        </Card>
        <Card sx={{ 
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <CardContent>
            <AssetCategoryChart />
          </CardContent>
        </Card>
      </Box>
      
      <Card sx={{ 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <CardContent>
          <QuickActions 
            onAddAsset={onAddAsset}
            onAddUser={onAddUser}
            onAddLocation={onAddLocation}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
