import { meterApi, systemApi } from '../api';
import { server } from '../../mocks/server';
import { rest } from 'msw';

describe('API Services', () => {
  describe('meterApi', () => {
    it('fetches all meters', async () => {
      const response = await meterApi.getAllMeters();
      expect(response.data).toHaveLength(2);
      expect(response.data[0].meterId).toBe('MTR001');
    });

    it('fetches a single meter by id', async () => {
      const response = await meterApi.getMeterById(1);
      expect(response.data.meterId).toBe('MTR001');
      expect(response.data.manufacturer).toBe('ABB');
    });

    it('handles 404 when fetching non-existent meter', async () => {
      server.use(
        rest.get('/api/meters/999', (req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      await expect(meterApi.getMeterById(999)).rejects.toThrow();
    });

    it('creates a new meter', async () => {
      const newMeter = {
        meterId: 'MTR003',
        serialNumber: 'SN123458',
        manufacturer: 'Siemens',
        ipAddress: '192.168.1.102',
        port: 4059,
      };

      const response = await meterApi.createMeter(newMeter);
      expect(response.data.id).toBe(3);
      expect(response.data.meterId).toBe('MTR003');
      expect(response.data.status).toBe('Disconnected');
    });

    it('fetches meter readings', async () => {
      const response = await meterApi.getMeterReadings('MTR001');
      expect(response.data).toHaveLength(1);
      expect(response.data[0].meterId).toBe('MTR001');
    });
  });

  describe('systemApi', () => {
    it('fetches system status', async () => {
      const response = await systemApi.getSystemStatus();
      expect(response.data.status).toBe('Healthy');
      expect(response.data.uptime).toBe('5 days, 2 hours');
    });

    it('fetches system metrics', async () => {
      const response = await systemApi.getSystemMetrics();
      expect(response.data.cpuUsage).toBe(45);
      expect(response.data.memoryUsage).toBe(62);
      expect(response.data.diskUsage).toBe(38);
    });

    it('fetches recent events', async () => {
      const response = await systemApi.getRecentEvents();
      expect(response.data).toHaveLength(1);
      expect(response.data[0].type).toBe('info');
    });

    it('handles API errors', async () => {
      server.use(
        rest.get('/api/system/status', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      await expect(systemApi.getSystemStatus()).rejects.toThrow();
    });
  });
}); 