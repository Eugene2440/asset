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
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link, useNavigate } from 'react-router-dom';
import { assetsAPI, locationsAPI } from '../services/api.ts';
import { Asset } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useResponsiveRowsPerPage } from '../hooks/useResponsiveRowsPerPage.ts';
import TransferAssetModal from '../components/modals/TransferAssetModal.tsx';
import AllocateDeviceModal from '../components/modals/AllocateDeviceModal.tsx';
import BulkUpdateStatusModal from '../components/modals/BulkUpdateStatusModal.tsx';
import BulkUpdateLocationModal from '../components/modals/BulkUpdateLocationModal.tsx';

const AssetListPage = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Asset | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterAssetType, setFilterAssetType] = useState('');
  const [locations, setLocations] = useState([]);
  const [assetModels, setAssetModels] = useState([]);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isAllocateModalOpen, setAllocateModalOpen] = useState(false);
  const [isBulkUpdateStatusModalOpen, setBulkUpdateStatusModalOpen] = useState(false);
  const [isBulkUpdateLocationModalOpen, setBulkUpdateLocationModalOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const { defaultRowsPerPage, rowsPerPageOptions } = useResponsiveRowsPerPage();
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [totalCount, setTotalCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const fetchAssets = async (retries = 0) => {
    const maxRetries = 3;
    
    try {
      // Only show main loading on initial load or when no assets exist
      if (assets.length === 0) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      if (retries > 0) {
        setIsRetrying(true);
      }
      
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
      
      const data = await assetsAPI.getAssets(params);
      setAssets(data.assets);
      setTotalCount(data.total_count);
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch assets';
      
      if (retries < maxRetries && (err.code === 'NETWORK_ERROR' || err.response?.status >= 500)) {
        // Retry on network errors or server errors
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        setTimeout(() => {
          fetchAssets(retries + 1);
        }, delay);
        setRetryCount(retries + 1);
      } else {
        setError(errorMessage);
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    // Load assets immediately
    fetchAssets();
  }, [page, rowsPerPage]);

  // Separate effect for search and filter changes with debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAssets();
    }, 300); // Reduced debounce for faster search response

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, sortBy, sortOrder, filterStatus, filterLocation, filterAssetType]);

  // Lazy load filter data only when needed
  useEffect(() => {
    const fetchFilterData = async () => {
      if (filtersLoaded) return;
      
      try {
        const [locationsData, assetModelsData] = await Promise.all([
          locationsAPI.getLocations(),
          assetsAPI.getAssetModels(),
        ]);
        setLocations(locationsData);
        setAssetModels(assetModelsData);
        setFiltersLoaded(true);
      } catch (error) {
        console.error("Failed to fetch filter data", error);
        // Don't fail the entire page for filter data errors
        // Just log and continue with empty filters
      }
    };

    // Only fetch filter data when user interacts with filters
    if (!filtersLoaded && (filterLocation || filterAssetType)) {
      fetchFilterData();
    }
  }, [filterLocation, filterAssetType, filtersLoaded]);

  // Load filter data on component mount but don't block initial asset loading
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchFilterData = async () => {
        if (filtersLoaded) return;
        
        try {
          const [locationsData, assetModelsData] = await Promise.all([
            locationsAPI.getLocations(),
            assetsAPI.getAssetModels(),
          ]);
          setLocations(locationsData);
          setAssetModels(assetModelsData);
          setFiltersLoaded(true);
        } catch (error) {
          console.error("Failed to fetch filter data", error);
          // Don't fail the entire page for filter data errors
        }
      };
      fetchFilterData();
    }, 1000); // Load after 1 second delay to prioritize asset loading

    return () => clearTimeout(timer);
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterLocation('');
    setFilterAssetType('');
    setSortBy('');
    setSortOrder('');
    setPage(0);
    setSelected([]);
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

  const renderSkeletonRows = () => {
    return Array.from({ length: rowsPerPage }, (_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell padding="checkbox" sx={{ padding: '4px' }}>
          <Skeleton variant="rectangular" width={16} height={16} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={80} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={120} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={90} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={100} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={80} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={110} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={100} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={90} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="text" width={80} />
        </TableCell>
        <TableCell sx={{ padding: '4px 8px' }}>
          <Skeleton variant="circular" width={20} height={20} />
        </TableCell>
      </TableRow>
    ));
  };

  if (loading && assets.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 500 }}>
          Asset List
        </Typography>
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchAssets()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 500 }}>
        Asset List
        {searchLoading && (
          <CircularProgress 
            size={16} 
            sx={{ ml: 1, verticalAlign: 'middle' }}
          />
        )}
        {isRetrying && (
          <Typography component="span" sx={{ ml: 1, fontSize: '0.8rem', color: 'orange' }}>
            Retrying... (Attempt {retryCount + 1})
          </Typography>
        )}
      </Typography>
      <Toolbar sx={{ 
        pl: { sm: 1 }, 
        pr: { xs: 1, sm: 1 }, 
        mb: 1.5, 
        minHeight: '48px',
        alignItems: 'center'
      }}>
        <TextField
          label="Search by Username"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searchLoading ? (
                  <CircularProgress size={14} />
                ) : (
                  <SearchIcon sx={{ fontSize: '1rem' }} />
                )}
              </InputAdornment>
            ),
            style: { fontSize: '0.75rem', height: '32px' }
          }}
          InputLabelProps={{
            style: { fontSize: '0.75rem' }
          }}
          sx={{ 
            mr: 1.5, 
            width: '220px',
            '& .MuiOutlinedInput-root': {
              height: '32px',
              fontSize: '0.75rem'
            }
          }}
        />
        <FormControl size="small" sx={{ 
          mr: 1.5, 
          minWidth: 90,
          '& .MuiOutlinedInput-root': {
            height: '32px',
            fontSize: '0.75rem'
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem'
          }
        }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={handleFilterStatusChange}
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
            <MenuItem value="In-service" sx={{ fontSize: '0.75rem' }}>In-service</MenuItem>
            <MenuItem value="Retired" sx={{ fontSize: '0.75rem' }}>Retired</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ 
          mr: 1.5, 
          minWidth: 100,
          '& .MuiOutlinedInput-root': {
            height: '32px',
            fontSize: '0.75rem'
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem'
          }
        }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Location</InputLabel>
          <Select
            value={filterLocation}
            label="Location"
            onChange={handleFilterLocationChange}
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
            {locations.map((location: any) => (
              <MenuItem key={location.id} value={location.id} sx={{ fontSize: '0.75rem' }}>
                {location.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ 
          mr: 1.5, 
          minWidth: 110,
          '& .MuiOutlinedInput-root': {
            height: '32px',
            fontSize: '0.75rem'
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem'
          }
        }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Asset Type</InputLabel>
          <Select
            value={filterAssetType}
            label="Asset Type"
            onChange={handleFilterAssetTypeChange}
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All</MenuItem>
            {[...new Set(assetModels.map((model: any) => model.asset_type))].map((assetType: string) => (
              <MenuItem key={assetType} value={assetType} sx={{ fontSize: '0.75rem' }}>
                {assetType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          size="small"
          sx={{
            mr: 1.5,
            height: '32px',
            fontSize: '0.7rem',
            padding: '4px 8px',
            minWidth: '90px',
            borderColor: '#ccc',
            color: '#666',
            '&:hover': {
              borderColor: '#999',
              color: '#333'
            }
          }}
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
        {selected.length > 0 && (
          <Button 
            variant="contained" 
            size="small"
            sx={{ 
              mr: 1.5, 
              height: '32px',
              fontSize: '0.7rem',
              padding: '4px 8px',
              minWidth: '80px'
            }} 
            onClick={() => setBulkUpdateStatusModalOpen(true)}
          >
            Update Status
          </Button>
        )}
        {selected.length > 0 && (
          <Button 
            variant="contained" 
            size="small"
            sx={{ 
              height: '32px',
              fontSize: '0.7rem',
              padding: '4px 8px',
              minWidth: '80px'
            }}
            onClick={() => setBulkUpdateLocationModalOpen(true)}
          >
            Update Location
          </Button>
        )}
      </Toolbar>
      <Box sx={{ 
        overflowX: 'auto',
        width: '100%',
        '& .MuiTableCell-root': {
          whiteSpace: 'nowrap',
          paddingTop: '4px',
          paddingBottom: '4px'
        },
        '& .MuiCheckbox-root': {
          padding: '2px',
          '& .MuiSvgIcon-root': {
            fontSize: '1rem'
          }
        }
      }}>
        <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1400 }} aria-label="asset table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ padding: '4px', width: '40px' }}>
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < assets.length}
                  checked={assets.length > 0 && selected.length === assets.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all assets' }}
                  sx={{ 
                    padding: '2px',
                    '& .MuiSvgIcon-root': { 
                      fontSize: '1rem' 
                    }
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '4px 8px', width: '80px' }}>Tag No</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '4px 8px', width: '140px' }}>Serial Number</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '4px 8px', width: '100px' }}>OS Version</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', width: '120px', wordWrap: 'break-word' }}>Asset Type</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', width: '120px', wordWrap: 'break-word' }}>Asset Make</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', width: '150px', wordWrap: 'break-word' }}>Asset Model</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', width: '140px', wordWrap: 'break-word' }}>Location</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', width: '120px', wordWrap: 'break-word' }}>User</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '4px 8px', width: '90px' }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '4px 8px', width: '70px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? renderSkeletonRows() : assets.map((asset) => {
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
                <TableCell padding="checkbox" sx={{ padding: '4px' }}>
                  <Checkbox
                    checked={isItemSelected}
                    inputProps={{ 'aria-labelledby': `enhanced-table-checkbox-${asset.id}` }}
                    sx={{ 
                      padding: '2px',
                      '& .MuiSvgIcon-root': { 
                        fontSize: '1rem' 
                      }
                    }}
                  />
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}>
                  {asset.tag_no}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}>{asset.serial_number}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}>{asset.os_version}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', wordWrap: 'break-word', maxWidth: '120px' }}>
                  {asset.category || asset.asset_type || (asset.model && !asset.category && !asset.asset_type ? asset.model.split('-')[0] : '')}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', wordWrap: 'break-word', maxWidth: '120px' }}>
                  {asset.brand || asset.asset_make || (asset.model && !asset.brand && !asset.asset_make ? asset.model.split('-')[1] : '')}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', wordWrap: 'break-word', maxWidth: '150px' }}>
                  {asset.asset_model || asset.model}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', wordWrap: 'break-word', maxWidth: '140px' }}>{asset.location?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', wordWrap: 'break-word', maxWidth: '120px' }}>{asset.assigned_user?.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap' }}>{asset.status}</TableCell>
                <TableCell sx={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                  <IconButton
                    aria-label="more"
                    onClick={(event) => handleMenuClick(event, asset)}
                    size="small"
                    sx={{ padding: '4px' }}
                  >
                    <MoreVertIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={open && selectedAsset?.id === asset.id}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        '& .MuiMenuItem-root': {
                          fontSize: '0.75rem',
                          minHeight: '32px',
                          padding: '4px 12px'
                        }
                      }
                    }}
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
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      </Box>
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
