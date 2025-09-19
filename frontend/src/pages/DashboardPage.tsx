import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { DashboardStats } from '../types';
import { analyticsAPI } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import AdminDashboard from '../components/dashboard/AdminDashboard.tsx';
import UserDashboard from '../components/dashboard/UserDashboard.tsx';
import AddAssetModal from '../components/modals/AddAssetModal.tsx';
import AddLocationModal from '../components/modals/AddLocationModal.tsx';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const [addAssetModalOpen, setAddAssetModalOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addLocationModalOpen, setAddLocationModalOpen] = useState(false);

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

  return (
    <Box>
      {isAdmin && stats ? (
        <AdminDashboard
          stats={stats}
          onAddAsset={() => setAddAssetModalOpen(true)}
          onAddUser={() => setAddUserModalOpen(true)}
          onAddLocation={() => setAddLocationModalOpen(true)}
        />
      ) : (
        <UserDashboard />
      )}

      <AddAssetModal
        open={addAssetModalOpen}
        onClose={() => setAddAssetModalOpen(false)}
        onAssetAdded={() => {
          // Optionally refresh data
        }}
      />
  
      <AddLocationModal
        open={addLocationModalOpen}
        onClose={() => setAddLocationModalOpen(false)}
        onLocationAdded={() => {
          // Optionally refresh data
        }}
      />
    </Box>
  );
}
