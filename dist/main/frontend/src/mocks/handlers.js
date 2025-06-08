"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlers = void 0;
const node_1 = require("msw/node");
exports.handlers = [
    // Add your mock handlers here
    node_1.http.get('/api/meters', () => {
        return node_1.HttpResponse.json([
            {
                id: '1',
                serialNumber: 'TEST001',
                manufacturer: 'Test Manufacturer',
                status: 'CONNECTED'
            }
        ]);
    }),
];
