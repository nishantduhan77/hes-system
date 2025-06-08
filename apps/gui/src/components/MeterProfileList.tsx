import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
    IconButton,
    Tooltip
} from '@mui/material';
import { Info as InfoIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { MeterProfile, fetchMeterProfiles, fetchMeterList } from '../services/api';

interface MeterProfileListProps {
    compact?: boolean;
    refreshInterval?: number; // in milliseconds
}

export const MeterProfileList: React.FC<MeterProfileListProps> = ({ 
    compact = false,
    refreshInterval = 30000 
}) => {
    const [profiles, setProfiles] = useState<MeterProfile[]>([]);
    const [selectedMeter, setSelectedMeter] = useState<string>('');
    const [meterList, setMeterList] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    const loadProfiles = async () => {
        if (loading) return;
        
        try {
            setLoading(true);
            const profileData = await fetchMeterProfiles();
            // Filter profiles for selected meter if one is selected
            const filteredProfiles = selectedMeter
                ? profileData.filter(profile => profile.meterNumber === selectedMeter)
                : profileData;
            setProfiles(filteredProfiles);
            setError(null);
        } catch (err) {
            setError('Failed to load meter profiles');
            console.error('Error loading meter profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMeterList();
    }, []);

    useEffect(() => {
        loadProfiles();
        const interval = setInterval(loadProfiles, refreshInterval);
        return () => clearInterval(interval);
    }, [selectedMeter, refreshInterval]);

    const handleMeterChange = (event: SelectChangeEvent<string>) => {
        setSelectedMeter(event.target.value);
    };

    const handleRefresh = () => {
        loadProfiles();
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    // Group profiles by meter number and get the latest reading for each type
    const groupedProfiles = profiles.reduce((acc: { [key: string]: { [key: string]: MeterProfile } }, profile) => {
        if (!acc[profile.meterNumber]) {
            acc[profile.meterNumber] = {};
        }
        
        // Only keep the latest reading for each type
        if (!acc[profile.meterNumber][profile.profileType] || 
            new Date(acc[profile.meterNumber][profile.profileType].timestamp) < new Date(profile.timestamp)) {
            acc[profile.meterNumber][profile.profileType] = profile;
        }
        
        return acc;
    }, {});

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Meter Profiles
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error ? (
                <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
            ) : (
                <TableContainer>
                    <Table size={compact ? "small" : "medium"}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Meter Number</TableCell>
                                <TableCell>Profile Type</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell>Last Updated</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(groupedProfiles).map(([meterNumber, profileTypes]) => (
                                Object.values(profileTypes).map((profile) => (
                                    <TableRow key={`${profile.id}`}>
                                        <TableCell>{profile.meterNumber}</TableCell>
                                        <TableCell>{profile.profileType}</TableCell>
                                        <TableCell>{profile.readingValue.toFixed(2)}</TableCell>
                                        <TableCell>{profile.unit}</TableCell>
                                        <TableCell>{formatTimestamp(profile.timestamp)}</TableCell>
                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton size="small">
                                                    <InfoIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ))}
                            {Object.keys(groupedProfiles).length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body2" color="textSecondary">
                                            No profiles found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
}; 