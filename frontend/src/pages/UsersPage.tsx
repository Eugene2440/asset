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
import { usersAPI } from '../services/api.ts';
import { User } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import AddUserModal from '../components/modals/AddUserModal.tsx';
import EditUserModal from '../components/modals/EditUserModal.tsx';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(id);
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete user');
      }
    }
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
        <Typography variant="h4" gutterBottom>
          Users
        </Typography>
        {loggedInUser?.role === 'admin' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
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
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Active</TableCell>
              {loggedInUser?.role === 'admin' && <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{user.name}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{user.location?.name || 'N/A'}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{user.is_active ? 'Yes' : 'No'}</TableCell>
                {loggedInUser?.role === 'admin' && (
                  <TableCell sx={{ padding: '8px' }}>
                    <IconButton onClick={() => handleOpenEdit(user)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(user.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AddUserModal open={openAdd} onClose={handleCloseAdd} onUserAdded={handleUserModified} />
      {selectedUser && (
        <EditUserModal open={openEdit} onClose={handleCloseEdit} onEdit={handleUserModified} user={selectedUser} />
      )}
    </Box>
  );
};

export default UsersPage;
