import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import { Meter, LatestReading } from './types';
import MeterList from './components/MeterList';
import MeterReadings from './components/MeterReadings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [latestReadings, setLatestReadings] = useState<LatestReading[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);

  useEffect(() => {
    // Fetch meters
    const fetchMeters = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/meters');
        setMeters(response.data);
      } catch (error) {
        console.error('Error fetching meters:', error);
      }
    };

    fetchMeters();
  }, []);

  useEffect(() => {
    // Fetch latest readings periodically
    const fetchLatestReadings = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/readings/latest');
        setLatestReadings(response.data);
      } catch (error) {
        console.error('Error fetching latest readings:', error);
      }
    };

    fetchLatestReadings();
    const interval = setInterval(fetchLatestReadings, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
            Smart Meter Dashboard
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '80vh', overflow: 'auto' }}>
                <MeterList
                  meters={meters}
                  selectedMeter={selectedMeter}
                  onMeterSelect={setSelectedMeter}
                  latestReadings={latestReadings}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '80vh', overflow: 'auto' }}>
                <MeterReadings
                  selectedMeter={selectedMeter}
                  latestReadings={latestReadings}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
