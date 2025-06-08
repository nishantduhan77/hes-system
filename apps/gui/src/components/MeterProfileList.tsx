import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { MeterProfile } from '../types/meter';

interface MeterProfileListProps {
    profiles: MeterProfile[];
    compact?: boolean;
}

export const MeterProfileList: React.FC<MeterProfileListProps> = ({ profiles, compact = false }) => {
    const formatTimestamp = (timestamp: Date) => {
        return new Date(timestamp).toLocaleString();
    };

    const getQualityColor = (quality: string): "success" | "warning" | "error" => {
        switch (quality.toLowerCase()) {
            case 'good':
                return 'success';
            case 'questionable':
                return 'warning';
            default:
                return 'error';
        }
    };

    return (
        <TableContainer component={Paper}>
            <Table size={compact ? "small" : "medium"}>
                <TableHead>
                    <TableRow>
                        <TableCell>Meter ID</TableCell>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Energy (kWh)</TableCell>
                        <TableCell>Power (kW)</TableCell>
                        <TableCell>Voltage (V)</TableCell>
                        <TableCell>Current (A)</TableCell>
                        <TableCell>Quality</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {profiles.map((profile) => (
                        <TableRow key={`${profile.meterId}-${profile.timestamp}`}>
                            <TableCell>{profile.meterId}</TableCell>
                            <TableCell>{formatTimestamp(profile.timestamp)}</TableCell>
                            <TableCell>{profile.energy.toFixed(2)}</TableCell>
                            <TableCell>{profile.power.toFixed(2)}</TableCell>
                            <TableCell>{profile.voltage.toFixed(1)}</TableCell>
                            <TableCell>{profile.current.toFixed(2)}</TableCell>
                            <TableCell>
                                <Chip
                                    label={profile.quality}
                                    color={getQualityColor(profile.quality)}
                                    size={compact ? "small" : "medium"}
                                />
                            </TableCell>
                            <TableCell>
                                <Tooltip title="View Details">
                                    <IconButton size="small">
                                        <InfoIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}; 