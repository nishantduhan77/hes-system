import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  PowerSettingsNew as PowerIcon,
  NetworkPing as PingIcon,
  Circle as StatusIcon,
} from '@mui/icons-material';
import MeterDetails from '../components/meters/MeterDetails';
import { MeterEvent } from '../types/meter';

// Mock data - replace with actual API calls
const initialMeters = [
  {
    id: 'MTR001',
    meterId: 'MTR001',
    serialNumber: 'SN123456',
    manufacturer: 'ABB',
    ipAddress: '192.168.1.100',
    port: 4059,
    status: 'Connected',
    relayStatus: 'ON',
  },
  {
    id: 'MTR002',
    meterId: 'MTR002',
    serialNumber: 'SN123457',
    manufacturer: 'Schneider',
    ipAddress: '192.168.1.101',
    port: 4059,
    status: 'Disconnected',
    relayStatus: 'OFF',
  },
];

const MeterManagement: React.FC = () => {
  const [meters, setMeters] = useState(initialMeters);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<string | null>('MTR001');
  const [pingStatus, setPingStatus] = useState<Record<string, 'REACHABLE' | 'UNREACHABLE' | null>>({});
  const [loadingPing, setLoadingPing] = useState<Record<string, boolean>>({});
  const [loadingRelay, setLoadingRelay] = useState<Record<string, boolean>>({});
  const [newMeter, setNewMeter] = useState({
    meterId: '',
    serialNumber: '',
    manufacturer: '',
    ipAddress: '',
    port: '',
  });

  const handleConnect = (meterId: string) => {
    const meter = meters.find(m => m.meterId === meterId);
    if (meter) {
      const isConnecting = meter.status === 'Disconnected';
      
      // Update meter status and relay status
      setMeters(meters.map(m => 
        m.meterId === meterId 
          ? { 
              ...m, 
              status: isConnecting ? 'Connected' : 'Disconnected',
              // When disconnecting, force relay to OFF
              relayStatus: isConnecting ? m.relayStatus : 'OFF'
            }
          : m
      ));
      
      // Create and dispatch connection event
      const event: MeterEvent = {
        id: `${Date.now()}`,
        meterId,
        timestamp: new Date().toISOString(),
        eventCode: isConnecting ? 'E003' : 'E004',
        description: `Meter ${isConnecting ? 'Connected' : 'Disconnected'}${!isConnecting ? ' (Relay OFF)' : ''}`,
        severity: 'INFO',
        status: 'ACTIVE',
      };
      window.dispatchEvent(new CustomEvent('new-meter-event', { detail: event }));

      // If disconnecting, create a relay OFF event
      if (!isConnecting) {
        const relayEvent: MeterEvent = {
          id: `${Date.now() + 1}`,
          meterId,
          timestamp: new Date().toISOString(),
          eventCode: 'E008',
          description: 'Relay OFF due to meter disconnect',
          severity: 'INFO',
          status: 'ACTIVE',
        };
        window.dispatchEvent(new CustomEvent('new-meter-event', { detail: relayEvent }));
      }
    }
  };

  const simulatePingCommand = async (ipAddress: string): Promise<boolean> => {
    // Simulate ping command
    console.log(`Executing: ping -n 1 ${ipAddress}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Simulate 80% success rate for connected meters
    return Math.random() < 0.8;
  };

  const handlePing = async (meterId: string) => {
    setLoadingPing(prev => ({ ...prev, [meterId]: true }));
    const meter = meters.find(m => m.meterId === meterId);
    
    if (!meter) {
      setLoadingPing(prev => ({ ...prev, [meterId]: false }));
      return;
    }

    try {
      const isPingSuccessful = await simulatePingCommand(meter.ipAddress);
      const pingResult = isPingSuccessful ? 'REACHABLE' : 'UNREACHABLE';
      setPingStatus(prev => ({ ...prev, [meterId]: pingResult }));
      
      // Create and dispatch ping event
      const event: MeterEvent = {
        id: `${Date.now()}`,
        meterId,
        timestamp: new Date().toISOString(),
        eventCode: isPingSuccessful ? 'E005' : 'E006',
        description: `Meter ${pingResult}`,
        severity: isPingSuccessful ? 'INFO' : 'WARNING',
        status: 'ACTIVE',
      };
      window.dispatchEvent(new CustomEvent('new-meter-event', { detail: event }));
    } catch (error) {
      setPingStatus(prev => ({ ...prev, [meterId]: 'UNREACHABLE' }));
    } finally {
      setLoadingPing(prev => ({ ...prev, [meterId]: false }));
      
      // Clear ping status after 10 seconds
      setTimeout(() => {
        setPingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[meterId];
          return newStatus;
        });
      }, 10000);
    }
  };

  const simulateRelayCommand = async (ipAddress: string, command: 'ON' | 'OFF'): Promise<boolean> => {
    // Simulate relay command
    console.log(`Executing: relay_control ${ipAddress} --action ${command}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simulate 90% success rate for connected meters
    return Math.random() < 0.9;
  };

  const handleRelay = async (meterId: string) => {
    const meter = meters.find(m => m.meterId === meterId);
    if (!meter || meter.status === 'Disconnected') {
      return; // Don't allow relay control for disconnected meters
    }

    setLoadingRelay(prev => ({ ...prev, [meterId]: true }));
    
    try {
      const newStatus = meter.relayStatus === 'ON' ? 'OFF' : 'ON';
      const isSuccess = await simulateRelayCommand(meter.ipAddress, newStatus);
      
      if (isSuccess) {
        setMeters(meters.map(m => 
          m.meterId === meterId 
            ? { ...m, relayStatus: newStatus }
            : m
        ));
        
        // Create and dispatch relay event
        const event: MeterEvent = {
          id: `${Date.now()}`,
          meterId,
          timestamp: new Date().toISOString(),
          eventCode: newStatus === 'ON' ? 'E007' : 'E008',
          description: `Relay ${newStatus}`,
          severity: 'INFO',
          status: 'ACTIVE',
        };
        window.dispatchEvent(new CustomEvent('new-meter-event', { detail: event }));
      } else {
        throw new Error('Relay command failed');
      }
    } catch (error) {
      // Create and dispatch relay failure event
      const event: MeterEvent = {
        id: `${Date.now()}`,
        meterId,
        timestamp: new Date().toISOString(),
        eventCode: 'E009',
        description: 'Relay Control Failed',
        severity: 'WARNING',
        status: 'ACTIVE',
      };
      window.dispatchEvent(new CustomEvent('new-meter-event', { detail: event }));
    } finally {
      setLoadingRelay(prev => ({ ...prev, [meterId]: false }));
    }
  };

  const handleAddMeter = () => {
    const meter = {
      id: newMeter.meterId,
      ...newMeter,
      port: parseInt(newMeter.port),
      status: 'Disconnected',
      relayStatus: 'OFF' as const,
    };
    setMeters([...meters, meter]);
    setOpenDialog(false);
    setNewMeter({
      meterId: '',
      serialNumber: '',
      manufacturer: '',
      ipAddress: '',
      port: '',
    });
  };

  const columns: GridColDef[] = [
    { field: 'meterId', headerName: 'Meter ID', width: 130 },
    { field: 'serialNumber', headerName: 'Serial Number', width: 150 },
    { field: 'manufacturer', headerName: 'Manufacturer', width: 150 },
    { field: 'ipAddress', headerName: 'IP Address', width: 150 },
    { field: 'port', headerName: 'Port', width: 100 },
    { field: 'status', headerName: 'Status', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const isConnected = params.row.status === 'Connected';
        const pingResult = pingStatus[params.row.meterId];
        
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title={isConnected ? 'Disconnect' : 'Connect'}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnect(params.row.meterId);
                }}
                color={isConnected ? 'success' : 'error'}
                size="small"
              >
                <PowerIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={
              pingResult 
                ? `Status: ${pingResult}` 
                : "Ping Meter"
            }>
              <Badge
                color={pingResult === 'REACHABLE' ? 'success' : pingResult === 'UNREACHABLE' ? 'error' : 'default'}
                variant="dot"
                invisible={!pingResult}
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePing(params.row.meterId);
                  }}
                  color="primary"
                  size="small"
                  disabled={loadingPing[params.row.meterId]}
                >
                  {loadingPing[params.row.meterId] ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PingIcon />
                  )}
                </IconButton>
              </Badge>
            </Tooltip>

            <Tooltip title={`Relay ${params.row.relayStatus}`}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  icon={<StatusIcon fontSize="small" />}
                  label={`Relay ${params.row.relayStatus}`}
                  size="small"
                  color={params.row.relayStatus === 'ON' ? 'success' : 'error'}
                  sx={{ 
                    minWidth: '90px',
                    '& .MuiChip-icon': {
                      color: 'inherit'
                    }
                  }}
                />
              </Box>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Meter Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Meter
        </Button>
      </Box>

      {/* Meter Details with Graphs */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Meter Details - {selectedMeter}
        </Typography>
        <MeterDetails meterId={selectedMeter || 'MTR001'} />
      </Paper>

      {/* Meter List */}
      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={meters}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[10]}
          onRowClick={(params) => setSelectedMeter(params.row.meterId)}
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Meter</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Meter ID"
              value={newMeter.meterId}
              onChange={(e) =>
                setNewMeter({ ...newMeter, meterId: e.target.value })
              }
            />
            <TextField
              label="Serial Number"
              value={newMeter.serialNumber}
              onChange={(e) =>
                setNewMeter({ ...newMeter, serialNumber: e.target.value })
              }
            />
            <TextField
              label="Manufacturer"
              value={newMeter.manufacturer}
              onChange={(e) =>
                setNewMeter({ ...newMeter, manufacturer: e.target.value })
              }
            />
            <TextField
              label="IP Address"
              value={newMeter.ipAddress}
              onChange={(e) =>
                setNewMeter({ ...newMeter, ipAddress: e.target.value })
              }
            />
            <TextField
              label="Port"
              type="number"
              value={newMeter.port}
              onChange={(e) =>
                setNewMeter({ ...newMeter, port: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMeter} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeterManagement; 