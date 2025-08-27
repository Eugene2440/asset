import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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

interface AdminDashboardProps {
  stats: DashboardStats;
  onAddAsset: () => void;
  onAddUser: () => void;
  onAddLocation: () => void;
}

export default function AdminDashboard({ stats, onAddAsset, onAddUser, onAddLocation }: AdminDashboardProps) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
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
        <StatCard
          title="Inactive Assets"
          value={stats.inactive_assets}
          icon={<WarningIcon />}
          color="#f57c00"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
          mt: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent asset transfers, allocations, and system changes will be displayed here.
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <QuickActions 
              onAddAsset={onAddAsset}
              onAddUser={onAddUser}
              onAddLocation={onAddLocation}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
