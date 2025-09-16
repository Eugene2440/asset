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
  TablePagination,
  Checkbox,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link, useNavigate } from 'react-router-dom';
import { assetsAPI, usersAPI, locationsAPI } from '../services/api.ts';
import { Asset } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';
import TransferAssetModal from '../components/modals/TransferAssetModal.tsx';
import AllocateDeviceModal from '../components/modals/AllocateDeviceModal.tsx';
import BulkUpdateStatusModal from '../components/modals/BulkUpdateStatusModal.tsx';
import BulkUpdateLocationModal from '../components/modals/BulkUpdateLocationModal.tsx';

const AssetListPage = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Asset | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterAssetType, setFilterAssetType] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [assetModels, setAssetModels] = useState([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isAllocateModalOpen, setAllocateModalOpen] = useState(false);
  const [isBulkUpdateStatusModalOpen, setBulkUpdateStatusModalOpen] = useState(false);
  const [isBulkUpdateLocationModalOpen, setBulkUpdateLocationModalOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      };
      if (searchTerm) {
        params.search_query = searchTerm;
      }
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      if (filterLocation) {
        params.location_id = filterLocation;
      }
      if (filterAssetType) {
        params.category = filterAssetType;
      }
      if (filterUser) {
        params.assigned_user_id = filterUser;
      }
      const data = await assetsAPI.getAssets(params);
      setAssets(data.assets);
      setTotalCount(data.total_count);
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
  }, [searchTerm, sortBy, sortOrder, filterStatus, filterLocation, filterAssetType, filterUser, page, rowsPerPage]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [locationsData, usersData, assetModelsData] = await Promise.all([
          locationsAPI.getLocations(),
          usersAPI.getUsers(),
          assetsAPI.getAssetModels(),
        ]);
        setLocations(locationsData);
        setUsers(usersData);
        setAssetModels(assetModelsData);
      } catch (error) {
        console.error("Failed to fetch filter data", error);
      }
    };

    fetchFilterData();
  }, []);

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

  const handleAllocate = () => {
    if (!selectedAsset) return;
    setAllocateModalOpen(true);
  };

  const handleTransferSuccess = () => {
    setSnackbarMessage('Transfer request created successfully.');
    fetchAssets(); // Refresh asset list
  };

  const handleAllocateSuccess = () => {
    setSnackbarMessage('Device allocated successfully.');
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

  const handleFilterLocationChange = (event: any) => {
    setFilterLocation(event.target.value);
  };

  const handleFilterAssetTypeChange = (event: any) => {
    setFilterAssetType(event.target.value);
  };

  const handleFilterUserChange = (event: any) => {
    setFilterUser(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = assets.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
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
            <MenuItem value="In-service">In-service</MenuItem>
            <MenuItem value="Retired">Retired</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={filterLocation}
            label="Location"
            onChange={handleFilterLocationChange}
          >
            <MenuItem value="">All</MenuItem>
            {locations.map((location: any) => (
              <MenuItem key={location.id} value={location.id}>
                {location.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
          <InputLabel>Asset Type</InputLabel>
          <Select
            value={filterAssetType}
            label="Asset Type"
            onChange={handleFilterAssetTypeChange}
          >
            <MenuItem value="">All</MenuItem>
            {assetModels.map((model: any) => (
              <MenuItem key={model.id} value={model.asset_type}>
                {model.asset_type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
          <InputLabel>User</InputLabel>
          <Select
            value={filterUser}
            label="User"
            onChange={handleFilterUserChange}
          >
            <MenuItem value="">All</MenuItem>
            {users.map((user: any) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selected.length > 0 && (
          <Button variant="contained" sx={{ mr: 2 }} onClick={() => setBulkUpdateStatusModalOpen(true)}>
            Update Status
          </Button>
        )}
        {selected.length > 0 && (
          <Button variant="contained" onClick={() => setBulkUpdateLocationModalOpen(true)}>
            Update Location
          </Button>
        )}
      </Toolbar>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="asset table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < assets.length}
                  checked={assets.length > 0 && selected.length === assets.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all assets' }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Tag No</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Serial Number</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>OS Version</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Asset Type</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Asset Make</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Asset Model</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => {
              const isItemSelected = selected.indexOf(asset.id) !== -1;

              return (
              <TableRow
                key={asset.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                hover
                onClick={(event) => handleClick(event, asset.id)}
                role="checkbox"
                aria-checked={isItemSelected}
                tabIndex={-1}
                selected={isItemSelected}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isItemSelected}
                    inputProps={{ 'aria-labelledby': `enhanced-table-checkbox-${asset.id}` }}
                  />
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontSize: '0.75rem', padding: '8px' }}>
                  {asset.tag_no}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.serial_number}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.os_version}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.asset_type}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.asset_make}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.model}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.location?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.assigned_user?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{asset.status}</TableCell>
                <TableCell sx={{ padding: '8px' }}>
                  <IconButton
                    aria-label="more"
                    onClick={(event) => handleMenuClick(event, asset)}
                    size="small"
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
                    {!asset.assigned_user && (
                      <MenuItem onClick={handleAllocate}>Allocate Device</MenuItem>
                    )}
                  </Menu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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
      {selectedAsset && (
        <AllocateDeviceModal
          open={isAllocateModalOpen}
          onClose={() => {
            setAllocateModalOpen(false);
            handleMenuClose();
          }}
          asset={selectedAsset}
          onAllocateSuccess={handleAllocateSuccess}
        />
      )}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
      <BulkUpdateStatusModal
        open={isBulkUpdateStatusModalOpen}
        onClose={() => setBulkUpdateStatusModalOpen(false)}
        assetIds={selected}
        onSuccess={() => {
          setSnackbarMessage('Assets status updated successfully.');
          fetchAssets();
          setSelected([]);
        }}
      />
      <BulkUpdateLocationModal
        open={isBulkUpdateLocationModalOpen}
        onClose={() => setBulkUpdateLocationModalOpen(false)}
        assetIds={selected}
        onSuccess={() => {
          setSnackbarMessage('Assets location updated successfully.');
          fetchAssets();
          setSelected([]);
        }}
      />
    </Box>
  );
};

export default AssetListPage;
