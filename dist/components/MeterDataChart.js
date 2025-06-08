"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterDataChart = void 0;
const react_1 = __importDefault(require("react"));
const recharts_1 = require("recharts");
const material_1 = require("@mui/material");
const MeterDataChart = ({ data }) => {
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };
    const chartData = data.map(profile => ({
        timestamp: profile.timestamp.getTime(),
        energy: profile.energy,
        power: profile.power,
        voltage: profile.voltage,
        current: profile.current
    }));
    return (<material_1.Paper sx={{ p: 2 }}>
            <material_1.Typography variant="h6" gutterBottom>
                Real-time Meter Readings
            </material_1.Typography>
            <material_1.Box sx={{ width: '100%', height: 400 }}>
                <recharts_1.ResponsiveContainer>
                    <recharts_1.LineChart data={chartData} margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
        }}>
                        <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                        <recharts_1.XAxis dataKey="timestamp" tickFormatter={formatTimestamp} interval="preserveStartEnd"/>
                        <recharts_1.YAxis yAxisId="left"/>
                        <recharts_1.YAxis yAxisId="right" orientation="right"/>
                        <recharts_1.Tooltip labelFormatter={formatTimestamp} formatter={(value) => [value.toFixed(2)]}/>
                        <recharts_1.Legend />
                        <recharts_1.Line yAxisId="left" type="monotone" dataKey="power" stroke="#8884d8" name="Power (kW)" dot={false}/>
                        <recharts_1.Line yAxisId="left" type="monotone" dataKey="energy" stroke="#82ca9d" name="Energy (kWh)" dot={false}/>
                        <recharts_1.Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#ffc658" name="Voltage (V)" dot={false}/>
                        <recharts_1.Line yAxisId="right" type="monotone" dataKey="current" stroke="#ff7300" name="Current (A)" dot={false}/>
                    </recharts_1.LineChart>
                </recharts_1.ResponsiveContainer>
            </material_1.Box>
        </material_1.Paper>);
};
exports.MeterDataChart = MeterDataChart;
