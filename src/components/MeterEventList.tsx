import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Typography,
    Chip,
    Box
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { MeterEvent } from '../types/meter';

interface MeterEventListProps {
    events: MeterEvent[];
    compact?: boolean;
}

export const MeterEventList: React.FC<MeterEventListProps> = ({ events, compact = false }) => {
    const getEventIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'info':
                return <InfoIcon color="info" />;
            case 'success':
                return <SuccessIcon color="success" />;
            default:
                return <InfoIcon />;
        }
    };

    const getEventColor = (severity: string): "error" | "warning" | "info" | "success" => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return 'error';
            case 'warning':
                return 'warning';
            case 'success':
                return 'success';
            default:
                return 'info';
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Paper>
            <List dense={compact}>
                {events.map((event) => (
                    <ListItem
                        key={`${event.meterId}-${event.timestamp}-${event.type}`}
                        divider
                    >
                        <ListItemIcon>
                            {getEventIcon(event.severity)}
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant={compact ? "body2" : "body1"}>
                                        {event.message}
                                    </Typography>
                                    <Chip
                                        label={event.type}
                                        size="small"
                                        color={getEventColor(event.severity)}
                                        variant="outlined"
                                    />
                                </Box>
                            }
                            secondary={
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Typography variant="caption">
                                        Meter ID: {event.meterId}
                                    </Typography>
                                    <Typography variant="caption">
                                        {formatTimestamp(event.timestamp)}
                                    </Typography>
                                </Box>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}; 