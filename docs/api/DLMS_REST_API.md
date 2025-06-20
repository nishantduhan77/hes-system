# DLMS REST API Documentation

This document provides comprehensive information about the DLMS REST API endpoints for meter communication, including ping, relay operations, read/write operations, and simulator control.

## Base URL
```
http://localhost:8080/api/dlms
```

## Authentication
Currently, the API does not require authentication. In production, consider adding JWT or API key authentication.

## Available Endpoints

### 1. Ping Meter
**Endpoint:** `POST /api/dlms/ping`  
**Description:** Ping a specific meter to check connectivity  
**Circuit Breaker:** ✅ Protected  
**Retry:** ✅ Enabled  

#### Request Body (JSON)
```json
{
    "meterSerialNumber": "METER001"
}
```

#### Response (Success)
```json
{
    "success": true,
    "meterSerialNumber": "METER001",
    "timestamp": 1703123456789,
    "message": "Ping successful",
    "value": "20231220123456"
}
```

#### Response (Error)
```json
{
    "success": false,
    "error": "Ping operation failed: Connection timeout",
    "meterSerialNumber": "METER001",
    "timestamp": 1703123456789
}
```

#### cURL Example
```bash
curl -X POST http://localhost:8080/api/dlms/ping \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001"
  }'
```

---

### 2. Relay Operation (Connect/Disconnect)
**Endpoint:** `POST /api/dlms/relay`  
**Description:** Perform relay connect or disconnect operation  
**Circuit Breaker:** ✅ Protected  
**Retry:** ✅ Enabled  

#### Request Body (JSON)
```json
{
    "meterSerialNumber": "METER001",
    "connect": true
}
```

#### Response (Success)
```json
{
    "success": true,
    "meterSerialNumber": "METER001",
    "operation": "CONNECT",
    "timestamp": 1703123456789,
    "message": "Relay operation successful"
}
```

#### Response (Error)
```json
{
    "success": false,
    "error": "Relay operation failed: Authentication failed",
    "meterSerialNumber": "METER001",
    "operation": "CONNECT",
    "timestamp": 1703123456789
}
```

#### cURL Examples

**Connect:**
```bash
curl -X POST http://localhost:8080/api/dlms/relay \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001",
    "connect": true
  }'
```

**Disconnect:**
```bash
curl -X POST http://localhost:8080/api/dlms/relay \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001",
    "connect": false
  }'
```

---

### 3. Read Meter Data
**Endpoint:** `POST /api/dlms/read`  
**Description:** Read specific COSEM object from meter  
**Circuit Breaker:** ✅ Protected  
**Retry:** ✅ Enabled  

#### Available COSEM Objects
- `CLOCK` - Meter clock/time
- `ACTIVE_POWER_IMPORT` - Active power import
- `VOLTAGE_L1` - Phase 1 voltage
- `CURRENT_L1` - Phase 1 current
- `FREQUENCY` - System frequency
- `RELAY_CONTROL` - Relay status

#### Request Body (JSON)
```json
{
    "meterSerialNumber": "METER001",
    "cosemObject": "ACTIVE_POWER_IMPORT"
}
```

#### Response (Success)
```json
{
    "success": true,
    "meterSerialNumber": "METER001",
    "cosemObject": "ACTIVE_POWER_IMPORT",
    "timestamp": 1703123456789,
    "message": "Read operation successful",
    "value": "5000.5"
}
```

#### Response (Error)
```json
{
    "success": false,
    "error": "Read operation failed: Object not found",
    "meterSerialNumber": "METER001",
    "cosemObject": "ACTIVE_POWER_IMPORT",
    "timestamp": 1703123456789
}
```

#### cURL Example
```bash
curl -X POST http://localhost:8080/api/dlms/read \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001",
    "cosemObject": "ACTIVE_POWER_IMPORT"
  }'
```

---

### 4. Write Meter Data
**Endpoint:** `POST /api/dlms/write`  
**Description:** Write data to specific COSEM object  
**Circuit Breaker:** ✅ Protected  
**Retry:** ✅ Enabled  

#### Supported Data Types
- `boolean` - true/false
- `integer` - 32-bit integer
- `long` - 64-bit integer
- `double` - floating point
- `string` - text string
- `octet_string` - hex string

#### Request Body (JSON)
```json
{
    "meterSerialNumber": "METER001",
    "cosemObject": "RELAY_CONTROL",
    "value": true,
    "dataType": "boolean"
}
```

#### Response (Success)
```json
{
    "success": true,
    "meterSerialNumber": "METER001",
    "cosemObject": "RELAY_CONTROL",
    "value": true,
    "timestamp": 1703123456789,
    "message": "Write operation successful"
}
```

#### Response (Error)
```json
{
    "success": false,
    "error": "Write operation failed: Access denied",
    "meterSerialNumber": "METER001",
    "cosemObject": "RELAY_CONTROL",
    "value": true,
    "timestamp": 1703123456789
}
```

#### cURL Examples

**Boolean Value:**
```bash
curl -X POST http://localhost:8080/api/dlms/write \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001",
    "cosemObject": "RELAY_CONTROL",
    "value": true,
    "dataType": "boolean"
  }'
```

**Integer Value:**
```bash
curl -X POST http://localhost:8080/api/dlms/write \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001",
    "cosemObject": "CUSTOM_OBJECT",
    "value": 12345,
    "dataType": "integer"
  }'
```

**String Value:**
```bash
curl -X POST http://localhost:8080/api/dlms/write \
  -H "Content-Type: application/json" \
  -d '{
    "meterSerialNumber": "METER001",
    "cosemObject": "CUSTOM_OBJECT",
    "value": "Hello World",
    "dataType": "string"
  }'
```

---

### 5. Get All Meters
**Endpoint:** `GET /api/dlms/meters`  
**Description:** Retrieve list of all available meters  

#### Response (Success)
```json
{
    "success": true,
    "meters": [
        {
            "serialNumber": "METER001",
            "ipAddress": "192.168.1.100",
            "port": 4059,
            "manufacturer": "Generic",
            "model": "DLMS-Meter",
            "status": "ONLINE",
            "lastCommunication": "2023-12-20T12:34:56Z"
        },
        {
            "serialNumber": "METER002",
            "ipAddress": "192.168.1.101",
            "port": 4059,
            "manufacturer": "Generic",
            "model": "DLMS-Meter",
            "status": "OFFLINE",
            "lastCommunication": "2023-12-20T10:30:00Z"
        }
    ],
    "count": 2,
    "timestamp": 1703123456789
}
```

#### cURL Example
```bash
curl -X GET http://localhost:8080/api/dlms/meters
```

---

### 6. Get Simulator Status
**Endpoint:** `GET /api/dlms/status`  
**Description:** Get current simulator status and health  

#### Response (Success)
```json
{
    "success": true,
    "status": "Enhanced DLMS Simulator is running with integrated communication services",
    "timestamp": 1703123456789
}
```

#### cURL Example
```bash
curl -X GET http://localhost:8080/api/dlms/status
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
    "success": false,
    "error": "Meter not found: INVALID_METER"
}
```

#### 500 Internal Server Error
```json
{
    "success": false,
    "error": "Ping operation failed: Connection timeout"
}
```

### Error Codes
- `Meter not found` - Invalid meter serial number
- `Invalid COSEM object` - Unsupported COSEM object
- `Invalid data type` - Unsupported data type for write operation
- `Connection timeout` - Network timeout
- `Authentication failed` - DLMS authentication error
- `Access denied` - Insufficient permissions
- `Object not found` - COSEM object not available

---

## Circuit Breaker & Retry Configuration

The API uses Resilience4j for circuit breaker and retry patterns:

### Circuit Breaker Configuration
```yaml
resilience4j:
  circuitbreaker:
    instances:
      meterCommunication:
        slidingWindowSize: 5
        minimumNumberOfCalls: 2
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
```

### Retry Configuration
```yaml
resilience4j:
  retry:
    instances:
      meterCommunication:
        maxAttempts: 2
        waitDuration: 100ms
        enableExponentialBackoff: false
```

---

## Testing with Postman

### Postman Collection
You can import this collection into Postman:

```json
{
  "info": {
    "name": "DLMS API",
    "description": "DLMS/COSEM Meter Communication API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Ping Meter",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"meterSerialNumber\": \"METER001\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/dlms/ping",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dlms", "ping"]
        }
      }
    },
    {
      "name": "Relay Connect",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"meterSerialNumber\": \"METER001\",\n  \"connect\": true\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/dlms/relay",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dlms", "relay"]
        }
      }
    },
    {
      "name": "Read Active Power",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"meterSerialNumber\": \"METER001\",\n  \"cosemObject\": \"ACTIVE_POWER_IMPORT\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/dlms/read",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dlms", "read"]
        }
      }
    },
    {
      "name": "Get All Meters",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/dlms/meters",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dlms", "meters"]
        }
      }
    },
    {
      "name": "Get Status",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/dlms/status",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "dlms", "status"]
        }
      }
    }
  ]
}
```

---

## Testing Scenarios

### 1. Basic Connectivity Test
```bash
# 1. Get available meters
curl -X GET http://localhost:8080/api/dlms/meters

# 2. Ping a meter
curl -X POST http://localhost:8080/api/dlms/ping \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber": "METER001"}'

# 3. Check simulator status
curl -X GET http://localhost:8080/api/dlms/status
```

### 2. Relay Operations Test
```bash
# 1. Connect relay
curl -X POST http://localhost:8080/api/dlms/relay \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber": "METER001", "connect": true}'

# 2. Disconnect relay
curl -X POST http://localhost:8080/api/dlms/relay \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber": "METER001", "connect": false}'
```

### 3. Data Reading Test
```bash
# Read different COSEM objects
curl -X POST http://localhost:8080/api/dlms/read \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber": "METER001", "cosemObject": "CLOCK"}'

curl -X POST http://localhost:8080/api/dlms/read \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber": "METER001", "cosemObject": "ACTIVE_POWER_IMPORT"}'

curl -X POST http://localhost:8080/api/dlms/read \
  -H "Content-Type: application/json" \
  -d '{"meterSerialNumber": "METER001", "cosemObject": "VOLTAGE_L1"}'
```

---

## Monitoring and Logging

### Application Logs
The API provides detailed logging for all operations:
- Request/response logging
- Error logging with stack traces
- Circuit breaker state changes
- Retry attempts

### Metrics
The API exposes metrics via Spring Boot Actuator:
- Request counts and response times
- Circuit breaker metrics
- Error rates

### Health Checks
```bash
# Check application health
curl -X GET http://localhost:8080/actuator/health

# Check circuit breaker health
curl -X GET http://localhost:8080/actuator/health/circuitbreakers
```

---

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if the meter is reachable on the network
   - Verify IP address and port configuration
   - Check firewall settings

2. **Authentication Failed**
   - Verify DLMS authentication keys
   - Check security level configuration
   - Ensure meter supports the configured security

3. **Object Not Found**
   - Verify COSEM object exists on the meter
   - Check OBIS codes and class IDs
   - Ensure proper access rights

4. **Circuit Breaker Open**
   - Too many consecutive failures
   - Wait for circuit breaker to close (10 seconds by default)
   - Check underlying connectivity issues

### Debug Mode
Enable debug logging by setting:
```yaml
logging:
  level:
    com.hes.collector: DEBUG
    com.hes.collector.controller: DEBUG
    com.hes.collector.service: DEBUG
``` 