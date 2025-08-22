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
  TextField,
  InputAdornment,
  TableSortLabel,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import { assetsAPI } from '../services/api.ts';
import { Asset } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';
import TransferAssetModal from '../components/modals/TransferAssetModal.tsx';

const AssetListPage = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Asset | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      const data = await assetsAPI.getAssets(params);
      setAssets(data.assets); // Assuming the API returns { assets: [...] }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAssets();
    }, 500); // Debounce search input

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, sortBy, sortOrder, filterStatus]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, asset: Asset) => {
    setAnchorEl(event.currentTarget);
    setSelectedAsset(asset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAsset(null);
  };

  const handleEdit = () => {
    if (!selectedAsset) return;
    console.log('Edit asset:', selectedAsset.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (!selectedAsset) return;
    console.log('Delete asset:', selectedAsset.id);
    handleMenuClose();
  };

  const handleTransfer = () => {
    if (!selectedAsset) return;
    setTransferModalOpen(true);
  };

  const handleTransferSuccess = () => {
    setSnackbarMessage('Transfer request created successfully.');
    fetchAssets(); // Refresh asset list
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (property: keyof Asset) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleFilterStatusChange = (event: any) => {
    setFilterStatus(event.target.value);
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
      <Typography variant="h4" gutterBottom>
        Asset List
      </Typography>
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, mb: 2 }}>
        <TextField
          label="Search Assets"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2, width: '300px' }}
        />
        <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={handleFilterStatusChange}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Maintenance">Maintenance</MenuItem>
          </Select>
        </FormControl>
      </Toolbar>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="asset table">
          <TableHead>
            <TableRow>
              <TableCell>Tag No</TableCell>
              <TableCell>Serial Number</TableCell>
              <TableCell>OS Version</TableCell>
              <TableCell>Asset Type</TableCell>
              <TableCell>Asset Make</TableCell>
              <TableCell>Asset Model</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow
                key={asset.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">{asset.tag_no}</TableCell>
                <TableCell>{asset.serial_number}</TableCell>
                <TableCell>{asset.os_version}</TableCell>
                <TableCell>{asset.asset_type}</TableCell>
                <TableCell>{asset.asset_make}</TableCell>
                <TableCell>{asset.model}</TableCell>
                <TableCell>{asset.location?.name}</TableCell>
                <TableCell>{asset.assigned_user?.name}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>
                  <IconButton
                    aria-label="more"
                    onClick={(event) => handleMenuClick(event, asset)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={open && selectedAsset?.id === asset.id}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleEdit}>Edit</MenuItem>
                    <MenuItem onClick={handleDelete}>Delete</MenuItem>
                    <MenuItem onClick={handleTransfer}>Transfer</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedAsset && (
        <TransferAssetModal
          open={isTransferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            handleMenuClose();
          }}
          asset={selectedAsset}
          onTransferSuccess={handleTransferSuccess}
          currentUser={user}
        />
      )}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default AssetListPage;
