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
  Grid as MuiGrid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import PowerIcon from '@mui/icons-material/Power';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import MeterEventService, { MeterEvent, INDIAN_EVENT_CODES } from '../../services/MeterEventService';
import MeterCommunicationService from '../../services/MeterCommunicationService';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(2),
}));

const Grid = styled(MuiGrid)(() => ({
  display: 'flex',
}));

interface Meter {
  id: string;
  serialNumber: string;
  manufacturer: string;
  ipAddress: string;
  port: number;
  status: 'CONNECTED' | 'DISCONNECTED';
  relayStatus?: 'ON' | 'OFF';
  lastPingResponse?: number;
  lastReading?: {
    timestamp: string;
    activeEnergyImport: number;
    voltage: number;
    current: number;
    frequency: number;
  };
  lastBilling?: BillingData;
  events?: MeterEvent[];
}

interface MeterReading {
  timestamp: string;
  value: number;
  obisCode: string;
}

// Indian OBIS Codes
const INDIAN_OBIS_CODES = {
  // Billing Data
  BILLING_ACTIVE_ENERGY_IMPORT: '1.0.1.8.1.255', // Current billing period import
  BILLING_ACTIVE_ENERGY_EXPORT: '1.0.2.8.1.255', // Current billing period export
  BILLING_REACTIVE_ENERGY_IMPORT: '1.0.3.8.1.255',
  BILLING_REACTIVE_ENERGY_EXPORT: '1.0.4.8.1.255',
  BILLING_MD_IMPORT: '1.0.1.6.1.255', // Maximum Demand Import
  BILLING_MD_EXPORT: '1.0.2.6.1.255', // Maximum Demand Export
  BILLING_PF: '1.0.13.7.1.255', // Power Factor
  BILLING_DATE: '0.0.96.11.1.255', // Last billing date

  // Instantaneous Parameters
  VOLTAGE_R: '1.0.32.7.0.255', // R Phase voltage
  VOLTAGE_Y: '1.0.52.7.0.255', // Y Phase voltage
  VOLTAGE_B: '1.0.72.7.0.255', // B Phase voltage
  CURRENT_R: '1.0.31.7.0.255', // R Phase current
  CURRENT_Y: '1.0.51.7.0.255', // Y Phase current
  CURRENT_B: '1.0.71.7.0.255', // B Phase current
  FREQUENCY: '1.0.14.7.0.255',
  POWER_FACTOR_R: '1.0.33.7.0.255',
  POWER_FACTOR_Y: '1.0.53.7.0.255',
  POWER_FACTOR_B: '1.0.73.7.0.255',

  // Daily Load Profile
  DAILY_ACTIVE_IMPORT: '1.0.1.8.0.255',
  DAILY_ACTIVE_EXPORT: '1.0.2.8.0.255',
  DAILY_REACTIVE_IMPORT: '1.0.3.8.0.255',
  DAILY_REACTIVE_EXPORT: '1.0.4.8.0.255',
  DAILY_PF: '1.0.13.7.0.255',

  // Events
  VOLTAGE_RELATED_EVENTS: '0.0.96.11.2.255',
  CURRENT_RELATED_EVENTS: '0.0.96.11.3.255',
  POWER_RELATED_EVENTS: '0.0.96.11.4.255',
  TRANSACTION_EVENTS: '0.0.96.11.5.255',
  OTHERS_EVENTS: '0.0.96.11.6.255',
  CONTROL_EVENTS: '0.0.96.11.7.255',
};

// Indian Event Types
const INDIAN_EVENT_TYPES = {
  VOLTAGE_HIGH: 'Over Voltage',
  VOLTAGE_LOW: 'Under Voltage',
  CURRENT_HIGH: 'Over Current',
  CURRENT_UNBALANCE: 'Current Unbalance',
  POWER_FAIL: 'Power Failure',
  NEUTRAL_DISTURBANCE: 'Neutral Disturbance',
  MAGNETIC_TAMPER: 'Magnetic Tamper',
  COVER_OPEN: 'Cover Open',
  LOAD_CONTROL: 'Load Control',
};

// Generate random meter data with Indian context
const generateRandomMeter = (index: number): Meter => {
  const manufacturers = ['L&T', 'Secure Meters', 'Genus', 'HPL', 'Elmeasure', 'Duke Meters'];
  const states = ['MH', 'DL', 'KA', 'TN', 'GJ', 'UP', 'MP', 'RJ'];
  const serialPrefix = states[Math.floor(Math.random() * states.length)];
  
  return {
    id: `METER_${Math.random().toString(36).substr(2, 9)}`,
    serialNumber: `${serialPrefix}${String(index + 1).padStart(8, '0')}`,
    manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
    ipAddress: `192.168.1.${100 + index}`,
    port: 4059,
    status: Math.random() > 0.3 ? 'CONNECTED' : 'DISCONNECTED',
    lastBilling: {
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      activeEnergyImport: Math.floor(Math.random() * 5000 + 10000), // 10000-15000 kWh
      maximumDemand: Math.random() * 20 + 40, // 40-60 kW
      powerFactor: Math.random() * 0.1 + 0.9, // 0.9-1.0
    },
    events: generateRandomEvents(),
  };
};

interface BillingData {
  date: string;
  activeEnergyImport: number;
  maximumDemand: number;
  powerFactor: number;
}

interface Event {
  timestamp: string;
  type: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

const generateRandomEvents = (): MeterEvent[] => {
  const events: MeterEvent[] = [];
  const now = new Date();
  const eventTypes = Object.values(INDIAN_EVENT_CODES);
  const severities: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];

  // Generate 1-5 random events
  const numEvents = Math.floor(Math.random() * 5) + 1;
  
  for (let i = 0; i < numEvents; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    events.push({
      meterId: `METER_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventType: eventType.description,
      eventCode: eventType.code,
      description: `${eventType.description} detected`,
      severity: eventType.severity,
      acknowledged: false
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockReadings = (obisCode: string): MeterReading[] => {
  const readings: MeterReading[] = [];
  const now = new Date();
  
  // Generate values based on OBIS code
  const generateValue = (obisCode: string): number => {
    switch (obisCode) {
      // Billing related
      case INDIAN_OBIS_CODES.BILLING_ACTIVE_ENERGY_IMPORT:
        return Math.random() * 5000 + 10000; // 10000-15000 kWh
      case INDIAN_OBIS_CODES.BILLING_MD_IMPORT:
        return Math.random() * 20 + 40; // 40-60 kW
      case INDIAN_OBIS_CODES.BILLING_PF:
        return Math.random() * 0.1 + 0.9; // 0.9-1.0

      // Instantaneous parameters
      case INDIAN_OBIS_CODES.VOLTAGE_R:
      case INDIAN_OBIS_CODES.VOLTAGE_Y:
      case INDIAN_OBIS_CODES.VOLTAGE_B:
        return Math.random() * 10 + 230; // 230-240V (Indian standard)
      case INDIAN_OBIS_CODES.CURRENT_R:
      case INDIAN_OBIS_CODES.CURRENT_Y:
      case INDIAN_OBIS_CODES.CURRENT_B:
        return Math.random() * 5 + 10; // 10-15A
      case INDIAN_OBIS_CODES.FREQUENCY:
        return Math.random() * 0.5 + 49.8; // 49.8-50.3Hz (Indian grid standard)
      case INDIAN_OBIS_CODES.POWER_FACTOR_R:
      case INDIAN_OBIS_CODES.POWER_FACTOR_Y:
      case INDIAN_OBIS_CODES.POWER_FACTOR_B:
        return Math.random() * 0.1 + 0.9; // 0.9-1.0

      // Daily load profile
      case INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT:
        return Math.random() * 100 + 300; // 300-400 kWh/day
      case INDIAN_OBIS_CODES.DAILY_REACTIVE_IMPORT:
        return Math.random() * 50 + 100; // 100-150 kVArh/day
      case INDIAN_OBIS_CODES.DAILY_PF:
        return Math.random() * 0.1 + 0.9; // 0.9-1.0

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

const MeterManagement = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [selectedObisCode, setSelectedObisCode] = useState(INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT);
  const [eventService] = useState(() => MeterEventService.getInstance());
  const [communicationService] = useState(() => MeterCommunicationService.getInstance());
  const [pingResults, setPingResults] = useState<Record<string, number>>({});

  // Check backend availability and initialize services
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

  // Subscribe to real-time events
  useEffect(() => {
    if (isBackendAvailable) {
      const unsubscribe = eventService.subscribeToEvents((event: MeterEvent) => {
        setMeters((prevMeters: Meter[]) =>
          prevMeters.map((meter: Meter) =>
            meter.id === event.meterId
              ? {
                  ...meter,
                  events: [event, ...(meter.events || [])].slice(0, 100), // Keep last 100 events
                }
              : meter
          )
        );
      });

      return () => unsubscribe();
    }
  }, [isBackendAvailable, eventService]);

  const handleConnect = async (meterId: string) => {
    if (!isBackendAvailable) {
      setMeters((prev: Meter[]) =>
        prev.map((meter: Meter) =>
          meter.id === meterId
            ? { ...meter, status: 'CONNECTED' }
            : meter
        )
      );
      return;
    }

    try {
      const meter = meters.find((m: Meter) => m.id === meterId);
      if (!meter) return;

      await communicationService.connect(meterId, meter.ipAddress, meter.port);
      setMeters((prev: Meter[]) =>
        prev.map((meter: Meter) =>
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
      setMeters((prev) =>
        prev.map((meter) =>
          meter.id === meterId
            ? { ...meter, status: 'DISCONNECTED' }
            : meter
        )
      );
      return;
    }

    try {
      await communicationService.disconnect(meterId);
      setMeters((prev) =>
        prev.map((meter) =>
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
    setReadings(generateMockReadings(selectedObisCode));
  };

  const handleGenerateMeters = () => {
    const newMeters = Array.from({ length: 10 }, (_, i) => generateRandomMeter(i));
    setMeters(newMeters);
  };

  const handleRefreshMeter = async (meterId: string) => {
    if (!isBackendAvailable) {
      if (selectedMeter?.id === meterId) {
        setReadings(generateMockReadings(selectedObisCode));
      }
      return;
    }

    try {
      const data = await communicationService.readMeterData(meterId, [selectedObisCode]);
      const newReading = {
        timestamp: new Date().toISOString(),
        value: data[selectedObisCode],
        obisCode: selectedObisCode,
      };
      setReadings((prev) => [...prev.slice(-29), newReading]);
    } catch (err) {
      setError('Failed to refresh meter readings');
    }
  };

  const handleDeleteMeter = (meterId: string) => {
    setMeters((prev: Meter[]) => prev.filter((meter: Meter) => meter.id !== meterId));
    if (selectedMeter?.id === meterId) {
      setSelectedMeter(null);
      setReadings([]);
    }
  };

  const handleRelayControl = async (meterId: string, action: 'ON' | 'OFF') => {
    try {
      await communicationService.controlRelay(meterId, action);
      setMeters((prev) =>
        prev.map((meter) =>
          meter.id === meterId
            ? { ...meter, relayStatus: action }
            : meter
        )
      );
    } catch (err) {
      setError('Failed to control relay');
    }
  };

  const handlePing = async (meterId: string) => {
    try {
      const responseTime = await communicationService.pingMeter(meterId);
      setPingResults((prev) => ({
        ...prev,
        [meterId]: responseTime
      }));
    } catch (err) {
      setError('Failed to ping meter');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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

      <Box sx={{ flexGrow: 1 }}>
        <MuiGrid container spacing={3}>
          <MuiGrid item xs={12}>
            <StyledPaper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Manufacturer</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Port</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Relay Status</TableCell>
                      <TableCell>Ping Response</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meters.map((meter: Meter) => (
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
                        <TableCell>
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: meter.relayStatus === 'ON' ? 'success.light' : 'error.light',
                              color: 'common.white',
                            }}
                          >
                            {meter.relayStatus || 'OFF'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {pingResults[meter.id] ? `${pingResults[meter.id]}ms` : '-'}
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
                              <>
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
                                <Tooltip title={meter.relayStatus === 'ON' ? 'Turn Relay OFF' : 'Turn Relay ON'}>
                                  <IconButton
                                    size="small"
                                    color={meter.relayStatus === 'ON' ? 'success' : 'error'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRelayControl(meter.id, meter.relayStatus === 'ON' ? 'OFF' : 'ON');
                                    }}
                                    sx={{ mr: 1 }}
                                  >
                                    <PowerIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Ping Meter">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePing(meter.id);
                                    }}
                                    sx={{ mr: 1 }}
                                  >
                                    <NetworkCheckIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
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
            </StyledPaper>
          </MuiGrid>

          {selectedMeter && (
            <>
              <MuiGrid item xs={12}>
                <StyledPaper>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Billing Data - {selectedMeter.serialNumber}
                    </Typography>
                  </Box>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Last Billing Date</TableCell>
                        <TableCell>Active Energy Import</TableCell>
                        <TableCell>Maximum Demand</TableCell>
                        <TableCell>Power Factor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{new Date(selectedMeter.lastBilling?.date || '').toLocaleDateString()}</TableCell>
                        <TableCell>{selectedMeter.lastBilling?.activeEnergyImport.toFixed(2)} kWh</TableCell>
                        <TableCell>{selectedMeter.lastBilling?.maximumDemand.toFixed(2)} kW</TableCell>
                        <TableCell>{selectedMeter.lastBilling?.powerFactor.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </StyledPaper>
              </MuiGrid>

              <MuiGrid item xs={12}>
                <StyledPaper>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Events - {selectedMeter.serialNumber}
                    </Typography>
                  </Box>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Severity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedMeter.events?.map((event: MeterEvent, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{event.eventType}</TableCell>
                          <TableCell>{event.description}</TableCell>
                          <TableCell>
                            <Box
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: 
                                  event.severity === 'HIGH' ? 'error.light' :
                                  event.severity === 'MEDIUM' ? 'warning.light' : 'success.light',
                                color: 'common.white',
                              }}
                            >
                              {event.severity}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </StyledPaper>
              </MuiGrid>

              <MuiGrid item xs={12}>
                <StyledPaper>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Real-time Readings - {selectedMeter.serialNumber}
                    </Typography>
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT)}
                        color={selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'primary' : 'inherit'}
                        sx={{ mr: 1 }}
                      >
                        Daily Energy
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.VOLTAGE_R)}
                        color={selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'primary' : 'inherit'}
                        sx={{ mr: 1 }}
                      >
                        R-Phase Voltage
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.CURRENT_R)}
                        color={selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'primary' : 'inherit'}
                        sx={{ mr: 1 }}
                      >
                        R-Phase Current
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.POWER_FACTOR_R)}
                        color={selectedObisCode === INDIAN_OBIS_CODES.POWER_FACTOR_R ? 'primary' : 'inherit'}
                        sx={{ mr: 1 }}
                      >
                        R-Phase PF
                      </Button>
                    </Box>
                  </Box>
                  <LineChart width={800} height={400} data={readings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(time: string) => {
                        const date = new Date(time);
                        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                      }}
                    />
                    <YAxis 
                      label={{ 
                        value: selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'kWh' :
                               selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'V' :
                               selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'A' : 'PF',
                        angle: -90,
                        position: 'insideLeft'
                      }}
                    />
                    <ChartTooltip
                      formatter={(value: any) => [
                        `${Number(value).toFixed(2)} ${
                          selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'kWh' :
                          selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'V' :
                          selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'A' : 'PF'
                        }`,
                        'Value'
                      ]}
                      labelFormatter={(label: any) => new Date(String(label)).toLocaleTimeString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      name={
                        selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'Daily Energy' :
                        selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'R-Phase Voltage' :
                        selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'R-Phase Current' : 'R-Phase Power Factor'
                      }
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </StyledPaper>
              </MuiGrid>
            </>
          )}
        </MuiGrid>
      </Box>
    </Box>
  );
};

export default MeterManagement; 