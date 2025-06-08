import { setupWorker } from 'msw'
import { handlers } from './handlers'

// Create the worker instance
export const worker = setupWorker(...handlers)

// Make the `worker` and `handlers` available in the browser's DevTools
declare global {
  interface Window {
    msw: {
      worker: typeof worker
      handlers: typeof handlers
    }
  }
}

window.msw = {
  worker,
  handlers,
} 