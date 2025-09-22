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
} from '@mui/material';
import { Asset, Transfer, User as UserType, Location } from '../../types/index.ts';
import { assetsAPI, usersAPI, locationsAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

export default function UserDashboard() {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTransfer({
      ...newTransfer,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      setNewTransfer({
        asset_id: '',
        reason: '',
        notes: '',
        to_user_id: '',
        to_location_id: '',
      });
      if (user) {
        const transfersData = await assetsAPI.getTransfers({ userId: user.id });
        setUserTransfers(transfersData);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserSpecificData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const assetsData = await assetsAPI.getAssets({ assigned_user_id: user.id });
        setUserAssets(assetsData.assets);

        const usersData = await usersAPI.getUsers();
        setUsers(usersData);
        const locationsData = await locationsAPI.getLocations();
        setLocations(locationsData);

        const transfersData = await assetsAPI.getTransfers({ userId: user.id });
        setUserTransfers(transfersData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSpecificData();
  }, [user]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white'
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      p: 3,
      borderRadius: 2
    }}>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Welcome, {user?.name}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            mt: 1,
            fontWeight: 300
          }}
        >
          Manage Your Assets & Transfers
        </Typography>
      </Box>
      
      <Paper sx={{ 
        p: 4, 
        mt: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: 3
      }}>
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3
          }}
        >
          Your Asset Transfers
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleTransferSubmit} 
          sx={{ 
            mt: 2, 
            mb: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            p: 3,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}
        >
          <Typography 
            variant="h6"
            sx={{ 
              fontWeight: 600,
              color: '#333',
              mb: 1
            }}
          >
            Request New Asset Transfer
          </Typography>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ borderRadius: 2 }}>Transfer request submitted successfully!</Alert>}
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
                {u.name}
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
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: '#ccc',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            Request Transfer
          </Button>
        </Box>

        <Typography 
          variant="h6" 
          sx={{ 
            mt: 4, 
            mb: 3,
            fontWeight: 600,
            color: '#333'
          }}
        >
          Your Pending Transfer Requests
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : userTransfers.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            p: 4,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography sx={{ color: '#666', fontSize: '1.1rem' }}>
              No transfer requests found.
            </Typography>
          </Box>
        ) : (
          <TableContainer 
            component={Paper}
            sx={{
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                      '&:hover': {
                        backgroundColor: '#e3f2fd'
                      }
                    }}
                  >
                    <TableCell>{transfer.id}</TableCell>
                    <TableCell>{userAssets.find(a => a.id === transfer.asset_id)?.name || 'N/A'}</TableCell>
                    <TableCell>{transfer.reason}</TableCell>
                    <TableCell>{transfer.status}</TableCell>
                    <TableCell>{transfer.requested_at ? new Date(transfer.requested_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{users.find(u => u.id === transfer.to_user_id)?.name || 'N/A'}</TableCell>
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
