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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterDashboard = void 0;
const react_1 = __importStar(require("react"));
const material_1 = require("@mui/material");
const MeterProfileList_1 = require("./MeterProfileList");
const MeterEventList_1 = require("./MeterEventList");
const MeterDataChart_1 = require("./MeterDataChart");
const api_1 = require("../services/api");
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (<div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (<material_1.Box sx={{ p: 3 }}>
                    {children}
                </material_1.Box>)}
        </div>);
}
const MeterDashboard = () => {
    const [tabValue, setTabValue] = (0, react_1.useState)(0);
    const [profiles, setProfiles] = (0, react_1.useState)([]);
    const [events, setEvents] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [profileData, eventData] = await Promise.all([
                    (0, api_1.fetchMeterProfiles)(),
                    (0, api_1.fetchMeterEvents)()
                ]);
                setProfiles(profileData);
                setEvents(eventData);
                setError(null);
            }
            catch (err) {
                setError('Failed to load meter data');
                console.error('Error loading meter data:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
        // Set up polling interval
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    if (loading) {
        return (<material_1.Container>
                <material_1.Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <material_1.Typography>Loading meter data...</material_1.Typography>
                </material_1.Box>
            </material_1.Container>);
    }
    if (error) {
        return (<material_1.Container>
                <material_1.Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <material_1.Typography color="error">{error}</material_1.Typography>
                </material_1.Box>
            </material_1.Container>);
    }
    return (<material_1.Container maxWidth="xl">
            <material_1.Box sx={{ width: '100%', mb: 4 }}>
                <material_1.Typography variant="h4" component="h1" gutterBottom>
                    Meter Data Dashboard
                </material_1.Typography>

                <material_1.Paper sx={{ width: '100%', mb: 2 }}>
                    <material_1.Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                        <material_1.Tab label="Overview"/>
                        <material_1.Tab label="Profiles"/>
                        <material_1.Tab label="Events"/>
                    </material_1.Tabs>

                    <TabPanel value={tabValue} index={0}>
                        <material_1.Grid container spacing={3}>
                            <material_1.Grid item xs={12}>
                                <MeterDataChart_1.MeterDataChart data={profiles}/>
                            </material_1.Grid>
                            <material_1.Grid item xs={12} md={6}>
                                <material_1.Paper sx={{ p: 2 }}>
                                    <material_1.Typography variant="h6" gutterBottom>
                                        Recent Profiles
                                    </material_1.Typography>
                                    <MeterProfileList_1.MeterProfileList profiles={profiles.slice(0, 5)} compact={true}/>
                                </material_1.Paper>
                            </material_1.Grid>
                            <material_1.Grid item xs={12} md={6}>
                                <material_1.Paper sx={{ p: 2 }}>
                                    <material_1.Typography variant="h6" gutterBottom>
                                        Recent Events
                                    </material_1.Typography>
                                    <MeterEventList_1.MeterEventList events={events.slice(0, 5)} compact={true}/>
                                </material_1.Paper>
                            </material_1.Grid>
                        </material_1.Grid>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <MeterProfileList_1.MeterProfileList profiles={profiles}/>
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        <MeterEventList_1.MeterEventList events={events}/>
                    </TabPanel>
                </material_1.Paper>
            </material_1.Box>
        </material_1.Container>);
};
exports.MeterDashboard = MeterDashboard;
