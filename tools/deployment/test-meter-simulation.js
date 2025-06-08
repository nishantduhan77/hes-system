"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var MeterSimulationTester = /** @class */ (function () {
    function MeterSimulationTester() {
        this.pool = new pg_1.Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'hes_system',
            password: process.env.DB_PASSWORD || 'admin',
            port: parseInt(process.env.DB_PORT || '5432'),
        });
    }
    MeterSimulationTester.prototype.testMeterSimulation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var meters, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, 6, 8]);
                        console.log('Starting meter simulation test...\n');
                        return [4 /*yield*/, this.checkRegisteredMeters()];
                    case 1:
                        meters = _a.sent();
                        if (meters.length === 0) {
                            throw new Error('No meters found in the database');
                        }
                        console.log("Found ".concat(meters.length, " registered meters\n"));
                        // Step 2: Check meter status
                        return [4 /*yield*/, this.checkMeterStatus(meters)];
                    case 2:
                        // Step 2: Check meter status
                        _a.sent();
                        // Step 3: Check recent readings
                        return [4 /*yield*/, this.checkRecentReadings(meters)];
                    case 3:
                        // Step 3: Check recent readings
                        _a.sent();
                        // Step 4: Validate data quality
                        return [4 /*yield*/, this.validateDataQuality(meters)];
                    case 4:
                        // Step 4: Validate data quality
                        _a.sent();
                        console.log('\nMeter simulation test completed successfully!');
                        return [3 /*break*/, 8];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Test failed:', error_1);
                        throw error_1;
                    case 6: return [4 /*yield*/, this.pool.end()];
                    case 7:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    MeterSimulationTester.prototype.checkRegisteredMeters = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pool.query("\n            SELECT meter_id, serial_number, manufacturer, model, status, last_communication\n            FROM meters\n        ")];
                    case 1:
                        result = _a.sent();
                        console.log('Registered Meters:');
                        result.rows.forEach(function (meter) {
                            console.log("- ".concat(meter.serial_number, " (").concat(meter.manufacturer, " ").concat(meter.model, ")"));
                            console.log("  Status: ".concat(meter.status, ", Last Communication: ").concat(meter.last_communication));
                        });
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    MeterSimulationTester.prototype.checkMeterStatus = function (meters) {
        return __awaiter(this, void 0, void 0, function () {
            var activeMeters, recentlyActive;
            return __generator(this, function (_a) {
                console.log('\nChecking meter status...');
                activeMeters = meters.filter(function (m) { return m.status === 'CONNECTED'; });
                console.log("- Active meters: ".concat(activeMeters.length, "/").concat(meters.length));
                recentlyActive = meters.filter(function (m) {
                    var lastComm = new Date(m.last_communication);
                    var fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    return lastComm > fiveMinutesAgo;
                });
                console.log("- Recently active meters (last 5 minutes): ".concat(recentlyActive.length, "/").concat(meters.length));
                if (recentlyActive.length === 0) {
                    throw new Error('No meters have been active in the last 5 minutes');
                }
                return [2 /*return*/];
            });
        });
    };
    MeterSimulationTester.prototype.checkRecentReadings = function (meters) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, meters_1, meter, result, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nChecking recent readings...');
                        _i = 0, meters_1 = meters;
                        _a.label = 1;
                    case 1:
                        if (!(_i < meters_1.length)) return [3 /*break*/, 4];
                        meter = meters_1[_i];
                        return [4 /*yield*/, this.pool.query("\n                SELECT \n                    COUNT(*) as reading_count,\n                    MAX(timestamp) as last_reading,\n                    AVG(active_power_import) as avg_power,\n                    AVG(voltage_r_phase) as avg_voltage\n                FROM power_readings\n                WHERE meter_id = $1\n                AND timestamp > NOW() - INTERVAL '5 minutes'\n            ", [meter.meter_id])];
                    case 2:
                        result = _a.sent();
                        stats = result.rows[0];
                        console.log("\nMeter ".concat(meter.serial_number, ":"));
                        console.log("- Readings in last 5 minutes: ".concat(stats.reading_count));
                        if (stats.last_reading) {
                            console.log("- Last reading: ".concat(stats.last_reading));
                            console.log("- Average power: ".concat(Number(stats.avg_power).toFixed(2), " W"));
                            console.log("- Average voltage: ".concat(Number(stats.avg_voltage).toFixed(2), " V"));
                        }
                        if (stats.reading_count === '0') {
                            throw new Error("No recent readings for meter ".concat(meter.serial_number));
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MeterSimulationTester.prototype.validateDataQuality = function (meters) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, meters_2, meter, result, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\nValidating data quality...');
                        _i = 0, meters_2 = meters;
                        _a.label = 1;
                    case 1:
                        if (!(_i < meters_2.length)) return [3 /*break*/, 4];
                        meter = meters_2[_i];
                        return [4 /*yield*/, this.pool.query("\n                SELECT \n                    COUNT(*) as total_readings,\n                    COUNT(*) FILTER (WHERE quality_code != 0) as error_readings,\n                    COUNT(*) FILTER (WHERE voltage_r_phase < 180 OR voltage_r_phase > 260) as voltage_violations,\n                    AVG(active_power_import) as avg_power,\n                    STDDEV(active_power_import) as power_stddev\n                FROM power_readings\n                WHERE meter_id = $1\n                AND timestamp > NOW() - INTERVAL '5 minutes'\n            ", [meter.meter_id])];
                    case 2:
                        result = _a.sent();
                        stats = result.rows[0];
                        console.log("\nMeter ".concat(meter.serial_number, " data quality:"));
                        console.log("- Total readings: ".concat(stats.total_readings));
                        console.log("- Error readings: ".concat(stats.error_readings));
                        console.log("- Voltage violations: ".concat(stats.voltage_violations));
                        console.log("- Power variation coefficient: ".concat(stats.avg_power > 0 ?
                            (Number(stats.power_stddev) / Number(stats.avg_power) * 100).toFixed(2) + '%' :
                            'N/A'));
                        // Validate data quality
                        if (Number(stats.error_readings) / Number(stats.total_readings) > 0.1) {
                            throw new Error("High error rate for meter ".concat(meter.serial_number));
                        }
                        if (Number(stats.voltage_violations) / Number(stats.total_readings) > 0.1) {
                            throw new Error("High voltage violation rate for meter ".concat(meter.serial_number));
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return MeterSimulationTester;
}());
// Run the test
var tester = new MeterSimulationTester();
tester.testMeterSimulation()
    .then(function () { return console.log('Test completed successfully'); })
    .catch(function (error) {
    console.error('Test failed:', error);
    process.exit(1);
});
