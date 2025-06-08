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
import PowerIcon from '@mui/icons-material/Power';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import { meterService } from '../../services/meterService';

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

interface Meter {
  meter_id: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  installation_date: string;
  firmware_version: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  last_communication: string;
}

interface MeterReading {
  timestamp: string;
  active_power_import: number;
  active_power_export: number;
  voltage_r_phase: number;
  current_r_phase: number;
}

const MeterManagement: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeters = async () => {
    try {
      const data = await meterService.getMeters();
      setMeters(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch meters');
      setLoading(false);
    }
  };

  const fetchReadings = async (meterId: string) => {
    try {
      const data = await meterService.getMeterReadings(meterId);
      setReadings(data);
    } catch (err) {
      setError('Failed to fetch readings');
    }
  };

  useEffect(() => {
    fetchMeters();
  }, []);

  useEffect(() => {
    if (selectedMeter) {
      fetchReadings(selectedMeter.meter_id);
      const interval = setInterval(() => {
        fetchReadings(selectedMeter.meter_id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMeter]);

  const handleConnect = async (meterId: string) => {
    try {
      await meterService.connectMeter(meterId);
      setMeters(prev =>
        prev.map(meter =>
          meter.meter_id === meterId
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
      await meterService.disconnectMeter(meterId);
      setMeters(prev =>
        prev.map(meter =>
          meter.meter_id === meterId
            ? { ...meter, status: 'DISCONNECTED' }
            : meter
        )
      );
    } catch (err) {
      setError('Failed to disconnect meter');
    }
  };

  const handleRefresh = () => {
    fetchMeters();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              Meter Management
            </Typography>
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Grid>
        
        <Grid xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Installation Date</TableCell>
                  <TableCell>Firmware Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Communication</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meters.map((meter) => (
                  <TableRow
                    key={meter.meter_id}
                    hover
                    onClick={() => setSelectedMeter(meter)}
                    selected={selectedMeter?.meter_id === meter.meter_id}
                  >
                    <TableCell>{meter.serial_number}</TableCell>
                    <TableCell>{meter.manufacturer}</TableCell>
                    <TableCell>{meter.model}</TableCell>
                    <TableCell>{new Date(meter.installation_date).toLocaleString()}</TableCell>
                    <TableCell>{meter.firmware_version}</TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor:
                            meter.status === 'CONNECTED'
                              ? 'success.light'
                              : 'error.light',
                          color: 'white',
                        }}
                      >
                        {meter.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(meter.last_communication).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {meter.status === 'DISCONNECTED' ? (
                        <Tooltip title="Connect">
                          <IconButton
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(meter.meter_id);
                            }}
                          >
                            <PowerIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Disconnect">
                          <IconButton
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(meter.meter_id);
                            }}
                          >
                            <PowerOffIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {selectedMeter && readings.length > 0 && (
          <Grid xs={12}>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Real-time Readings for {selectedMeter.serial_number}
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <LineChart
                  width={1000}
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
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="active_power_import"
                    name="Active Power Import (W)"
                    stroke="#8884d8"
                  />
                  <Line
                    type="monotone"
                    dataKey="voltage_r_phase"
                    name="Voltage (V)"
                    stroke="#82ca9d"
                  />
                  <Line
                    type="monotone"
                    dataKey="current_r_phase"
                    name="Current (A)"
                    stroke="#ffc658"
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