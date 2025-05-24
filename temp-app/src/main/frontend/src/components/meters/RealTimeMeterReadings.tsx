import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
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
import { format } from 'date-fns';
import { wsService } from '../../services/websocket';
import { MeterReading } from '../../types/meter';

interface RealTimeMeterReadingsProps {
  meterId: string;
}

const RealTimeMeterReadings: React.FC<RealTimeMeterReadingsProps> = ({
  meterId,
}) => {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleReading = (reading: MeterReading) => {
      if (reading.meterId === meterId) {
        setReadings((prev) => {
          const newReadings = [...prev, reading];
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Real-time Readings - Meter {meterId}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
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
                    dataKey="frequency"
                    stroke="#ffc658"
                    name="Frequency (Hz)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Latest Values
            </Typography>
            {readings.length > 0 && (
              <>
                <Typography>
                  Voltage: {readings[readings.length - 1].voltage.toFixed(2)} V
                </Typography>
                <Typography>
                  Current: {readings[readings.length - 1].current.toFixed(2)} A
                </Typography>
                <Typography>
                  Frequency: {readings[readings.length - 1].frequency.toFixed(2)} Hz
                </Typography>
              </>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RealTimeMeterReadings; 