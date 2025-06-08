import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { MeterReading, MeterEvent, INDIAN_OBIS_CODES } from '../../types/meter';

interface MeterDetailsProps {
  meterId: string;
  onNewEvent?: (event: MeterEvent) => void;
}

// Mock data generator
const generateMockReadings = (meterId: string): MeterReading[] => {
  const readings: MeterReading[] = [];
  const now = new Date();
  
  Object.entries(INDIAN_OBIS_CODES)
    .filter(([_, code]) => code.category === 'INSTANTANEOUS')
    .forEach(([code, details]) => {
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 3600000).toISOString();
        let value: number;
        
        switch (details.unit) {
          case 'V':
            value = 230 + Math.random() * 10 - 5; // 230V ± 5V
            break;
          case 'A':
            value = 5 + Math.random() * 2 - 1; // 5A ± 1A
            break;
          case 'kW':
            value = 2 + Math.random() * 1 - 0.5; // 2kW ± 0.5kW
            break;
          default:
            value = 0;
        }
        
        readings.push({
          id: `${meterId}-${code}-${i}`,
          meterId,
          timestamp,
          value,
          unit: details.unit,
          status: 'VALID',
          obisCode: code,
        });
      }
    });
  
  return readings;
};

const generateMockEvents = (meterId: string): MeterEvent[] => {
  return [
    {
      id: '1',
      meterId,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      eventCode: 'E001',
      description: 'Power Failure',
      severity: 'CRITICAL',
      status: 'CLEARED',
      clearTime: new Date().toISOString(),
    },
    {
      id: '2',
      meterId,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      eventCode: 'E002',
      description: 'Voltage High',
      severity: 'WARNING',
      status: 'ACTIVE',
    },
  ];
};

const MeterDetails: React.FC<MeterDetailsProps> = ({ meterId, onNewEvent }) => {
  const [tabValue, setTabValue] = useState(0);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [events, setEvents] = useState<MeterEvent[]>([]);

  useEffect(() => {
    // In a real application, these would be API calls
    setReadings(generateMockReadings(meterId));
    setEvents(generateMockEvents(meterId));
  }, [meterId]);

  // Add new events to the list
  useEffect(() => {
    if (onNewEvent) {
      const handleNewEvent = (event: MeterEvent) => {
        setEvents(prevEvents => [event, ...prevEvents]);
      };
      // Subscribe to new events
      window.addEventListener('new-meter-event', (e: any) => handleNewEvent(e.detail));
      return () => {
        window.removeEventListener('new-meter-event', (e: any) => handleNewEvent(e.detail));
      };
    }
  }, [onNewEvent]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatReadingsForChart = (obisCode: string) => {
    return readings
      .filter((reading) => reading.obisCode === obisCode)
      .map((reading) => ({
        timestamp: format(new Date(reading.timestamp), 'HH:mm'),
        value: reading.value,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Instantaneous Values" />
          <Tab label="Events" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Grid container spacing={2}>
          {Object.entries(INDIAN_OBIS_CODES)
            .filter(([_, code]) => code.category === 'INSTANTANEOUS')
            .map(([code, details]) => (
              <Grid item xs={12} md={6} key={code}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {details.description}
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formatReadingsForChart(code)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name={`${details.description} (${details.unit})`}
                            stroke="#8884d8"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Events
            </Typography>
            {events.map((event) => (
              <Box
                key={event.id}
                sx={{
                  p: 2,
                  mb: 1,
                  border: 1,
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  bgcolor:
                    event.severity === 'CRITICAL'
                      ? 'error.light'
                      : event.severity === 'WARNING'
                      ? 'warning.light'
                      : 'info.light',
                }}
              >
                <Typography variant="subtitle1">
                  {event.description} ({event.eventCode})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Started: {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </Typography>
                {event.clearTime && (
                  <Typography variant="body2" color="text.secondary">
                    Cleared: {format(new Date(event.clearTime), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      event.status === 'ACTIVE' ? 'error.main' : 'success.main',
                  }}
                >
                  Status: {event.status}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MeterDetails; 