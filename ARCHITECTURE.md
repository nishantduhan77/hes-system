# HES System Architecture Documentation

## Project Overview
The HES (Head End System) is a multi-module Maven project designed to manage and interact with smart meters. The system is built with a modular architecture that separates concerns into distinct components.

## Project Structure

```
hes-system/
├── shared/               # Shared models and utilities
├── hes-console/         # Command-line interface module
├── hes-microservice/    # RESTful service module
├── hes-gui/             # Web interface module
└── pom.xml              # Parent POM file
```

## Modules Description

### 1. Shared Module (`shared/`)
Contains common models and utilities used across all modules.

Key Components:
- `Meter.java`: Core meter entity with the following attributes:
  - Meter ID
  - Serial Number
  - Manufacturer Name
  - IP Address
  - Port
  - Connection Status
  - DLMS/COSEM attributes

- `MeterReading.java`: Model for meter readings with:
  - Active Energy Import
  - Voltage
  - Frequency
  - Status
  - Timestamp

### 2. Console Module (`hes-console/`)
Provides a command-line interface using Spring Shell.

Key Components:
- `ConsoleApplication.java`: Main Spring Boot application
- `MeterCommands.java`: Shell commands implementation:
  - `meter-add`: Add new meters
  - `meter-list`: List all meters
  - `meter-connect`: Connect to meters
  - `meter-read`: Read meter data
  - `meter-disconnect`: Disconnect from meters
- `DlmsClient.java`: DLMS protocol implementation

### 3. Microservice Module (`hes-microservice/`)
RESTful service implementation for meter management.

Key Components:
- `MeterController.java`: REST endpoints for:
  - Register meters
  - Get meter information
  - Submit readings
  - Delete meters

### 4. GUI Module (`hes-gui/`)
Web interface for meter management built with React and TypeScript.

Key Components:
- Modern React-based dashboard for meter monitoring
- Material UI components for consistent design
- Real-time meter readings display using React Query
- Interactive charts with Recharts
- System status notifications with Notistack
- Type-safe development with TypeScript
- Comprehensive testing setup with Jest and React Testing Library

## Technology Stack

1. **Core Technologies**:
   - Java 21
   - Spring Boot 3.2.3
   - Spring Shell
   - Maven
   - React 18.2.0
   - TypeScript 4.9.5

2. **Frontend Technologies**:
   - Material UI (MUI) 5.15.0
   - React Query 4.29.7
   - React Router 6.11.2
   - Recharts 2.6.2
   - Axios 1.9.0
   - Notistack 3.0.1

3. **Communication Protocols**:
   - DLMS/COSEM for meter communication
   - REST APIs for service integration

4. **Data Models**:
   - Lombok for boilerplate reduction
   - Jakarta Validation for data validation

## Key Features

1. **Meter Management**:
   - Registration and configuration
   - Connection handling
   - Real-time monitoring
   - Data collection

2. **User Interfaces**:
   - Command-line interface (Spring Shell)
   - Web interface
   - RESTful API

3. **Security**:
   - DLMS authentication
   - Encryption support
   - Secure communication channels

## Build and Deployment

1. **Build Process**:
   ```bash
   mvn clean install
   ```

2. **Module Execution**:
   - Console: `java -jar hes-console/target/hes-console-1.0.0.jar`
   - Microservice: `java -jar hes-microservice/target/hes-microservice-1.0.0.jar`
   - GUI: `java -jar hes-gui/target/hes-gui-1.0.0.jar`

## Integration Points

1. **Meter Communication**:
   - DLMS/COSEM protocol
   - TCP/IP connectivity
   - Custom authentication

2. **Inter-module Communication**:
   - Shared data models
   - REST API endpoints
   - Event-driven updates

3. **External Systems**:
   - Meter data collection
   - System monitoring
   - Reporting interfaces

## Future Enhancements

1. **Planned Features**:
   - Advanced meter data analytics
   - Batch operations support
   - Enhanced security features
   - Performance optimizations

2. **Scalability Improvements**:
   - Load balancing
   - Clustering support
   - Cache implementation

## Testing Strategy

1. **Test Coverage**:
   - Unit tests
   - Integration tests
   - End-to-end testing

2. **Test Automation**:
   - Continuous Integration
   - Automated deployment
   - Performance testing 