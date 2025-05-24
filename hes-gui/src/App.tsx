import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { blue, grey } from '@mui/material/colors';

// Components will be moved to separate files later
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import SettingsSystemDaydreamIcon from '@mui/icons-material/SettingsSystemDaydream';

// Create theme
const theme = createTheme({
  palette: {
    primary: blue,
    background: {
      default: grey[100]
    }
  }
});

// Placeholder components (will be moved to separate files)
const Dashboard = () => (
  <Box p={3}>
    <Typography variant="h4">Dashboard</Typography>
    <Typography variant="body1">Welcome to HES System Dashboard</Typography>
  </Box>
);

const MeterManagement = () => (
  <Box p={3}>
    <Typography variant="h4">Meter Management</Typography>
    <Typography variant="body1">Manage your smart meters here</Typography>
  </Box>
);

const SystemStatus = () => (
  <Box p={3}>
    <Typography variant="h4">System Status</Typography>
    <Typography variant="body1">Monitor system health and performance</Typography>
  </Box>
);

const DRAWER_WIDTH = 240;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          {/* Sidebar */}
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
              },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                <ListItem button component="a" href="/">
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component="a" href="/meters">
                  <ListItemIcon>
                    <DeviceHubIcon />
                  </ListItemIcon>
                  <ListItemText primary="Meter Management" />
                </ListItem>
                <ListItem button component="a" href="/system">
                  <ListItemIcon>
                    <SettingsSystemDaydreamIcon />
                  </ListItemIcon>
                  <ListItemText primary="System Status" />
                </ListItem>
              </List>
            </Box>
          </Drawer>

          {/* Main content */}
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
              <Toolbar>
                <Typography variant="h6" noWrap component="div">
                  HES System
                </Typography>
              </Toolbar>
            </AppBar>
            <Toolbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/meters" element={<MeterManagement />} />
              <Route path="/system" element={<SystemStatus />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
