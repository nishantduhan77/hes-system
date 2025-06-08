import React from 'react';
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
import { Paper, Typography, Box } from '@mui/material';
import { MeterProfile } from '../types/meter';

interface MeterDataChartProps {
    data: MeterProfile[];
}

export const MeterDataChart: React.FC<MeterDataChartProps> = ({ data }) => {
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const chartData = data.map(profile => ({
        timestamp: profile.timestamp.getTime(),
        energy: profile.energy,
        power: profile.power,
        voltage: profile.voltage,
        current: profile.current
    }));

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Real-time Meter Readings
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={chartData}
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
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                            labelFormatter={formatTimestamp}
                            formatter={(value: number) => [value.toFixed(2)]}
                        />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="power"
                            stroke="#8884d8"
                            name="Power (kW)"
                            dot={false}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="energy"
                            stroke="#82ca9d"
                            name="Energy (kWh)"
                            dot={false}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="voltage"
                            stroke="#ffc658"
                            name="Voltage (V)"
                            dot={false}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="current"
                            stroke="#ff7300"
                            name="Current (A)"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}; 