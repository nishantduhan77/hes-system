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
  Alert,
} from '@mui/material';
import { useQuery } from '../hooks/useQuery';
import { format } from 'date-fns';
import { SystemStatus as SystemStatusType, SystemEvent } from '../types/meter';

const Grid = MuiGrid as React.ComponentType<any>;

const getResourceColor = (value: number) => {
  if (value > 80) return 'error';
  if (value > 60) return 'warning';
  return 'primary';
};

const SystemStatus: React.FC = () => {
  const { data: systemInfo, isLoading: isLoadingStatus, error: statusError } = useQuery<SystemStatusType>(
    'systemStatus',
    () => fetch('/api/system/status').then(res => res.json())
  );

  const { data: events, isLoading: isLoadingEvents, error: eventsError } = useQuery<SystemEvent[]>(
    'systemEvents',
    () => fetch('/api/system/events').then(res => res.json())
  );

  if (isLoadingStatus || isLoadingEvents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statusError || eventsError) {
    return <Alert severity="error">Failed to load system status</Alert>;
  }

  const systemLoad = systemInfo?.systemLoad || 0;
  const memoryUsage = systemInfo?.memoryUsage || 0;

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
                  secondary={systemInfo?.status}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="System Uptime"
                  secondary={systemInfo?.uptime}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Backup"
                  secondary={systemInfo?.lastBackup ? format(new Date(systemInfo.lastBackup), 'PPpp') : '-'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Active Connections"
                  secondary={`${systemInfo?.activeConnections} / ${systemInfo?.totalMeters} meters`}
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
              <Grid item xs={6}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={systemLoad}
                    size={80}
                    color={getResourceColor(systemLoad)}
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
                      {`${systemLoad}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography align="center">CPU</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={memoryUsage}
                    size={80}
                    color={getResourceColor(memoryUsage)}
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
                      {`${memoryUsage}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography align="center">Memory</Typography>
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
              {events?.map((event) => (
                <ListItem key={event.id}>
                  <ListItemText
                    primary={event.description}
                    secondary={format(new Date(event.timestamp), 'PPpp')}
                    sx={{
                      color:
                        event.type === 'WARNING'
                          ? 'warning.main'
                          : event.type === 'ERROR'
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