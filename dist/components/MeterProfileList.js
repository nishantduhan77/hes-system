"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterProfileList = void 0;
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const MeterProfileList = ({ profiles, compact = false }) => {
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };
    const getQualityColor = (quality) => {
        switch (quality.toLowerCase()) {
            case 'good':
                return 'success';
            case 'questionable':
                return 'warning';
            default:
                return 'error';
        }
    };
    return (<material_1.TableContainer component={material_1.Paper}>
            <material_1.Table size={compact ? "small" : "medium"}>
                <material_1.TableHead>
                    <material_1.TableRow>
                        <material_1.TableCell>Meter ID</material_1.TableCell>
                        <material_1.TableCell>Timestamp</material_1.TableCell>
                        <material_1.TableCell>Energy (kWh)</material_1.TableCell>
                        <material_1.TableCell>Power (kW)</material_1.TableCell>
                        <material_1.TableCell>Voltage (V)</material_1.TableCell>
                        <material_1.TableCell>Current (A)</material_1.TableCell>
                        <material_1.TableCell>Quality</material_1.TableCell>
                        <material_1.TableCell>Actions</material_1.TableCell>
                    </material_1.TableRow>
                </material_1.TableHead>
                <material_1.TableBody>
                    {profiles.map((profile) => (<material_1.TableRow key={`${profile.meterId}-${profile.timestamp}`}>
                            <material_1.TableCell>{profile.meterId}</material_1.TableCell>
                            <material_1.TableCell>{formatTimestamp(profile.timestamp)}</material_1.TableCell>
                            <material_1.TableCell>{profile.energy.toFixed(2)}</material_1.TableCell>
                            <material_1.TableCell>{profile.power.toFixed(2)}</material_1.TableCell>
                            <material_1.TableCell>{profile.voltage.toFixed(1)}</material_1.TableCell>
                            <material_1.TableCell>{profile.current.toFixed(2)}</material_1.TableCell>
                            <material_1.TableCell>
                                <material_1.Chip label={profile.quality} color={getQualityColor(profile.quality)} size={compact ? "small" : "medium"}/>
                            </material_1.TableCell>
                            <material_1.TableCell>
                                <material_1.Tooltip title="View Details">
                                    <material_1.IconButton size="small">
                                        <icons_material_1.Info />
                                    </material_1.IconButton>
                                </material_1.Tooltip>
                            </material_1.TableCell>
                        </material_1.TableRow>))}
                </material_1.TableBody>
            </material_1.Table>
        </material_1.TableContainer>);
};
exports.MeterProfileList = MeterProfileList;
