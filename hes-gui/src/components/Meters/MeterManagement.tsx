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
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { styled } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';

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
  obisCode: string;
}

interface MeterManagementProps {
  onMeterSelect: (meter: Meter) => void;
}

// Indian OBIS Codes
const INDIAN_OBIS_CODES = {
  ACTIVE_ENERGY_IMPORT: '1.0.1.8.0.255',
  ACTIVE_ENERGY_EXPORT: '1.0.2.8.0.255',
  REACTIVE_ENERGY_IMPORT: '1.0.3.8.0.255',
  REACTIVE_ENERGY_EXPORT: '1.0.4.8.0.255',
  VOLTAGE_L1: '1.0.32.7.0.255',
  CURRENT_L1: '1.0.31.7.0.255',
  FREQUENCY: '1.0.14.7.0.255',
  POWER_FACTOR: '1.0.13.7.0.255',
};

// Generate random meter data with Indian context
const generateRandomMeter = (index: number): Meter => {
  const manufacturers = ['L&T', 'Secure Meters', 'Genus', 'HPL'];
  const states = ['MH', 'DL', 'KA', 'TN', 'GJ'];
  const serialPrefix = states[Math.floor(Math.random() * states.length)];
  
  return {
    id: `METER_${Math.random().toString(36).substr(2, 9)}`,
    serialNumber: `${serialPrefix}${String(index + 1).padStart(8, '0')}`,
    manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
    ipAddress: `192.168.1.${100 + index}`,
    port: 4059,
    status: Math.random() > 0.3 ? 'CONNECTED' : 'DISCONNECTED',
  };
};

const generateMockReadings = (obisCode: string): MeterReading[] => {
  const readings: MeterReading[] = [];
  const now = new Date();
  
  // Generate values based on OBIS code
  const generateValue = (obisCode: string): number => {
    switch (obisCode) {
      case INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT:
        return Math.random() * 1000 + 5000; // 5000-6000 kWh
      case INDIAN_OBIS_CODES.VOLTAGE_L1:
        return Math.random() * 10 + 230; // 230-240V
      case INDIAN_OBIS_CODES.CURRENT_L1:
        return Math.random() * 5 + 10; // 10-15A
      case INDIAN_OBIS_CODES.FREQUENCY:
        return Math.random() * 0.5 + 49.8; // 49.8-50.3Hz
      default:
        return Math.random() * 100;
    }
  };

  for (let i = 0; i < 30; i++) {
    readings.push({
      timestamp: new Date(now.getTime() - i * 60000).toISOString(),
      value: generateValue(obisCode),
      obisCode,
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
  const [selectedObisCode, setSelectedObisCode] = useState(INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT);

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

  // Generate initial meters if none exist
  useEffect(() => {
    if (!isBackendAvailable && meters.length === 0) {
      const initialMeters = Array.from({ length: 10 }, (_, i) => generateRandomMeter(i));
      setMeters(initialMeters);
      setLoading(false);
    }
  }, [isBackendAvailable, meters.length]);

  // Simulate real-time updates when backend is not available
  useEffect(() => {
    if (!isBackendAvailable && selectedMeter) {
      const interval = setInterval(() => {
        setReadings(generateMockReadings(selectedObisCode));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isBackendAvailable, selectedMeter, selectedObisCode]);

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
    setReadings(generateMockReadings(selectedObisCode));
  };

  const handleGenerateMeters = () => {
    const newMeters = Array.from({ length: 10 }, (_, i) => generateRandomMeter(i));
    setMeters(newMeters);
  };

  const handleRefreshMeter = (meterId: string) => {
    if (selectedMeter?.id === meterId) {
      setReadings(generateMockReadings(selectedObisCode));
    }
  };

  const handleDeleteMeter = (meterId: string) => {
    setMeters(prev => prev.filter(meter => meter.id !== meterId));
    if (selectedMeter?.id === meterId) {
      setSelectedMeter(null);
      setReadings([]);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Meter Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleGenerateMeters}
        >
          Generate 10 Test Meters
        </Button>
      </Box>

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
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meters.map((meter) => (
                    <TableRow 
                      key={meter.id}
                      onClick={() => handleMeterClick(meter)}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedMeter?.id === meter.id ? 'action.selected' : 'inherit',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <TableCell>{meter.serialNumber}</TableCell>
                      <TableCell>{meter.manufacturer}</TableCell>
                      <TableCell>{meter.ipAddress}</TableCell>
                      <TableCell>{meter.port}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: meter.status === 'CONNECTED' ? 'success.light' : 'error.light',
                            color: 'common.white',
                          }}
                        >
                          {meter.status}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          {meter.status === 'DISCONNECTED' ? (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnect(meter.id);
                              }}
                              sx={{ mr: 1 }}
                            >
                              Connect
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnect(meter.id);
                              }}
                              sx={{ mr: 1 }}
                            >
                              Disconnect
                            </Button>
                          )}
                          <Tooltip title="Refresh Readings">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshMeter(meter.id);
                              }}
                              sx={{ mr: 1 }}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Configure">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement meter configuration
                              }}
                              sx={{ mr: 1 }}
                            >
                              <SettingsIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeter(meter.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Real-time Readings - {selectedMeter.serialNumber}
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT)}
                    color={selectedObisCode === INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT ? 'primary' : 'inherit'}
                    sx={{ mr: 1 }}
                  >
                    Active Energy
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.VOLTAGE_L1)}
                    color={selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_L1 ? 'primary' : 'inherit'}
                    sx={{ mr: 1 }}
                  >
                    Voltage
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.CURRENT_L1)}
                    color={selectedObisCode === INDIAN_OBIS_CODES.CURRENT_L1 ? 'primary' : 'inherit'}
                    sx={{ mr: 1 }}
                  >
                    Current
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.FREQUENCY)}
                    color={selectedObisCode === INDIAN_OBIS_CODES.FREQUENCY ? 'primary' : 'inherit'}
                  >
                    Frequency
                  </Button>
                </Box>
              </Box>
              <LineChart width={800} height={400} data={readings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={(time) => {
                    const date = new Date(time);
                    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                  }}
                />
                <YAxis 
                  label={{ 
                    value: selectedObisCode === INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT ? 'kWh' :
                           selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_L1 ? 'V' :
                           selectedObisCode === INDIAN_OBIS_CODES.CURRENT_L1 ? 'A' : 'Hz',
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />
                <ChartTooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)} ${
                      selectedObisCode === INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT ? 'kWh' :
                      selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_L1 ? 'V' :
                      selectedObisCode === INDIAN_OBIS_CODES.CURRENT_L1 ? 'A' : 'Hz'
                    }`,
                    'Value'
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  name={
                    selectedObisCode === INDIAN_OBIS_CODES.ACTIVE_ENERGY_IMPORT ? 'Active Energy' :
                    selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_L1 ? 'Voltage' :
                    selectedObisCode === INDIAN_OBIS_CODES.CURRENT_L1 ? 'Current' : 'Frequency'
                  }
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </Item>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MeterManagement; 