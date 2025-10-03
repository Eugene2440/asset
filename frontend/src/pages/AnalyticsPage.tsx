import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analyticsAPI } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({ title, value, icon, color }: MetricCardProps) => (
  <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ 
          bgcolor: `${color}20`, 
          borderRadius: '50%', 
          p: 2,
          color 
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [assetsByType, setAssetsByType] = useState([]);
  const [assetsByStatus, setAssetsByStatus] = useState([]);
  const [assetsByLocation, setAssetsByLocation] = useState([]);
  const [monthlyTransfers, setMonthlyTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAdmin) return;
      
      try {
        const [stats, types, status, locations, transfers] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          analyticsAPI.getAssetsByType(),
          analyticsAPI.getAssetsByStatus(),
          analyticsAPI.getAssetsByLocation?.() || Promise.resolve([]),
          analyticsAPI.getMonthlyTransfers?.() || Promise.resolve([])
        ]);

        setDashboardStats(stats);
        setAssetsByType(types);
        setAssetsByStatus(status);
        setAssetsByLocation(locations);
        setMonthlyTransfers(transfers);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Access denied. Analytics are only available to administrators.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Analytics Dashboard
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Assets"
            value={dashboardStats?.total_assets || 0}
            icon={<InventoryIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Assets"
            value={dashboardStats?.active_assets || 0}
            icon={<TrendingUpIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Transfers"
            value={dashboardStats?.pending_transfers || 0}
            icon={<TransferIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Locations"
            value={dashboardStats?.total_locations || 0}
            icon={<AssessmentIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Assets by Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Assets by Type
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={assetsByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="asset_type"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {assetsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Assets by Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Assets by Status
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={assetsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Assets by Location */}
        {assetsByLocation.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Assets by Location
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={assetsByLocation.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="location_name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="asset_count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Monthly Transfers */}
        {monthlyTransfers.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Monthly Transfer Trends
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={monthlyTransfers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="transfer_count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}