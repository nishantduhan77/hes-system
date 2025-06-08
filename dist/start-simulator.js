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
const DLMSSimulatorService_1 = require("./services/DLMSSimulatorService");
async function startSimulator() {
    try {
        // Get simulator instance
        const simulator = DLMSSimulatorService_1.DLMSSimulatorService.getInstance();
        // Wait for initial meters to be generated
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Get all meters from database
        const pool = new (await Promise.resolve().then(() => __importStar(require('pg')))).Pool({
            user: 'hes_user',
            host: 'localhost',
            database: 'hes_db',
            password: 'hes_password',
            port: 5433,
        });
        const result = await pool.query('SELECT meter_id FROM meters');
        // Start simulation for each meter
        for (const row of result.rows) {
            await simulator.startSimulation(row.meter_id);
            console.log(`Started simulation for meter ${row.meter_id}`);
        }
        console.log('Simulator running. Press Ctrl+C to stop.');
    }
    catch (error) {
        console.error('Error starting simulator:', error);
    }
}
startSimulator();
