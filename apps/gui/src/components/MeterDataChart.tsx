import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { MeterData, fetchMeterData, fetchMeterList } from '../services/api';

interface MeterDataChartProps {
    refreshInterval?: number; // in milliseconds
}

export const MeterDataChart: React.FC<MeterDataChartProps> = ({ refreshInterval = 30000 }) => {
    const [data, setData] = useState<MeterData[]>([]);
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

    const loadData = async () => {
        if (!selectedMeter) return;

        try {
            // Get data for the last 24 hours
            const endDate = new Date().toISOString();
            const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            const meterData = await fetchMeterData(selectedMeter, startDate, endDate);
            setData(meterData);
            setError(null);
        } catch (err) {
            setError('Failed to load meter data');
            console.error('Error loading meter data:', err);
        }
    };

    useEffect(() => {
        loadMeterList();
    }, []);

    useEffect(() => {
        if (selectedMeter) {
            loadData();
            const interval = setInterval(loadData, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [selectedMeter, refreshInterval]);

    const handleMeterChange = (event: SelectChangeEvent<string>) => {
        setSelectedMeter(event.target.value);
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    // Group data by reading type
    const groupedData = data.reduce((acc: { [key: string]: any }[], item) => {
        const existingPoint = acc.find(point => point.timestamp === item.timestamp);
        if (existingPoint) {
            existingPoint[item.readingType] = item.value;
        } else {
            const newPoint = {
                timestamp: item.timestamp,
                [item.readingType]: item.value
            };
            acc.push(newPoint);
        }
        return acc;
    }, []);

    // Get unique reading types
    const readingTypes = Array.from(new Set(data.map(item => item.readingType)));

    // Define colors for different reading types
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#af19ff'];

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Real-time Meter Readings
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                    <Select
                        value={selectedMeter}
                        onChange={handleMeterChange}
                        displayEmpty
                    >
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
                <Box sx={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={groupedData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatTimestamp}
                                interval="preserveStartEnd"
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={formatTimestamp}
                                formatter={(value: number) => [value.toFixed(2)]}
                            />
                            <Legend />
                            {readingTypes.map((type, index) => (
                                <Line
                                    key={type}
                                    type="monotone"
                                    dataKey={type}
                                    stroke={colors[index % colors.length]}
                                    name={`${type} (${data.find(d => d.readingType === type)?.unit || ''})`}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
}; 