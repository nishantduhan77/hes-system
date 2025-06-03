import { http, HttpResponse } from 'msw/browser'

export const handlers = [
  http.get('/api/meters', () => {
    return HttpResponse.json([
      {
        id: '1',
        serialNumber: 'TEST001',
        manufacturer: 'Test Manufacturer',
        status: 'CONNECTED'
      }
    ])
  })
] 