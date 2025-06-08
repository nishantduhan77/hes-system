# DLMS/COSEM Simulator

A TypeScript-based DLMS/COSEM protocol simulator implementing IS 15959 standards for GPRS-enabled electric meters.

## Project Structure

```
src/
├── core/
│   ├── dlms/
│   │   ├── application/    # DLMS application layer
│   │   ├── transport/      # Transport layer protocols
│   │   └── security/       # Security features
│   ├── cosem/
│   │   ├── objects/        # COSEM interface classes
│   │   ├── obis/          # OBIS code handling
│   │   └── data/          # Data types and structures
│   ├── communication/
│   │   ├── serial/        # Serial communication
│   │   ├── tcp/           # TCP/IP communication
│   │   └── hdlc/          # HDLC protocol
│   ├── simulator/
│   │   ├── meter/         # Meter simulation
│   │   ├── data-generator/ # Load profile generation
│   │   └── events/        # Event simulation
│   └── utils/             # Utility functions
├── test/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── conformance/      # Standard conformance tests
├── config/
│   ├── meter-templates/  # Meter configuration templates
│   ├── obis-codes/      # OBIS code mappings
│   └── security/        # Security configurations
└── docs/
    ├── api/             # API documentation
    └── specs/           # Implementation specifications
```

## Features

1. Core DLMS/COSEM Implementation
   - Base interface classes
   - OBIS code handling
   - Data types and structures
   - Access control

2. Security Features
   - Low/High Level Security
   - AES-GCM encryption
   - GMAC authentication
   - Key management

3. Communication
   - GPRS support
   - HDLC protocol
   - TCP/IP capability
   - Connection management

4. Data Generation
   - Realistic electrical parameters
   - Time-based load patterns
   - IS 15959 compliance
   - Event simulation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Start the simulator:
   ```bash
   npm start
   ```

## Development

1. Start in development mode:
   ```bash
   npm run dev
   ```

2. Run linter:
   ```bash
   npm run lint
   ```

## Configuration

The simulator can be configured through JSON files in the `config` directory:

1. `config/meter-templates/`: Meter configuration templates
2. `config/obis-codes/`: OBIS code mappings
3. `config/security/`: Security settings

## Testing

The project includes three types of tests:

1. Unit Tests: Testing individual components
2. Integration Tests: Testing component interactions
3. Conformance Tests: Ensuring IS 15959 compliance

Run specific test suites:
```bash
npm run test:unit
npm run test:integration
npm run test:conformance
```

## Documentation

- API documentation is available in the `docs/api` directory
- Implementation specifications are in `docs/specs`
- Generate documentation:
  ```bash
  npm run docs
  ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC 