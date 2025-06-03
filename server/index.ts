import express from 'express';
import cors from 'cors';
import { EventEmitter } from 'events';

const app = express();
const port = 8080;
const eventEmitter = new EventEmitter();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const meterConnections = new Map();
const meterEvents = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Connect to meter
app.post('/api/meters/connect', (req, res) => {
  const { meterId, ipAddress, port, protocol, parameters } = req.body;
  
  // Simulate DLMS connection
  setTimeout(() => {
    meterConnections.set(meterId, {
      meterId,
      ipAddress,
      port,
      protocol,
      parameters,
      status: 'CONNECTED',
      lastCommunication: new Date().toISOString()
    });
    
    res.status(200).json({ status: 'connected' });
  }, 1000); // Simulate network delay
});

// Disconnect from meter
app.post('/api/meters/disconnect', (req, res) => {
  const { meterId } = req.body;
  
  if (meterConnections.has(meterId)) {
    meterConnections.delete(meterId);
    res.status(200).json({ status: 'disconnected' });
  } else {
    res.status(404).json({ error: 'Meter not found' });
  }
});

// Read meter data
app.post('/api/meters/:meterId/read', (req, res) => {
  const { meterId } = req.params;
  const { obisCodes } = req.body;
  
  if (!meterConnections.has(meterId)) {
    return res.status(404).json({ error: 'Meter not connected' });
  }

  // Simulate reading data
  const readings = {};
  obisCodes.forEach(obisCode => {
    switch (obisCode) {
      case '1.0.32.7.0.255': // R Phase voltage
      case '1.0.52.7.0.255': // Y Phase voltage
      case '1.0.72.7.0.255': // B Phase voltage
        readings[obisCode] = Math.random() * 10 + 230; // 230-240V
        break;
      case '1.0.31.7.0.255': // R Phase current
      case '1.0.51.7.0.255': // Y Phase current
      case '1.0.71.7.0.255': // B Phase current
        readings[obisCode] = Math.random() * 5 + 10; // 10-15A
        break;
      case '1.0.1.8.0.255': // Daily active import
        readings[obisCode] = Math.random() * 100 + 300; // 300-400 kWh
        break;
      default:
        readings[obisCode] = Math.random() * 100;
    }
  });

  // Update last communication time
  const connection = meterConnections.get(meterId);
  connection.lastCommunication = new Date().toISOString();
  
  res.status(200).json(readings);
});

// Create event
app.post('/api/events', (req, res) => {
  const event = {
    ...req.body,
    id: Math.random().toString(36).substr(2, 9)
  };
  
  const meterEventList = meterEvents.get(event.meterId) || [];
  meterEventList.unshift(event);
  meterEvents.set(event.meterId, meterEventList);
  
  // Emit event for real-time updates
  eventEmitter.emit('meterEvent', event);
  
  res.status(201).json(event);
});

// Get meter events
app.get('/api/meters/:meterId/events', (req, res) => {
  const { meterId } = req.params;
  const { startDate, endDate } = req.query;
  
  let events = meterEvents.get(meterId) || [];
  
  if (startDate) {
    events = events.filter(event => new Date(event.timestamp) >= new Date(startDate as string));
  }
  
  if (endDate) {
    events = events.filter(event => new Date(event.timestamp) <= new Date(endDate as string));
  }
  
  res.status(200).json(events);
});

// Acknowledge event
app.put('/api/events/:eventId/acknowledge', (req, res) => {
  const { eventId } = req.params;
  
  for (const [meterId, events] of meterEvents.entries()) {
    const event = events.find(e => e.id === eventId);
    if (event) {
      event.acknowledged = true;
      res.status(200).json({ status: 'acknowledged' });
      return;
    }
  }
  
  res.status(404).json({ error: 'Event not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 