import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress as MuiCircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { wsService } from '../../services/websocket';
import { MeterReading } from '../../types/meter';

interface RealTimeMeterReadingsProps {
  meterId: string;
}

interface ReadingsByType {
  timestamp: string;
  power: number;
  voltage: number;
  current: number;
}

const RealTimeMeterReadings: React.FC<RealTimeMeterReadingsProps> = ({
  meterId,
}) => {
  const [readings, setReadings] = useState<ReadingsByType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleReading = (reading: MeterReading) => {
      if (reading.meterId === meterId) {
        // Convert the single reading value into separate metrics based on unit
        const newReading: ReadingsByType = {
          timestamp: reading.timestamp,
          power: reading.unit === 'kW' ? reading.value : 0,
          voltage: reading.unit === 'V' ? reading.value : 230, // Default voltage if not provided
          current: reading.unit === 'A' ? reading.value : 0,
        };

        setReadings((prev) => {
          const newReadings = [...prev, newReading];
          // Keep last 50 readings
          return newReadings.slice(-50);
        });
        setLoading(false);
      }
    };

    wsService.subscribe('METER_READING', handleReading);

    return () => {
      wsService.unsubscribe('METER_READING', handleReading);
    };
  }, [meterId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <MuiCircularProgress />
      </Box>
    );
  }

  const latestReading = readings[readings.length - 1];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Real-time Readings - Meter {meterId}
        </Typography>
        <Grid container spacing={2}>
          <Grid xs={12}>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) => format(new Date(time), 'HH:mm:ss')}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(time) =>
                      format(new Date(time), 'yyyy-MM-dd HH:mm:ss')
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="voltage"
                    stroke="#8884d8"
                    name="Voltage (V)"
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="#82ca9d"
                    name="Current (A)"
                  />
                  <Line
                    type="monotone"
                    dataKey="power"
                    stroke="#ffc658"
                    name="Power (kW)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid xs={12} sm={4}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Latest Values
              </Typography>
              {latestReading && (
                <>
                  <Typography>
                    Voltage: {latestReading.voltage.toFixed(2)} V
                  </Typography>
                  <Typography>
                    Current: {latestReading.current.toFixed(2)} A
                  </Typography>
                  <Typography>
                    Power: {latestReading.power.toFixed(2)} kW
                  </Typography>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RealTimeMeterReadings; 