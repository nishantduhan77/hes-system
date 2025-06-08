import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { Meter, LatestReading } from '../types';

interface MeterListProps {
  meters: Meter[];
  selectedMeter: string | null;
  onMeterSelect: (meterId: string) => void;
  latestReadings: LatestReading[];
}

const MeterList: React.FC<MeterListProps> = ({
  meters,
  selectedMeter,
  onMeterSelect,
  latestReadings,
}) => {
  const getLatestReading = (meterCode: string) => {
    return latestReadings.find(reading => reading.meter_code === meterCode);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Meters ({meters.length})
      </Typography>
      <List>
        {meters.map((meter) => {
          const latestReading = getLatestReading(meter.meter_code);
          return (
            <ListItem
              key={meter.meter_id}
              disablePadding
              sx={{ mb: 1 }}
            >
              <ListItemButton
                selected={selectedMeter === meter.meter_id}
                onClick={() => onMeterSelect(meter.meter_id)}
                sx={{ 
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {meter.meter_code}
                      </Typography>
                      <Chip
                        label={meter.status}
                        size="small"
                        color={meter.status === 'CONNECTED' ? 'success' : 'error'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block">
                        {meter.location} - {meter.manufacturer}
                      </Typography>
                      {latestReading && (
                        <Typography variant="body2" color="text.secondary">
                          Power: {latestReading.active_power_import.toFixed(1)}W
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );
};

export default MeterList; 