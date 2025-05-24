import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
  CircularProgress,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Meter {
  id: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  status: string;
  lastReading?: {
    timestamp: string;
    value: number;
  };
}

interface MeterReading {
  timestamp: string;
  value: number;
}

const MeterManagement: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - replace with actual API call
    const mockMeters: Meter[] = [
      {
        id: '1',
        serialNumber: 'M001',
        manufacturer: 'Acme',
        model: 'Smart-100',
        status: 'Connected',
        lastReading: {
          timestamp: new Date().toISOString(),
          value: 45.6,
        },
      },
      {
        id: '2',
        serialNumber: 'M002',
        manufacturer: 'Acme',
        model: 'Smart-100',
        status: 'Disconnected',
      },
    ];

    setMeters(mockMeters);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedMeter) {
      // Simulated readings - replace with actual API call
      const mockReadings: MeterReading[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        value: Math.random() * 100,
      }));

      setReadings(mockReadings);
    }
  }, [selectedMeter]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Meter Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Reading</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meters.map((meter) => (
                  <TableRow
                    key={meter.id}
                    hover
                    onClick={() => setSelectedMeter(meter)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{meter.serialNumber}</TableCell>
                    <TableCell>{meter.manufacturer}</TableCell>
                    <TableCell>{meter.model}</TableCell>
                    <TableCell>{meter.status}</TableCell>
                    <TableCell>
                      {meter.lastReading
                        ? `${meter.lastReading.value} kWh at ${new Date(
                            meter.lastReading.timestamp
                          ).toLocaleString()}`
                        : 'No reading'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {selectedMeter && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Real-time Readings - {selectedMeter.serialNumber}
              </Typography>
              <Box sx={{ height: 300 }}>
                <LineChart
                  width={800}
                  height={300}
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
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                    formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Energy']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Energy Consumption"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MeterManagement; 