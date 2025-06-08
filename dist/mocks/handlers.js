"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlers = void 0;
const browser_1 = require("msw/browser");
exports.handlers = [
    browser_1.http.get('/api/meters', () => {
        return browser_1.HttpResponse.json([
            {
                id: '1',
                serialNumber: 'TEST001',
                manufacturer: 'Test Manufacturer',
                status: 'CONNECTED'
            }
        ]);
    })
];
