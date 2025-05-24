# HES System

Head End System for Smart Meter Management

## Documentation
For detailed system architecture and implementation details, please see [ARCHITECTURE.md](ARCHITECTURE.md).

## Quick Start

1. Build the project:
```bash
mvn clean install
```

2. Run the console interface:
```bash
cd hes-console
java -jar target/hes-console-1.0.0.jar
```

3. Available commands:
- `meter-add -i <meter-id> -s <serial-number> -m <manufacturer> -a <ip-address> -p <port>`
- `meter-list`
- `meter-connect -i <meter-id>`
- `meter-read -i <meter-id>`
- `meter-disconnect -i <meter-id>`

## Modules

- **shared**: Common models and utilities
- **hes-console**: Command-line interface
- **hes-microservice**: RESTful service
- **hes-gui**: Web interface
