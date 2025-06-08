"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterEventList = void 0;
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const MeterEventList = ({ events, compact = false }) => {
    const getEventIcon = (severity) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return <icons_material_1.Error color="error"/>;
            case 'warning':
                return <icons_material_1.Warning color="warning"/>;
            case 'info':
                return <icons_material_1.Info color="info"/>;
            case 'success':
                return <icons_material_1.CheckCircle color="success"/>;
            default:
                return <icons_material_1.Info />;
        }
    };
    const getEventColor = (severity) => {
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
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };
    return (<material_1.Paper>
            <material_1.List dense={compact}>
                {events.map((event) => (<material_1.ListItem key={`${event.meterId}-${event.timestamp}-${event.type}`} divider>
                        <material_1.ListItemIcon>
                            {getEventIcon(event.severity)}
                        </material_1.ListItemIcon>
                        <material_1.ListItemText primary={<material_1.Box display="flex" alignItems="center" gap={1}>
                                    <material_1.Typography variant={compact ? "body2" : "body1"}>
                                        {event.message}
                                    </material_1.Typography>
                                    <material_1.Chip label={event.type} size="small" color={getEventColor(event.severity)} variant="outlined"/>
                                </material_1.Box>} secondary={<material_1.Box display="flex" alignItems="center" gap={2}>
                                    <material_1.Typography variant="caption">
                                        Meter ID: {event.meterId}
                                    </material_1.Typography>
                                    <material_1.Typography variant="caption">
                                        {formatTimestamp(event.timestamp)}
                                    </material_1.Typography>
                                </material_1.Box>}/>
                    </material_1.ListItem>))}
            </material_1.List>
        </material_1.Paper>);
};
exports.MeterEventList = MeterEventList;
