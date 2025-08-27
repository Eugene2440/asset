import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { locationsAPI } from '../services/api.ts';
import { Location } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import AddLocationModal from '../components/modals/AddLocationModal.tsx';

const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await locationsAPI.getLocations();
      setLocations(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAddLocation = () => {
    fetchLocations();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await locationsAPI.deleteLocation(id);
        fetchLocations();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete location');
      }
    }
  };

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.division?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Locations
        </Typography>
        {user?.role === 'admin' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add Location
          </Button>
        )}
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Division</TableCell>
              {user?.role === 'admin' && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLocations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.division}</TableCell>
                {user?.role === 'admin' && (
                  <TableCell>
                    <IconButton onClick={() => alert('Edit functionality to be implemented')}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(location.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AddLocationModal open={open} onClose={handleClose} onAdd={handleAddLocation} />
    </Box>
  );
};

export default LocationsPage;
