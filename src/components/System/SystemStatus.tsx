import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const SystemStatus: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        System Status
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Service Health</Typography>
            <Typography>Coming soon...</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">System Metrics</Typography>
            <Typography>Coming soon...</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemStatus; 