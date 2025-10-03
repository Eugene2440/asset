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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { locationsAPI } from '../services/api.ts';
import { Location } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import AddLocationModal from '../components/modals/AddLocationModal.tsx';
import EditLocationModal from '../components/modals/EditLocationModal.tsx';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.tsx';

const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainLocationFilter, setMainLocationFilter] = useState('All');
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

  const handleEditOpen = (location: Location) => {
    setSelectedLocation(location);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setSelectedLocation(null);
    setEditOpen(false);
  };

  const handleAddLocation = () => {
    fetchLocations();
  };

  const handleUpdateLocation = () => {
    fetchLocations();
  };

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    try {
      await locationsAPI.deleteLocation(locationToDelete.id);
      setDeleteOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete location');
      setDeleteOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteOpen(false);
    setLocationToDelete(null);
  };



  const mainLocations = ['ACT', 'LC1', 'LC2', 'ICDN', 'KIBARANI', 'SHIMANZI'];

  const filteredLocations = locations
    .filter((location) => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (mainLocationFilter === 'All') return matchesSearch;
      const mainLoc = location.name.split(' ')[0];
      return matchesSearch && mainLoc === mainLocationFilter;
    })
    .sort((a, b) => {
      const getMainLocation = (name: string) => name.split(' ')[0];
      const mainA = getMainLocation(a.name);
      const mainB = getMainLocation(b.name);
      if (mainA !== mainB) {
        return mainA.localeCompare(mainB);
      }
      return a.name.localeCompare(b.name);
    });

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
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          Locations
        </Typography>
        {user?.role === 'admin' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon sx={{ fontSize: '1rem' }} />} 
            onClick={handleOpen}
            size="small"
            sx={{ 
              fontSize: '0.75rem', 
              padding: '4px 12px',
              minWidth: 'auto',
              height: '32px'
            }}
          >
            Add Location
          </Button>
        )}
      </Box>

      <Box mb={2} display="flex" gap={2}>
        <TextField
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
          sx={{ flex: 1 }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Main Location</InputLabel>
          <Select
            value={mainLocationFilter}
            label="Main Location"
            onChange={(e) => setMainLocationFilter(e.target.value)}
            size="medium"
          >
            <MenuItem value="All">All</MenuItem>
            {mainLocations.map((location) => (
              <MenuItem key={location} value={location}>
                {location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Main Location</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Department/Office</TableCell>
              {user?.role === 'admin' && <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLocations.map((location) => {
              const [mainLocation, ...departmentParts] = location.name.split(' ');
              const department = departmentParts.join(' ');
              return (
                <TableRow key={location.id}>
                  <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{mainLocation}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{department}</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell sx={{ padding: '8px' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleEditOpen(location)}
                        sx={{ mr: 1, fontSize: '0.65rem' }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleDeleteClick(location)}
                        sx={{ fontSize: '0.65rem' }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <AddLocationModal open={open} onClose={handleClose} onLocationAdded={handleAddLocation} />
      <EditLocationModal 
        open={editOpen} 
        onClose={handleEditClose} 
        onLocationUpdated={handleUpdateLocation}
        location={selectedLocation}
      />
      <DeleteConfirmationModal
        open={deleteOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Location"
        message={`Are you sure you want to delete ${locationToDelete?.name}?`}
      />
    </Box>
  );
};

export default LocationsPage;
