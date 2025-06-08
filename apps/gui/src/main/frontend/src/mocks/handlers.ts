import { rest } from 'msw'
import { addDays, subDays } from 'date-fns'

// Mock user credentials
const MOCK_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Generate mock meter readings
const generateReadings = (meterId: string, count: number) => {
  const readings = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    readings.push({
      id: `${meterId}-reading-${i}`,
      meterId,
      timestamp: subDays(now, i).toISOString(),
      value: Math.round(Math.random() * 1000),
      unit: 'kWh',
      status: 'VALID'
    });
  }
  return readings;
};

// Generate mock billing data
const generateBillingData = (meterId: string) => {
  const now = new Date();
  return {
    id: `${meterId}-bill`,
    meterId,
    startDate: subDays(now, 30).toISOString(),
    endDate: now.toISOString(),
    consumption: Math.round(Math.random() * 500),
    amount: Math.round(Math.random() * 1000),
    status: 'PENDING'
  };
};

// Mock meters data
const MOCK_METERS = Array.from({ length: 10 }, (_, i) => ({
  id: (i + 1).toString(),
  serialNumber: `METER${String(i + 1).padStart(3, '0')}`,
  manufacturer: ['Schneider', 'Siemens', 'ABB'][Math.floor(Math.random() * 3)],
  model: ['Smart-100', 'Elite-200', 'Pro-300'][Math.floor(Math.random() * 3)],
  installationDate: subDays(new Date(), Math.floor(Math.random() * 365)).toISOString(),
  firmwareVersion: '1.0.' + Math.floor(Math.random() * 10),
  status: ['CONNECTED', 'DISCONNECTED', 'ERROR'][Math.floor(Math.random() * 3)],
  lastCommunication: subDays(new Date(), Math.floor(Math.random() * 7)).toISOString()
}));

// Mock events data
const MOCK_EVENTS = MOCK_METERS.flatMap(meter => 
  Array.from({ length: 3 }, (_, i) => ({
    id: `${meter.id}-event-${i}`,
    meterId: meter.id,
    type: ['CONNECT', 'DISCONNECT', 'ERROR', 'WARNING'][Math.floor(Math.random() * 4)],
    timestamp: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
    description: `Event ${i + 1} for meter ${meter.serialNumber}`
  }))
);

// Define the handlers
export const handlers = [
  // Authentication handler
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const { username, password } = await req.json();

    if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
      return res(
        ctx.json({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            username: 'admin',
            role: 'ADMIN'
          }
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid username or password' })
    );
  }),

  // Meters endpoints
  rest.get('/api/meters', (req, res, ctx) => {
    return res(ctx.json(MOCK_METERS));
  }),

  rest.get('/api/meters/:id', (req, res, ctx) => {
    const { id } = req.params;
    const meter = MOCK_METERS.find(m => m.id === id);
    
    if (!meter) {
      return res(ctx.status(404), ctx.json({ message: 'Meter not found' }));
    }
    
    return res(ctx.json(meter));
  }),

  // Meter readings endpoints
  rest.get('/api/meters/:id/readings', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json(generateReadings(id as string, 30)));
  }),

  rest.get('/api/meters/:id/readings/latest', (req, res, ctx) => {
    const { id } = req.params;
    const readings = generateReadings(id as string, 1);
    return res(ctx.json(readings[0]));
  }),

  // Billing endpoints
  rest.get('/api/meters/:id/billing', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json(generateBillingData(id as string)));
  }),

  // Events endpoints
  rest.get('/api/system/events', (req, res, ctx) => {
    return res(ctx.json(MOCK_EVENTS));
  }),

  // System status endpoint
  rest.get('/api/system/status', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'HEALTHY',
        uptime: '10d 4h 30m',
        lastBackup: subDays(new Date(), 1).toISOString(),
        activeConnections: MOCK_METERS.filter(m => m.status === 'CONNECTED').length,
        totalMeters: MOCK_METERS.length,
        systemLoad: Math.round(Math.random() * 100),
        memoryUsage: Math.round(Math.random() * 100)
      })
    );
  }),

  // Meter operations
  rest.post('/api/meters/:id/connect', (req, res, ctx) => {
    const { id } = req.params;
    const meter = MOCK_METERS.find(m => m.id === id);
    if (!meter) {
      return res(ctx.status(404), ctx.json({ message: 'Meter not found' }));
    }
    meter.status = 'CONNECTED';
    return res(ctx.json(meter));
  }),

  rest.post('/api/meters/:id/disconnect', (req, res, ctx) => {
    const { id } = req.params;
    const meter = MOCK_METERS.find(m => m.id === id);
    if (!meter) {
      return res(ctx.status(404), ctx.json({ message: 'Meter not found' }));
    }
    meter.status = 'DISCONNECTED';
    return res(ctx.json(meter));
  })
] 