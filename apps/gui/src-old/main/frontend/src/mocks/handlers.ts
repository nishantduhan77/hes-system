import { http, HttpResponse } from 'msw/node'

export const handlers = [
  // Add your mock handlers here
  http.get('/api/meters', () => {
    return HttpResponse.json([
      {
        id: '1',
        serialNumber: 'TEST001',
        manufacturer: 'Test Manufacturer',
        status: 'CONNECTED'
      }
    ]);
  }),
]; 