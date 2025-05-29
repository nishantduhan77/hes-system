import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid as MuiGrid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';

const Grid = MuiGrid as React.ComponentType<any>;

// Mock data - replace with actual API calls
const systemInfo = {
  status: 'Healthy',
  uptime: '5 days, 2 hours',
  lastBackup: '2024-03-20 03:00 AM',
  activeConnections: 142,
  cpuUsage: 45,
  memoryUsage: 62,
  diskUsage: 38,
};

const recentEvents = [
  {
    id: 1,
    timestamp: '2024-03-20 10:15 AM',
    event: 'Meter MTR045 connected successfully',
    type: 'info',
  },
  {
    id: 2,
    timestamp: '2024-03-20 10:10 AM',
    event: 'System backup completed',
    type: 'success',
  },
  {
    id: 3,
    timestamp: '2024-03-20 10:05 AM',
    event: 'Connection timeout for meter MTR032',
    type: 'warning',
  },
];

const SystemStatus: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        System Status
      </Typography>

      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="System Status"
                  secondary={systemInfo.status}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="System Uptime"
                  secondary={systemInfo.uptime}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Backup"
                  secondary={systemInfo.lastBackup}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Active Connections"
                  secondary={systemInfo.activeConnections}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* System Resources */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Resources
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={systemInfo.cpuUsage}
                    size={80}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div">
                      {`${systemInfo.cpuUsage}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography align="center">CPU</Typography>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={systemInfo.memoryUsage}
                    size={80}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div">
                      {`${systemInfo.memoryUsage}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography align="center">Memory</Typography>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={systemInfo.diskUsage}
                    size={80}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div">
                      {`${systemInfo.diskUsage}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography align="center">Disk</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Events */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Events
            </Typography>
            <List>
              {recentEvents.map((event) => (
                <ListItem key={event.id}>
                  <ListItemText
                    primary={event.event}
                    secondary={event.timestamp}
                    sx={{
                      color:
                        event.type === 'warning'
                          ? 'warning.main'
                          : event.type === 'error'
                          ? 'error.main'
                          : 'inherit',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemStatus; 