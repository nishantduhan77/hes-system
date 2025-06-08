"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const styles_1 = require("@mui/material/styles");
const recharts_1 = require("recharts");
const Refresh_1 = __importDefault(require("@mui/icons-material/Refresh"));
const Delete_1 = __importDefault(require("@mui/icons-material/Delete"));
const Settings_1 = __importDefault(require("@mui/icons-material/Settings"));
const Add_1 = __importDefault(require("@mui/icons-material/Add"));
const Power_1 = __importDefault(require("@mui/icons-material/Power"));
const NetworkCheck_1 = __importDefault(require("@mui/icons-material/NetworkCheck"));
const MeterEventService_1 = __importStar(require("../../services/MeterEventService"));
const MeterCommunicationService_1 = __importDefault(require("../../services/MeterCommunicationService"));
const StyledPaper = (0, styles_1.styled)(material_1.Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(2),
}));
const Grid = (0, styles_1.styled)(material_1.Grid)(() => ({
    display: 'flex',
}));
// Indian OBIS Codes
const INDIAN_OBIS_CODES = {
    // Billing Data
    BILLING_ACTIVE_ENERGY_IMPORT: '1.0.1.8.1.255', // Current billing period import
    BILLING_ACTIVE_ENERGY_EXPORT: '1.0.2.8.1.255', // Current billing period export
    BILLING_REACTIVE_ENERGY_IMPORT: '1.0.3.8.1.255',
    BILLING_REACTIVE_ENERGY_EXPORT: '1.0.4.8.1.255',
    BILLING_MD_IMPORT: '1.0.1.6.1.255', // Maximum Demand Import
    BILLING_MD_EXPORT: '1.0.2.6.1.255', // Maximum Demand Export
    BILLING_PF: '1.0.13.7.1.255', // Power Factor
    BILLING_DATE: '0.0.96.11.1.255', // Last billing date
    // Instantaneous Parameters
    VOLTAGE_R: '1.0.32.7.0.255', // R Phase voltage
    VOLTAGE_Y: '1.0.52.7.0.255', // Y Phase voltage
    VOLTAGE_B: '1.0.72.7.0.255', // B Phase voltage
    CURRENT_R: '1.0.31.7.0.255', // R Phase current
    CURRENT_Y: '1.0.51.7.0.255', // Y Phase current
    CURRENT_B: '1.0.71.7.0.255', // B Phase current
    FREQUENCY: '1.0.14.7.0.255',
    POWER_FACTOR_R: '1.0.33.7.0.255',
    POWER_FACTOR_Y: '1.0.53.7.0.255',
    POWER_FACTOR_B: '1.0.73.7.0.255',
    // Daily Load Profile
    DAILY_ACTIVE_IMPORT: '1.0.1.8.0.255',
    DAILY_ACTIVE_EXPORT: '1.0.2.8.0.255',
    DAILY_REACTIVE_IMPORT: '1.0.3.8.0.255',
    DAILY_REACTIVE_EXPORT: '1.0.4.8.0.255',
    DAILY_PF: '1.0.13.7.0.255',
    // Events
    VOLTAGE_RELATED_EVENTS: '0.0.96.11.2.255',
    CURRENT_RELATED_EVENTS: '0.0.96.11.3.255',
    POWER_RELATED_EVENTS: '0.0.96.11.4.255',
    TRANSACTION_EVENTS: '0.0.96.11.5.255',
    OTHERS_EVENTS: '0.0.96.11.6.255',
    CONTROL_EVENTS: '0.0.96.11.7.255',
};
// Indian Event Types
const INDIAN_EVENT_TYPES = {
    VOLTAGE_HIGH: 'Over Voltage',
    VOLTAGE_LOW: 'Under Voltage',
    CURRENT_HIGH: 'Over Current',
    CURRENT_UNBALANCE: 'Current Unbalance',
    POWER_FAIL: 'Power Failure',
    NEUTRAL_DISTURBANCE: 'Neutral Disturbance',
    MAGNETIC_TAMPER: 'Magnetic Tamper',
    COVER_OPEN: 'Cover Open',
    LOAD_CONTROL: 'Load Control',
};
// Generate random meter data with Indian context
const generateRandomMeter = (index) => {
    const manufacturers = ['L&T', 'Secure Meters', 'Genus', 'HPL', 'Elmeasure', 'Duke Meters'];
    const states = ['MH', 'DL', 'KA', 'TN', 'GJ', 'UP', 'MP', 'RJ'];
    const serialPrefix = states[Math.floor(Math.random() * states.length)];
    return {
        id: `METER_${Math.random().toString(36).substr(2, 9)}`,
        serialNumber: `${serialPrefix}${String(index + 1).padStart(8, '0')}`,
        manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
        ipAddress: `192.168.1.${100 + index}`,
        port: 4059,
        status: Math.random() > 0.3 ? 'CONNECTED' : 'DISCONNECTED',
        lastBilling: {
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            activeEnergyImport: Math.floor(Math.random() * 5000 + 10000), // 10000-15000 kWh
            maximumDemand: Math.random() * 20 + 40, // 40-60 kW
            powerFactor: Math.random() * 0.1 + 0.9, // 0.9-1.0
        },
        events: generateRandomEvents(),
    };
};
const generateRandomEvents = () => {
    const events = [];
    const now = new Date();
    const eventTypes = Object.values(MeterEventService_1.INDIAN_EVENT_CODES);
    const severities = ['HIGH', 'MEDIUM', 'LOW'];
    // Generate 1-5 random events
    const numEvents = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numEvents; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        events.push({
            meterId: `METER_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            eventType: eventType.description,
            eventCode: eventType.code,
            description: `${eventType.description} detected`,
            severity: eventType.severity,
            acknowledged: false
        });
    }
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
const generateMockReadings = (obisCode) => {
    const readings = [];
    const now = new Date();
    // Generate values based on OBIS code
    const generateValue = (obisCode) => {
        switch (obisCode) {
            // Billing related
            case INDIAN_OBIS_CODES.BILLING_ACTIVE_ENERGY_IMPORT:
                return Math.random() * 5000 + 10000; // 10000-15000 kWh
            case INDIAN_OBIS_CODES.BILLING_MD_IMPORT:
                return Math.random() * 20 + 40; // 40-60 kW
            case INDIAN_OBIS_CODES.BILLING_PF:
                return Math.random() * 0.1 + 0.9; // 0.9-1.0
            // Instantaneous parameters
            case INDIAN_OBIS_CODES.VOLTAGE_R:
            case INDIAN_OBIS_CODES.VOLTAGE_Y:
            case INDIAN_OBIS_CODES.VOLTAGE_B:
                return Math.random() * 10 + 230; // 230-240V (Indian standard)
            case INDIAN_OBIS_CODES.CURRENT_R:
            case INDIAN_OBIS_CODES.CURRENT_Y:
            case INDIAN_OBIS_CODES.CURRENT_B:
                return Math.random() * 5 + 10; // 10-15A
            case INDIAN_OBIS_CODES.FREQUENCY:
                return Math.random() * 0.5 + 49.8; // 49.8-50.3Hz (Indian grid standard)
            case INDIAN_OBIS_CODES.POWER_FACTOR_R:
            case INDIAN_OBIS_CODES.POWER_FACTOR_Y:
            case INDIAN_OBIS_CODES.POWER_FACTOR_B:
                return Math.random() * 0.1 + 0.9; // 0.9-1.0
            // Daily load profile
            case INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT:
                return Math.random() * 100 + 300; // 300-400 kWh/day
            case INDIAN_OBIS_CODES.DAILY_REACTIVE_IMPORT:
                return Math.random() * 50 + 100; // 100-150 kVArh/day
            case INDIAN_OBIS_CODES.DAILY_PF:
                return Math.random() * 0.1 + 0.9; // 0.9-1.0
            default:
                return Math.random() * 100;
        }
    };
    for (let i = 0; i < 30; i++) {
        readings.push({
            timestamp: new Date(now.getTime() - i * 60000).toISOString(),
            value: generateValue(obisCode),
            obisCode,
        });
    }
    return readings.reverse();
};
const MeterManagement = () => {
    const [meters, setMeters] = (0, react_1.useState)([]);
    const [selectedMeter, setSelectedMeter] = (0, react_1.useState)(null);
    const [readings, setReadings] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [isBackendAvailable, setIsBackendAvailable] = (0, react_1.useState)(false);
    const [selectedObisCode, setSelectedObisCode] = (0, react_1.useState)(INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT);
    const [eventService] = (0, react_1.useState)(() => MeterEventService_1.default.getInstance());
    const [communicationService] = (0, react_1.useState)(() => MeterCommunicationService_1.default.getInstance());
    const [pingResults, setPingResults] = (0, react_1.useState)({});
    // Check backend availability and initialize services
    (0, react_1.useEffect)(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/health');
                setIsBackendAvailable(response.ok);
            }
            catch (err) {
                setIsBackendAvailable(false);
            }
            setLoading(false);
        };
        checkBackend();
    }, []);
    // Generate initial meters if none exist
    (0, react_1.useEffect)(() => {
        if (!isBackendAvailable && meters.length === 0) {
            const initialMeters = Array.from({ length: 10 }, (_, i) => generateRandomMeter(i));
            setMeters(initialMeters);
            setLoading(false);
        }
    }, [isBackendAvailable, meters.length]);
    // Subscribe to real-time events
    (0, react_1.useEffect)(() => {
        if (isBackendAvailable) {
            const unsubscribe = eventService.subscribeToEvents((event) => {
                setMeters((prevMeters) => prevMeters.map((meter) => meter.id === event.meterId
                    ? {
                        ...meter,
                        events: [event, ...(meter.events || [])].slice(0, 100), // Keep last 100 events
                    }
                    : meter));
            });
            return () => unsubscribe();
        }
    }, [isBackendAvailable, eventService]);
    const handleConnect = async (meterId) => {
        if (!isBackendAvailable) {
            setMeters((prev) => prev.map((meter) => meter.id === meterId
                ? { ...meter, status: 'CONNECTED' }
                : meter));
            return;
        }
        try {
            const meter = meters.find((m) => m.id === meterId);
            if (!meter)
                return;
            await communicationService.connect(meterId, meter.ipAddress, meter.port);
            setMeters((prev) => prev.map((meter) => meter.id === meterId
                ? { ...meter, status: 'CONNECTED' }
                : meter));
        }
        catch (err) {
            setError('Failed to connect to meter');
        }
    };
    const handleDisconnect = async (meterId) => {
        if (!isBackendAvailable) {
            setMeters((prev) => prev.map((meter) => meter.id === meterId
                ? { ...meter, status: 'DISCONNECTED' }
                : meter));
            return;
        }
        try {
            await communicationService.disconnect(meterId);
            setMeters((prev) => prev.map((meter) => meter.id === meterId
                ? { ...meter, status: 'DISCONNECTED' }
                : meter));
        }
        catch (err) {
            setError('Failed to disconnect from meter');
        }
    };
    const handleMeterClick = (meter) => {
        setSelectedMeter(meter);
        setReadings(generateMockReadings(selectedObisCode));
    };
    const handleGenerateMeters = () => {
        const newMeters = Array.from({ length: 10 }, (_, i) => generateRandomMeter(i));
        setMeters(newMeters);
    };
    const handleRefreshMeter = async (meterId) => {
        if (!isBackendAvailable) {
            if (selectedMeter?.id === meterId) {
                setReadings(generateMockReadings(selectedObisCode));
            }
            return;
        }
        try {
            const data = await communicationService.readMeterData(meterId, [selectedObisCode]);
            const newReading = {
                timestamp: new Date().toISOString(),
                value: data[selectedObisCode],
                obisCode: selectedObisCode,
            };
            setReadings((prev) => [...prev.slice(-29), newReading]);
        }
        catch (err) {
            setError('Failed to refresh meter readings');
        }
    };
    const handleDeleteMeter = (meterId) => {
        setMeters((prev) => prev.filter((meter) => meter.id !== meterId));
        if (selectedMeter?.id === meterId) {
            setSelectedMeter(null);
            setReadings([]);
        }
    };
    const handleRelayControl = async (meterId, action) => {
        try {
            await communicationService.controlRelay(meterId, action);
            setMeters((prev) => prev.map((meter) => meter.id === meterId
                ? { ...meter, relayStatus: action }
                : meter));
        }
        catch (err) {
            setError('Failed to control relay');
        }
    };
    const handlePing = async (meterId) => {
        try {
            const responseTime = await communicationService.pingMeter(meterId);
            setPingResults((prev) => ({
                ...prev,
                [meterId]: responseTime
            }));
        }
        catch (err) {
            setError('Failed to ping meter');
        }
    };
    if (loading) {
        return <material_1.CircularProgress />;
    }
    return (<material_1.Box sx={{ width: '100%' }}>
      <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <material_1.Typography variant="h4">
          Meter Management
        </material_1.Typography>
        <material_1.Button variant="contained" color="primary" startIcon={<Add_1.default />} onClick={handleGenerateMeters}>
          Generate 10 Test Meters
        </material_1.Button>
      </material_1.Box>

      {!isBackendAvailable && (<material_1.Alert severity="info" sx={{ mb: 2 }}>
          Running in development mode with mock data. Backend services are not available.
        </material_1.Alert>)}

      <material_1.Box sx={{ flexGrow: 1 }}>
        <material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12}>
            <StyledPaper>
              <material_1.TableContainer>
                <material_1.Table>
                  <material_1.TableHead>
                    <material_1.TableRow>
                      <material_1.TableCell>Serial Number</material_1.TableCell>
                      <material_1.TableCell>Manufacturer</material_1.TableCell>
                      <material_1.TableCell>IP Address</material_1.TableCell>
                      <material_1.TableCell>Port</material_1.TableCell>
                      <material_1.TableCell>Status</material_1.TableCell>
                      <material_1.TableCell>Relay Status</material_1.TableCell>
                      <material_1.TableCell>Ping Response</material_1.TableCell>
                      <material_1.TableCell align="center">Actions</material_1.TableCell>
                    </material_1.TableRow>
                  </material_1.TableHead>
                  <material_1.TableBody>
                    {meters.map((meter) => (<material_1.TableRow key={meter.id} onClick={() => handleMeterClick(meter)} sx={{
                cursor: 'pointer',
                backgroundColor: selectedMeter?.id === meter.id ? 'action.selected' : 'inherit',
                '&:hover': { backgroundColor: 'action.hover' },
            }}>
                        <material_1.TableCell>{meter.serialNumber}</material_1.TableCell>
                        <material_1.TableCell>{meter.manufacturer}</material_1.TableCell>
                        <material_1.TableCell>{meter.ipAddress}</material_1.TableCell>
                        <material_1.TableCell>{meter.port}</material_1.TableCell>
                        <material_1.TableCell>
                          <material_1.Box component="span" sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: meter.status === 'CONNECTED' ? 'success.light' : 'error.light',
                color: 'common.white',
            }}>
                            {meter.status}
                          </material_1.Box>
                        </material_1.TableCell>
                        <material_1.TableCell>
                          <material_1.Box component="span" sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: meter.relayStatus === 'ON' ? 'success.light' : 'error.light',
                color: 'common.white',
            }}>
                            {meter.relayStatus || 'OFF'}
                          </material_1.Box>
                        </material_1.TableCell>
                        <material_1.TableCell>
                          {pingResults[meter.id] ? `${pingResults[meter.id]}ms` : '-'}
                        </material_1.TableCell>
                        <material_1.TableCell align="center">
                          <material_1.Box>
                            {meter.status === 'DISCONNECTED' ? (<material_1.Button variant="contained" color="primary" size="small" onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(meter.id);
                }} sx={{ mr: 1 }}>
                                Connect
                              </material_1.Button>) : (<>
                                <material_1.Button variant="contained" color="error" size="small" onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnect(meter.id);
                }} sx={{ mr: 1 }}>
                                  Disconnect
                                </material_1.Button>
                                <material_1.Tooltip title={meter.relayStatus === 'ON' ? 'Turn Relay OFF' : 'Turn Relay ON'}>
                                  <material_1.IconButton size="small" color={meter.relayStatus === 'ON' ? 'success' : 'error'} onClick={(e) => {
                    e.stopPropagation();
                    handleRelayControl(meter.id, meter.relayStatus === 'ON' ? 'OFF' : 'ON');
                }} sx={{ mr: 1 }}>
                                    <Power_1.default />
                                  </material_1.IconButton>
                                </material_1.Tooltip>
                                <material_1.Tooltip title="Ping Meter">
                                  <material_1.IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    handlePing(meter.id);
                }} sx={{ mr: 1 }}>
                                    <NetworkCheck_1.default />
                                  </material_1.IconButton>
                                </material_1.Tooltip>
                              </>)}
                            <material_1.Tooltip title="Refresh Readings">
                              <material_1.IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                handleRefreshMeter(meter.id);
            }} sx={{ mr: 1 }}>
                                <Refresh_1.default />
                              </material_1.IconButton>
                            </material_1.Tooltip>
                            <material_1.Tooltip title="Configure">
                              <material_1.IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement meter configuration
            }} sx={{ mr: 1 }}>
                                <Settings_1.default />
                              </material_1.IconButton>
                            </material_1.Tooltip>
                            <material_1.Tooltip title="Delete">
                              <material_1.IconButton size="small" color="error" onClick={(e) => {
                e.stopPropagation();
                handleDeleteMeter(meter.id);
            }}>
                                <Delete_1.default />
                              </material_1.IconButton>
                            </material_1.Tooltip>
                          </material_1.Box>
                        </material_1.TableCell>
                      </material_1.TableRow>))}
                  </material_1.TableBody>
                </material_1.Table>
              </material_1.TableContainer>
            </StyledPaper>
          </material_1.Grid>

          {selectedMeter && (<>
              <material_1.Grid item xs={12}>
                <StyledPaper>
                  <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <material_1.Typography variant="h6">
                      Billing Data - {selectedMeter.serialNumber}
                    </material_1.Typography>
                  </material_1.Box>
                  <material_1.Table>
                    <material_1.TableHead>
                      <material_1.TableRow>
                        <material_1.TableCell>Last Billing Date</material_1.TableCell>
                        <material_1.TableCell>Active Energy Import</material_1.TableCell>
                        <material_1.TableCell>Maximum Demand</material_1.TableCell>
                        <material_1.TableCell>Power Factor</material_1.TableCell>
                      </material_1.TableRow>
                    </material_1.TableHead>
                    <material_1.TableBody>
                      <material_1.TableRow>
                        <material_1.TableCell>{new Date(selectedMeter.lastBilling?.date || '').toLocaleDateString()}</material_1.TableCell>
                        <material_1.TableCell>{selectedMeter.lastBilling?.activeEnergyImport.toFixed(2)} kWh</material_1.TableCell>
                        <material_1.TableCell>{selectedMeter.lastBilling?.maximumDemand.toFixed(2)} kW</material_1.TableCell>
                        <material_1.TableCell>{selectedMeter.lastBilling?.powerFactor.toFixed(2)}</material_1.TableCell>
                      </material_1.TableRow>
                    </material_1.TableBody>
                  </material_1.Table>
                </StyledPaper>
              </material_1.Grid>

              <material_1.Grid item xs={12}>
                <StyledPaper>
                  <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <material_1.Typography variant="h6">
                      Events - {selectedMeter.serialNumber}
                    </material_1.Typography>
                  </material_1.Box>
                  <material_1.Table>
                    <material_1.TableHead>
                      <material_1.TableRow>
                        <material_1.TableCell>Timestamp</material_1.TableCell>
                        <material_1.TableCell>Type</material_1.TableCell>
                        <material_1.TableCell>Description</material_1.TableCell>
                        <material_1.TableCell>Severity</material_1.TableCell>
                      </material_1.TableRow>
                    </material_1.TableHead>
                    <material_1.TableBody>
                      {selectedMeter.events?.map((event, index) => (<material_1.TableRow key={index}>
                          <material_1.TableCell>{new Date(event.timestamp).toLocaleString()}</material_1.TableCell>
                          <material_1.TableCell>{event.eventType}</material_1.TableCell>
                          <material_1.TableCell>{event.description}</material_1.TableCell>
                          <material_1.TableCell>
                            <material_1.Box component="span" sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: event.severity === 'HIGH' ? 'error.light' :
                        event.severity === 'MEDIUM' ? 'warning.light' : 'success.light',
                    color: 'common.white',
                }}>
                              {event.severity}
                            </material_1.Box>
                          </material_1.TableCell>
                        </material_1.TableRow>))}
                    </material_1.TableBody>
                  </material_1.Table>
                </StyledPaper>
              </material_1.Grid>

              <material_1.Grid item xs={12}>
                <StyledPaper>
                  <material_1.Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <material_1.Typography variant="h6">
                      Real-time Readings - {selectedMeter.serialNumber}
                    </material_1.Typography>
                    <material_1.Box>
                      <material_1.Button variant="outlined" size="small" onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT)} color={selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'primary' : 'inherit'} sx={{ mr: 1 }}>
                        Daily Energy
                      </material_1.Button>
                      <material_1.Button variant="outlined" size="small" onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.VOLTAGE_R)} color={selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'primary' : 'inherit'} sx={{ mr: 1 }}>
                        R-Phase Voltage
                      </material_1.Button>
                      <material_1.Button variant="outlined" size="small" onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.CURRENT_R)} color={selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'primary' : 'inherit'} sx={{ mr: 1 }}>
                        R-Phase Current
                      </material_1.Button>
                      <material_1.Button variant="outlined" size="small" onClick={() => setSelectedObisCode(INDIAN_OBIS_CODES.POWER_FACTOR_R)} color={selectedObisCode === INDIAN_OBIS_CODES.POWER_FACTOR_R ? 'primary' : 'inherit'} sx={{ mr: 1 }}>
                        R-Phase PF
                      </material_1.Button>
                    </material_1.Box>
                  </material_1.Box>
                  <recharts_1.LineChart width={800} height={400} data={readings}>
                    <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                    <recharts_1.XAxis dataKey="timestamp" tickFormatter={(time) => {
                const date = new Date(time);
                return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            }}/>
                    <recharts_1.YAxis label={{
                value: selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'kWh' :
                    selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'V' :
                        selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'A' : 'PF',
                angle: -90,
                position: 'insideLeft'
            }}/>
                    <recharts_1.Tooltip formatter={(value) => [
                `${Number(value).toFixed(2)} ${selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'kWh' :
                    selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'V' :
                        selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'A' : 'PF'}`,
                'Value'
            ]} labelFormatter={(label) => new Date(String(label)).toLocaleTimeString()}/>
                    <recharts_1.Legend />
                    <recharts_1.Line type="monotone" dataKey="value" stroke="#8884d8" name={selectedObisCode === INDIAN_OBIS_CODES.DAILY_ACTIVE_IMPORT ? 'Daily Energy' :
                selectedObisCode === INDIAN_OBIS_CODES.VOLTAGE_R ? 'R-Phase Voltage' :
                    selectedObisCode === INDIAN_OBIS_CODES.CURRENT_R ? 'R-Phase Current' : 'R-Phase Power Factor'} dot={false} isAnimationActive={false}/>
                  </recharts_1.LineChart>
                </StyledPaper>
              </material_1.Grid>
            </>)}
        </material_1.Grid>
      </material_1.Box>
    </material_1.Box>);
};
exports.default = MeterManagement;
