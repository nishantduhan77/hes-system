# HES System - Proposed Folder Structure

```
hes-system/
├── apps/                      # All application components
│   ├── gui/                   # Frontend application
│   │   ├── src/              # Source code
│   │   ├── public/           # Public assets
│   │   └── tests/            # Frontend tests
│   ├── collector/            # Data collector service
│   │   ├── src/
│   │   └── tests/
│   ├── console/              # Management console
│   │   ├── src/
│   │   └── tests/
│   └── microservices/        # Various microservices
│       ├── meter-service/
│       ├── reading-service/
│       └── notification-service/
│
├── shared/                    # Shared libraries and utilities
│   ├── common/               # Common utilities
│   ├── models/               # Shared data models
│   └── config/               # Shared configurations
│
├── database/                  # Database related files
│   ├── migrations/           # Database migrations
│   ├── schemas/              # Database schemas
│   └── scripts/              # Database scripts
│
├── tools/                    # Development and maintenance tools
│   ├── monitoring/           # Monitoring scripts
│   ├── deployment/           # Deployment scripts
│   └── testing/              # Testing utilities
│
├── docs/                     # Documentation
│   ├── architecture/         # Architecture documents
│   ├── api/                  # API documentation
│   └── guides/              # User and developer guides
│
├── tests/                    # Integration and E2E tests
│   ├── integration/
│   └── e2e/
│
└── docker/                   # Docker configurations
    ├── development/
    └── production/
```

## Directory Structure Explanation

### 1. apps/
- Contains all main application components
- Each component has its own source code, tests, and configuration
- Clearly separates different parts of the system

### 2. shared/
- Houses code shared between different applications
- Prevents code duplication
- Ensures consistency across the system

### 3. database/
- Centralizes all database-related code
- Makes database management and migrations easier
- Keeps schemas and scripts organized

### 4. tools/
- Contains all development and maintenance tools
- Separates tools from application code
- Makes it easier to find and maintain utilities

### 5. docs/
- Centralized documentation
- Well-organized by type and purpose
- Easy to maintain and update

### 6. tests/
- System-level tests
- Integration tests between components
- End-to-end testing

### 7. docker/
- Docker configurations for different environments
- Keeps deployment configurations organized
- Separates development and production setups

## Benefits of This Structure

1. **Clear Separation of Concerns**
   - Each directory has a specific purpose
   - Easy to locate specific components
   - Prevents mixing of different types of code

2. **Scalability**
   - Easy to add new components
   - Clear places for new features
   - Maintains organization as system grows

3. **Maintainability**
   - Easy to find and fix issues
   - Clear organization for documentation
   - Simplified deployment process

4. **Development Efficiency**
   - Clear structure for developers
   - Reduced confusion about file locations
   - Easier onboarding for new team members

## Migration Plan

To migrate to this structure:

1. Create the new directory structure
2. Move files to their appropriate locations
3. Update import paths and dependencies
4. Update build and deployment scripts
5. Test the system thoroughly
6. Update documentation to reflect new structure

## Next Steps

1. Review the proposed structure
2. Plan the migration timeline
3. Create a backup of the current system
4. Execute the migration in phases
5. Validate each phase before proceeding 