import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  SwapHoriz as SwapHorizIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Asset, Transfer } from '../../types/index.ts';
import { assetsAPI, analyticsAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import StatCard from './StatCard.tsx';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [userTransfers, setUserTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get system-wide stats like admin dashboard
        const statsData = await analyticsAPI.getDashboardStats();
        setStats(statsData);

        // Only get transfers initiated by this user
        const transfersData = await assetsAPI.getTransfers();
        setUserTransfers(transfersData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading || !stats) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: '#ffffff'
        }}
      >
        <CircularProgress sx={{ color: '#1976d2' }} />
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

  const myPendingTransfersCount = userTransfers.filter(transfer => transfer.status === 'PENDING').length;
  const myTransfersCount = userTransfers.length;

  return (
    <Box sx={{ background: '#ffffff' }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#666',
          textAlign: 'center',
          mb: 4,
          fontWeight: 400
        }}
      >
        Welcome, {user?.name} - IT Asset Management
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


      <Card sx={{ 
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        borderRadius: 3,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            fontWeight: 600,
            color: '#333'
          }}
        >
          My Transfer Requests
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : userTransfers.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            p: 4,
            background: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Typography sx={{ color: '#666', fontSize: '1.1rem' }}>
              No transfer requests found.
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper}
            sx={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead sx={{ background: '#1976d2' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Asset</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Requested At</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>To User</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>To Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userTransfers.map((transfer, index) => (
                  <TableRow 
                    key={transfer.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <TableCell>{transfer.id}</TableCell>
                    <TableCell>{transfer.asset?.asset_type || 'N/A'}</TableCell>
                    <TableCell>{transfer.reason}</TableCell>
                    <TableCell>{transfer.status}</TableCell>
                    <TableCell>{transfer.requested_at ? new Date(transfer.requested_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{transfer.to_user?.name || 'N/A'}</TableCell>
                    <TableCell>{transfer.to_location?.name || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </CardContent>
      </Card>
    </Box>
  );
}
