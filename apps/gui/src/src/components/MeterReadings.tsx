import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { MeterReading, LatestReading } from '../types';

interface MeterReadingsProps {
  selectedMeter: string | null;
  latestReadings: LatestReading[];
}

const MeterReadings: React.FC<MeterReadingsProps> = ({
  selectedMeter,
  latestReadings,
}) => {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const latestReading = latestReadings.find(r => r.meter_code === selectedMeter);

  useEffect(() => {
    const fetchReadings = async () => {
      if (selectedMeter) {
        try {
          const response = await axios.get(`http://localhost:3001/api/meters/${selectedMeter}/readings`);
          setReadings(response.data);
        } catch (error) {
          console.error('Error fetching readings:', error);
        }
      }
    };

    fetchReadings();
    const interval = setInterval(fetchReadings, 5000);

    return () => clearInterval(interval);
  }, [selectedMeter]);

  if (!selectedMeter) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Select a meter to view readings
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Meter Readings
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Import Power
              </Typography>
              <Typography variant="h4">
                {latestReading?.active_power_import.toFixed(1)}W
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Export Power
              </Typography>
              <Typography variant="h4">
                {latestReading?.active_power_export.toFixed(1)}W
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Voltage
              </Typography>
              <Typography variant="h4">
                {latestReading?.voltage_r_phase.toFixed(1)}V
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Current
              </Typography>
              <Typography variant="h4">
                {latestReading?.current_r_phase.toFixed(1)}A
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ height: 400 }}>
        <Typography variant="h6" gutterBottom>
          Power Consumption History
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={readings}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number) => [`${value.toFixed(1)}W`, 'Power']}
            />
            <Line
              type="monotone"
              dataKey="active_power_import"
              stroke="#8884d8"
              name="Import Power"
            />
            <Line
              type="monotone"
              dataKey="active_power_export"
              stroke="#82ca9d"
              name="Export Power"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default MeterReadings; 