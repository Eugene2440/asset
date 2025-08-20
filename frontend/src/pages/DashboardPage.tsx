import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
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
} from '@mui/material';
import {
  Computer as ComputerIcon,
  SwapHoriz as SwapHorizIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DashboardStats, Asset, Transfer, User as UserType, Location } from '../types';
import { analyticsAPI, assetsAPI, usersAPI, locationsAPI } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();

  // State for user-specific transfers and assets
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userTransfers, setUserTransfers] = useState<Transfer[]>([]);
  const [newTransfer, setNewTransfer] = useState({
    asset_id: '',
    reason: '',
    notes: '',
    to_user_id: '',
    to_location_id: '',
  });
  const [transferLoading, setTransferLoading] = useState(true);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTransfer({
      ...newTransfer,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransferError(null);
    setFormSuccess(false);

    try {
      const payload = {
        asset_id: parseInt(newTransfer.asset_id),
        reason: newTransfer.reason,
        notes: newTransfer.notes || undefined,
        to_user_id: newTransfer.to_user_id ? parseInt(newTransfer.to_user_id) : undefined,
        to_location_id: newTransfer.to_location_id ? parseInt(newTransfer.to_location_id) : undefined,
      };
      await assetsAPI.createTransfer(payload);
      setFormSuccess(true);
      // Clear form
      setNewTransfer({
        asset_id: '',
        reason: '',
        notes: '',
        to_user_id: '',
        to_location_id: '',
      });
      // Refresh transfers list
      if (user) {
        const transfersData = await assetsAPI.getTransfers({ userId: user.id });
        setUserTransfers(transfersData);
      }
    } catch (err: any) {
      setTransferError(err.response?.data?.detail || 'Failed to submit transfer request');
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAdmin) {
        try {
          const data = await analyticsAPI.getDashboardStats();
          setStats(data);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    const fetchUserSpecificData = async () => {
      if (!user) return;

      setTransferLoading(true);
      try {
        // Fetch assets assigned to the current user
        const assetsData = await assetsAPI.getAssets({ assigned_user_id: user.id });
        setUserAssets(assetsData.assets);

        // Fetch all users and locations for transfer form dropdowns
        const usersData = await usersAPI.getUsers();
        setUsers(usersData);
        const locationsData = await locationsAPI.getLocations();
        setLocations(locationsData);

        // Fetch user's transfer requests
        const transfersData = await assetsAPI.getTransfers({ userId: user.id });
        setUserTransfers(transfersData);
      } catch (err: any) {
        setTransferError(err.response?.data?.detail || 'Failed to load user data');
      } finally {
        setTransferLoading(false);
      }
    };

    if (!isAdmin) {
      fetchUserSpecificData();
    }
  }, [isAdmin, user]);

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

  if (!isAdmin) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.full_name}
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Asset Transfers
          </Typography>
          <Box component="form" onSubmit={handleTransferSubmit} sx={{ mt: 2, mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Request New Asset Transfer</Typography>
            {transferError && <Alert severity="error">{transferError}</Alert>}
            {formSuccess && <Alert severity="success">Transfer request submitted successfully!</Alert>}
            <TextField
              select
              label="Asset"
              name="asset_id"
              value={newTransfer.asset_id}
              onChange={handleTransferChange}
              fullWidth
              required
            >
              {userAssets.map((asset) => (
                <MenuItem key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_tag})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason"
              name="reason"
              value={newTransfer.reason}
              onChange={handleTransferChange}
              fullWidth
              required
            />
            <TextField
              label="Notes (Optional)"
              name="notes"
              value={newTransfer.notes}
              onChange={handleTransferChange}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              select
              label="Transfer To User (Optional)"
              name="to_user_id"
              value={newTransfer.to_user_id}
              onChange={handleTransferChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Transfer To Location (Optional)"
              name="to_location_id"
              value={newTransfer.to_location_id}
              onChange={handleTransferChange}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" color="primary" disabled={transferLoading}>
              Request Transfer
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Your Pending Transfer Requests
          </Typography>
          {transferLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <CircularProgress />
            </Box>
          ) : userTransfers.length === 0 ? (
            <Typography>No transfer requests found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested At</TableCell>
                    <TableCell>To User</TableCell>
                    <TableCell>To Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{transfer.id}</TableCell>
                      <TableCell>{userAssets.find(a => a.id === transfer.asset_id)?.name || 'N/A'}</TableCell>
                      <TableCell>{transfer.reason}</TableCell>
                      <TableCell>{transfer.status}</TableCell>
                      <TableCell>{new Date(transfer.requested_at).toLocaleDateString()}</TableCell>
                      <TableCell>{users.find(u => u.id === transfer.to_user_id)?.full_name || 'N/A'}</TableCell>
                      <TableCell>{locations.find(loc => loc.id === transfer.to_location_id)?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {stats && (
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
      )}

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
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Add new asset
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Process transfer requests
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • Generate reports
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
