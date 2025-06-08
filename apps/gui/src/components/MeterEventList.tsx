import React, { useState, useEffect } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Typography,
    Chip,
    Box,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { MeterEvent, fetchMeterEvents, fetchMeterList } from '../services/api';

interface MeterEventListProps {
    compact?: boolean;
    refreshInterval?: number; // in milliseconds
}

export const MeterEventList: React.FC<MeterEventListProps> = ({ 
    compact = false,
    refreshInterval = 30000 
}) => {
    const [events, setEvents] = useState<MeterEvent[]>([]);
    const [selectedMeter, setSelectedMeter] = useState<string>('');
    const [meterList, setMeterList] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadMeterList = async () => {
        try {
            const meters = await fetchMeterList();
            setMeterList(meters);
            if (meters.length > 0 && !selectedMeter) {
                setSelectedMeter(meters[0]);
            }
        } catch (err) {
            setError('Failed to load meter list');
            console.error('Error loading meter list:', err);
        }
    };

    const loadEvents = async () => {
        try {
            const eventData = await fetchMeterEvents();
            // Filter events for selected meter if one is selected
            const filteredEvents = selectedMeter
                ? eventData.filter(event => event.meterNumber === selectedMeter)
                : eventData;
            setEvents(filteredEvents);
            setError(null);
        } catch (err) {
            setError('Failed to load meter events');
            console.error('Error loading meter events:', err);
        }
    };

    useEffect(() => {
        loadMeterList();
    }, []);

    useEffect(() => {
        loadEvents();
        const interval = setInterval(loadEvents, refreshInterval);
        return () => clearInterval(interval);
    }, [selectedMeter, refreshInterval]);

    const handleMeterChange = (event: SelectChangeEvent<string>) => {
        setSelectedMeter(event.target.value);
    };

    const getEventIcon = (severity: 'INFO' | 'WARNING' | 'ERROR') => {
        switch (severity) {
            case 'ERROR':
                return <ErrorIcon color="error" />;
            case 'WARNING':
                return <WarningIcon color="warning" />;
            case 'INFO':
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getEventColor = (severity: 'INFO' | 'WARNING' | 'ERROR'): "error" | "warning" | "info" => {
        switch (severity) {
            case 'ERROR':
                return 'error';
            case 'WARNING':
                return 'warning';
            case 'INFO':
            default:
                return 'info';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Meter Events
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                    <Select
                        value={selectedMeter}
                        onChange={handleMeterChange}
                        displayEmpty
                    >
                        <MenuItem value="">All Meters</MenuItem>
                        {meterList.map(meter => (
                            <MenuItem key={meter} value={meter}>
                                Meter {meter}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {error ? (
                <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
            ) : (
                <List dense={compact}>
                    {events.length === 0 ? (
                        <ListItem>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" color="textSecondary">
                                        No events found
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ) : (
                        events.map((event) => (
                            <ListItem
                                key={event.id}
                                divider
                            >
                                <ListItemIcon>
                                    {getEventIcon(event.severity)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant={compact ? "body2" : "body1"}>
                                                {event.description}
                                            </Typography>
                                            <Chip
                                                label={event.eventType}
                                                size="small"
                                                color={getEventColor(event.severity)}
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Typography variant="caption">
                                                Meter: {event.meterNumber}
                                            </Typography>
                                            <Typography variant="caption">
                                                {formatTimestamp(event.timestamp)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))
                    )}
                </List>
            )}
        </Paper>
    );
}; 