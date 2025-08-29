import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../../../services/api';
import { Box, Typography } from '@mui/material';

const AssetStatusChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analyticsAPI.getAssetsByStatus();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch asset status data', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Assets by Status
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AssetStatusChart;
