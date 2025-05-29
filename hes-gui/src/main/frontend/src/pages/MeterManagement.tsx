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
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';

// Mock data - replace with actual API calls
const initialMeters = [
  {
    id: 1,
    meterId: 'MTR001',
    serialNumber: 'SN123456',
    manufacturer: 'ABB',
    ipAddress: '192.168.1.100',
    port: 4059,
    status: 'Connected',
  },
  {
    id: 2,
    meterId: 'MTR002',
    serialNumber: 'SN123457',
    manufacturer: 'Schneider',
    ipAddress: '192.168.1.101',
    port: 4059,
    status: 'Disconnected',
  },
];

const columns: GridColDef[] = [
  { field: 'meterId', headerName: 'Meter ID', width: 130 },
  { field: 'serialNumber', headerName: 'Serial Number', width: 150 },
  { field: 'manufacturer', headerName: 'Manufacturer', width: 150 },
  { field: 'ipAddress', headerName: 'IP Address', width: 150 },
  { field: 'port', headerName: 'Port', width: 100 },
  { field: 'status', headerName: 'Status', width: 130 },
];

const MeterManagement: React.FC = () => {
  const [meters, setMeters] = useState(initialMeters);
  const [openDialog, setOpenDialog] = useState(false);
  const [newMeter, setNewMeter] = useState({
    meterId: '',
    serialNumber: '',
    manufacturer: '',
    ipAddress: '',
    port: '',
  });

  const handleAddMeter = () => {
    const meter = {
      id: meters.length + 1,
      ...newMeter,
      port: parseInt(newMeter.port),
      status: 'Disconnected',
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

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
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

      <Paper sx={{ height: 600, width: '100%' }}>
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
          checkboxSelection
          disableRowSelectionOnClick
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