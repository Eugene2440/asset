import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';

interface Transfer {
  id: string;
  asset: { name: string };
  from_user: { name: string };
  to_user: { name: string };
  from_location: { name: string };
  to_location: { name: string };
  status: string;
  requested_at: string;
}

const TransfersPage = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        // This needs to be implemented in services/api.ts
        const data = await assetsAPI.getTransfers(); 
        setTransfers(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch transfers');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const handleRowClick = (transferId: string) => {
    navigate(`/transfers/${transferId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Asset Transfers
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/assets"
        >
          Initiate Transfer
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="transfers table">
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>From User</TableCell>
              <TableCell>To User</TableCell>
              <TableCell>From Location</TableCell>
              <TableCell>To Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow
                key={transfer.id}
                hover
                onClick={() => handleRowClick(transfer.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{transfer.asset?.name}</TableCell>
                <TableCell>{transfer.from_user?.name}</TableCell>
                <TableCell>{transfer.to_user?.name}</TableCell>
                <TableCell>{transfer.from_location?.name}</TableCell>
                <TableCell>{transfer.to_location?.name}</TableCell>
                <TableCell>{transfer.status}</TableCell>
                <TableCell>{new Date(transfer.requested_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransfersPage;
