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
  TextField,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { usersAPI } from '../services/api.ts';
import { User } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.tsx';
import AddUserModal from '../components/modals/AddUserModal.tsx';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: loggedInUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleUserAdded = () => {
    fetchUsers();
    setOpenAdd(false);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setSelectedUser(null);
    setOpenEdit(false);
  };

  const handleUserModified = () => {
    fetchUsers();
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.deleteUser(userToDelete.id);
      setOpenDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
      setOpenDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteConfirm(false);
    setUserToDelete(null);
  };

  const filteredUsers = users
    .filter((user) => user.role !== 'admin')
    .filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          Users
        </Typography>
        {loggedInUser?.role === 'admin' && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon sx={{ fontSize: '1rem' }} />} 
            onClick={handleOpenAdd}
            size="small"
            sx={{ 
              fontSize: '0.75rem', 
              padding: '4px 12px',
              minWidth: 'auto',
              height: '32px'
            }}
          >
            Add User
          </Button>
        )}
      </Box>

      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
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
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Location</TableCell>
              {loggedInUser?.role === 'admin' && <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{user.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{user.location?.name || 'N/A'}</TableCell>
                {loggedInUser?.role === 'admin' && (
                  <TableCell sx={{ padding: '8px' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleOpenEdit(user)}
                      sx={{ mr: 1, fontSize: '0.65rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => handleDeleteClick(user)}
                      sx={{ fontSize: '0.65rem' }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AddUserModal
        open={openAdd}
        onClose={handleCloseAdd}
        onUserAdded={handleUserAdded}
      />

      <DeleteConfirmationModal
        open={openDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name}?`}
      />
    </Box>
  );
};

export default UsersPage;
