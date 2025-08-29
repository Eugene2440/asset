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
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Assets"
            value={stats.total_assets}
            icon={<ComputerIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Assets"
            value={stats.active_assets}
            icon={<CheckCircleIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Inactive Assets"
            value={stats.inactive_assets}
            icon={<WarningIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Transfers"
            value={stats.pending_transfers}
            icon={<SwapHorizIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={<PeopleIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Locations"
            value={stats.total_locations}
            icon={<LocationIcon />}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <AssetStatusChart />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <AssetCategoryChart />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <QuickActions 
                onAddAsset={onAddAsset}
                onAddUser={onAddUser}
                onAddLocation={onAddLocation}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
