import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Tab, Tabs } from '@mui/material';
import { MeterProfileList } from './MeterProfileList';
import { MeterEventList } from './MeterEventList';
import { MeterDataChart } from './MeterDataChart';
import { fetchMeterProfiles, fetchMeterEvents } from '../services/api';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const MeterDashboard: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [profiles, setProfiles] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [profileData, eventData] = await Promise.all([
                    fetchMeterProfiles(),
                    fetchMeterEvents()
                ]);
                setProfiles(profileData);
                setEvents(eventData);
                setError(null);
            } catch (err) {
                setError('Failed to load meter data');
                console.error('Error loading meter data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        // Set up polling interval
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Typography>Loading meter data...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Typography color="error">{error}</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ width: '100%', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Meter Data Dashboard
                </Typography>

                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="Overview" />
                        <Tab label="Profiles" />
                        <Tab label="Events" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <MeterDataChart data={profiles} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Profiles
                                    </Typography>
                                    <MeterProfileList 
                                        profiles={profiles.slice(0, 5)} 
                                        compact={true} 
                                    />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Recent Events
                                    </Typography>
                                    <MeterEventList 
                                        events={events.slice(0, 5)} 
                                        compact={true} 
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <MeterProfileList profiles={profiles} />
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                        <MeterEventList events={events} />
                    </TabPanel>
                </Paper>
            </Box>
        </Container>
    );
}; 