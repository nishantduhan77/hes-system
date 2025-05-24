import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Meter {
  id: string;
  serialNumber: string;
  manufacturer: string;
  ipAddress: string;
  port: number;
  status: 'CONNECTED' | 'DISCONNECTED';
  lastReading?: {
    timestamp: string;
    activeEnergyImport: number;
    voltage: number;
    current: number;
    frequency: number;
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
  const [error, setError] = useState<string | null>(null);

  // Simulated WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/meters/readings');
    
    ws.onmessage = (event) => {
      const reading = JSON.parse(event.data);
      setReadings(prev => [...prev, reading].slice(-30)); // Keep last 30 readings
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
    };

    return () => ws.close();
  }, []);

  // Simulated API call to fetch meters
  useEffect(() => {
    const fetchMeters = async () => {
      try {
        // Replace with actual API call
        const response = await fetch('http://localhost:8080/api/meters');
        const data = await response.json();
        setMeters(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch meters');
        setLoading(false);
      }
    };

    fetchMeters();
  }, []);

  const handleConnect = async (meterId: string) => {
    try {
      await fetch(`http://localhost:8080/api/meters/${meterId}/connect`, {
        method: 'POST',
      });
      // Update meter status in state
      setMeters(prev =>
        prev.map(meter =>
          meter.id === meterId
            ? { ...meter, status: 'CONNECTED' }
            : meter
        )
      );
    } catch (err) {
      setError('Failed to connect to meter');
    }
  };

  const handleDisconnect = async (meterId: string) => {
    try {
      await fetch(`http://localhost:8080/api/meters/${meterId}/disconnect`, {
        method: 'POST',
      });
      // Update meter status in state
      setMeters(prev =>
        prev.map(meter =>
          meter.id === meterId
            ? { ...meter, status: 'DISCONNECTED' }
            : meter
        )
      );
    } catch (err) {
      setError('Failed to disconnect from meter');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Meter Management</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meters.map((meter) => (
                  <TableRow 
                    key={meter.id}
                    onClick={() => setSelectedMeter(meter)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{meter.serialNumber}</TableCell>
                    <TableCell>{meter.manufacturer}</TableCell>
                    <TableCell>{meter.ipAddress}</TableCell>
                    <TableCell>{meter.port}</TableCell>
                    <TableCell>{meter.status}</TableCell>
                    <TableCell>
                      {meter.status === 'DISCONNECTED' ? (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleConnect(meter.id)}
                        >
                          Connect
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDisconnect(meter.id)}
                        >
                          Disconnect
                        </Button>
                      )}
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
              <LineChart width={800} height={400} data={readings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MeterManagement; 