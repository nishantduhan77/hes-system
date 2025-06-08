"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationLayer = exports.Priority = exports.ResultType = exports.ServiceType = void 0;
const events_1 = require("events");
/**
 * DLMS Application Layer Service Types
 */
var ServiceType;
(function (ServiceType) {
    ServiceType[ServiceType["GET"] = 192] = "GET";
    ServiceType[ServiceType["SET"] = 193] = "SET";
    ServiceType[ServiceType["ACTION"] = 195] = "ACTION";
    ServiceType[ServiceType["EVENT_NOTIFICATION"] = 196] = "EVENT_NOTIFICATION";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
/**
 * DLMS Application Layer Result Types
 */
var ResultType;
(function (ResultType) {
    ResultType[ResultType["SUCCESS"] = 0] = "SUCCESS";
    ResultType[ResultType["HARDWARE_FAULT"] = 1] = "HARDWARE_FAULT";
    ResultType[ResultType["TEMPORARY_FAILURE"] = 2] = "TEMPORARY_FAILURE";
    ResultType[ResultType["READ_WRITE_DENIED"] = 3] = "READ_WRITE_DENIED";
    ResultType[ResultType["OBJECT_UNDEFINED"] = 4] = "OBJECT_UNDEFINED";
    ResultType[ResultType["OBJECT_CLASS_INCONSISTENT"] = 9] = "OBJECT_CLASS_INCONSISTENT";
    ResultType[ResultType["SCOPE_OF_ACCESS_VIOLATED"] = 11] = "SCOPE_OF_ACCESS_VIOLATED";
    ResultType[ResultType["DATA_BLOCK_UNAVAILABLE"] = 12] = "DATA_BLOCK_UNAVAILABLE";
    ResultType[ResultType["LONG_GET_ABORTED"] = 13] = "LONG_GET_ABORTED";
    ResultType[ResultType["NO_LONG_GET_IN_PROGRESS"] = 14] = "NO_LONG_GET_IN_PROGRESS";
    ResultType[ResultType["LONG_SET_ABORTED"] = 15] = "LONG_SET_ABORTED";
    ResultType[ResultType["NO_LONG_SET_IN_PROGRESS"] = 16] = "NO_LONG_SET_IN_PROGRESS";
    ResultType[ResultType["OTHER_REASON"] = 250] = "OTHER_REASON";
})(ResultType || (exports.ResultType = ResultType = {}));
/**
 * DLMS Application Layer Priority
 */
var Priority;
(function (Priority) {
    Priority[Priority["NORMAL"] = 0] = "NORMAL";
    Priority[Priority["HIGH"] = 1] = "HIGH";
})(Priority || (exports.Priority = Priority = {}));
/**
 * DLMS Application Layer Implementation
 */
class ApplicationLayer extends events_1.EventEmitter {
    constructor(blockSize = 1024, timeout = 5000) {
        super();
        this.invokeId = 1;
        this.blockSize = blockSize;
        this.timeout = timeout;
    }
    /**
     * Send a GET request
     */
    async get(classId, instanceId, attributeId) {
        const request = {
            type: ServiceType.GET,
            priority: Priority.NORMAL,
            invokeId: this.getNextInvokeId(),
            data: this.encodeGetRequest(classId, instanceId, attributeId)
        };
        return this.sendRequest(request);
    }
    /**
     * Send a SET request
     */
    async set(classId, instanceId, attributeId, value) {
        const request = {
            type: ServiceType.SET,
            priority: Priority.NORMAL,
            invokeId: this.getNextInvokeId(),
            data: this.encodeSetRequest(classId, instanceId, attributeId, value)
        };
        const response = await this.sendRequest(request);
        return this.decodeSetResponse(response);
    }
    /**
     * Send an ACTION request
     */
    async action(classId, instanceId, methodId, params) {
        const request = {
            type: ServiceType.ACTION,
            priority: Priority.NORMAL,
            invokeId: this.getNextInvokeId(),
            data: this.encodeActionRequest(classId, instanceId, methodId, params)
        };
        return this.sendRequest(request);
    }
    /**
     * Handle received data from lower layer
     */
    handleReceivedData(data) {
        try {
            const response = this.decodeResponse(data);
            this.emit(`response_${response.invokeId}`, response);
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Send a request and wait for response
     */
    async sendRequest(request) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.removeAllListeners(`response_${request.invokeId}`);
                reject(new Error('Request timeout'));
            }, this.timeout);
            this.once(`response_${request.invokeId}`, (response) => {
                clearTimeout(timeoutId);
                if (response.result === ResultType.SUCCESS) {
                    resolve(response.data || Buffer.alloc(0));
                }
                else {
                    reject(new Error(`Request failed with result: ${response.result}`));
                }
            });
            this.emit('send', this.encodeRequest(request));
        });
    }
    /**
     * Get next invoke ID
     */
    getNextInvokeId() {
        this.invokeId = (this.invokeId % 15) + 1;
        return this.invokeId;
    }
    /**
     * Encode GET request
     */
    encodeGetRequest(classId, instanceId, attributeId) {
        // TODO: Implement actual DLMS GET request encoding
        return Buffer.alloc(0);
    }
    /**
     * Encode SET request
     */
    encodeSetRequest(classId, instanceId, attributeId, value) {
        // TODO: Implement actual DLMS SET request encoding
        return Buffer.alloc(0);
    }
    /**
     * Encode ACTION request
     */
    encodeActionRequest(classId, instanceId, methodId, params) {
        // TODO: Implement actual DLMS ACTION request encoding
        return Buffer.alloc(0);
    }
    /**
     * Encode request
     */
    encodeRequest(request) {
        // TODO: Implement actual DLMS request encoding
        return Buffer.alloc(0);
    }
    /**
     * Decode response
     */
    decodeResponse(data) {
        // TODO: Implement actual DLMS response decoding
        return {
            type: ServiceType.GET,
            invokeId: 1,
            result: ResultType.SUCCESS
        };
    }
    /**
     * Decode SET response
     */
    decodeSetResponse(data) {
        // TODO: Implement actual DLMS SET response decoding
        return ResultType.SUCCESS;
    }
}
exports.ApplicationLayer = ApplicationLayer;
