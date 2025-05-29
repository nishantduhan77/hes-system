import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { styled } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

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

interface MeterManagementProps {
  onMeterSelect: (meter: Meter) => void;
}

// Mock data for development
const mockMeters: Meter[] = [
  {
    id: '1',
    serialNumber: 'METER001',
    manufacturer: 'ABB',
    ipAddress: '192.168.1.100',
    port: 8080,
    status: 'CONNECTED',
  },
  {
    id: '2',
    serialNumber: 'METER002',
    manufacturer: 'Schneider',
    ipAddress: '192.168.1.101',
    port: 8080,
    status: 'DISCONNECTED',
  },
];

const generateMockReadings = (): MeterReading[] => {
  const readings: MeterReading[] = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    readings.push({
      timestamp: new Date(now.getTime() - i * 60000).toISOString(),
      value: Math.random() * 100 + 200, // Random value between 200-300
    });
  }
  return readings.reverse();
};

const MeterManagement: React.FC<MeterManagementProps> = ({ onMeterSelect }) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);

  // Check backend availability
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/health');
        setIsBackendAvailable(response.ok);
      } catch (err) {
        setIsBackendAvailable(false);
      }
      setLoading(false);
    };

    checkBackend();
  }, []);

  // Load mock or real data based on backend availability
  useEffect(() => {
    if (!isBackendAvailable) {
      setMeters(mockMeters);
      setReadings(generateMockReadings());
      setLoading(false);
      return;
    }

    const fetchMeters = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/meters');
        const data = await response.json();
        setMeters(data);
      } catch (err) {
        setError('Failed to fetch meters');
        setMeters(mockMeters); // Fallback to mock data
      }
      setLoading(false);
    };

    fetchMeters();
  }, [isBackendAvailable]);

  // Simulate real-time updates when backend is not available
  useEffect(() => {
    if (!isBackendAvailable && selectedMeter) {
      const interval = setInterval(() => {
        setReadings(prev => {
          const newReading = {
            timestamp: new Date().toISOString(),
            value: Math.random() * 100 + 200,
          };
          return [...prev.slice(1), newReading];
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isBackendAvailable, selectedMeter]);

  const handleConnect = async (meterId: string) => {
    if (!isBackendAvailable) {
      setMeters(prev =>
        prev.map(meter =>
          meter.id === meterId
            ? { ...meter, status: 'CONNECTED' }
            : meter
        )
      );
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/meters/${meterId}/connect`, {
        method: 'POST',
      });
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
    if (!isBackendAvailable) {
      setMeters(prev =>
        prev.map(meter =>
          meter.id === meterId
            ? { ...meter, status: 'DISCONNECTED' }
            : meter
        )
      );
      return;
    }

    try {
      await fetch(`http://localhost:8080/api/meters/${meterId}/disconnect`, {
        method: 'POST',
      });
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

  const handleMeterClick = (meter: Meter) => {
    setSelectedMeter(meter);
    onMeterSelect(meter);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Meter Management
      </Typography>

      {!isBackendAvailable && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Running in development mode with mock data. Backend services are not available.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Item>
            <TableContainer>
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
                      onClick={() => handleMeterClick(meter)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(meter.id);
                            }}
                          >
                            Connect
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(meter.id);
                            }}
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
          </Item>
        </Grid>

        {selectedMeter && (
          <Grid xs={12}>
            <Item sx={{ mt: 2 }}>
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
            </Item>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MeterManagement; 