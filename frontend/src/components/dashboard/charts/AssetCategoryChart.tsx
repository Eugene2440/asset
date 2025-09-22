import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../../../services/api.ts';
import { Box, Typography } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AssetCategoryChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get assets by type first, fallback to category
        let result;
        try {
          result = await analyticsAPI.getAssetsByType();
        } catch (error) {
          console.log('Assets by type endpoint not available, trying category');
          result = await analyticsAPI.getAssetsByCategory();
        }
        setData(result);
      } catch (error) {
        console.error('Failed to fetch asset data', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ height: 300 }}>
      <Typography variant="h6" gutterBottom>
        Assets by Type
      </Typography>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="asset_type"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AssetCategoryChart;
