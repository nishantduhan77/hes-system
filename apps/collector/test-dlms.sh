#!/bin/bash

# DLMS/COSEM Test Runner Script
# This script runs all DLMS-related tests

set -e

echo "=========================================="
echo "DLMS/COSEM Implementation Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Maven is available
if ! command -v mvn &> /dev/null; then
    print_error "Maven is not installed or not in PATH"
    exit 1
fi

# Check if Java is available
if ! command -v java &> /dev/null; then
    print_error "Java is not installed or not in PATH"
    exit 1
fi

print_status "Java version:"
java -version

print_status "Maven version:"
mvn -version

# Clean and compile
print_status "Cleaning and compiling project..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    print_error "Compilation failed"
    exit 1
fi

# Run unit tests
print_status "Running unit tests..."
mvn test -Dtest="*Test" -q

if [ $? -ne 0 ]; then
    print_error "Unit tests failed"
    exit 1
fi

# Run specific DLMS tests
print_status "Running DLMS-specific tests..."

# OBIS Code tests
print_status "Testing OBIS Code functionality..."
mvn test -Dtest="ObisCodeTest" -q

# Data Object tests
print_status "Testing Data Object functionality..."
mvn test -Dtest="DataObjectTest" -q

# Security Suite tests
print_status "Testing Security Suite functionality..."
mvn test -Dtest="SecuritySuiteTest" -q

# Integration tests
print_status "Running integration tests..."
mvn test -Dtest="MeterCommunicationServiceIntegrationTest" -q

# Run all tests with coverage
print_status "Running tests with coverage..."
mvn test jacoco:report -q

# Check test results
if [ $? -eq 0 ]; then
    print_status "All tests passed successfully!"
    print_status "Test coverage report generated in target/site/jacoco/"
else
    print_error "Some tests failed"
    exit 1
fi

# Display test summary
print_status "Test Summary:"
echo "=========================================="
echo "✓ Unit Tests: OBIS Code, Data Object, Security"
echo "✓ Integration Tests: Meter Communication"
echo "✓ Circuit Breaker Tests"
echo "✓ Error Handling Tests"
echo "✓ Metrics Collection Tests"
echo "=========================================="

print_status "DLMS/COSEM implementation is ready for testing with real meters!"

# Optional: Run specific test categories
if [ "$1" = "--unit-only" ]; then
    print_status "Running unit tests only..."
    mvn test -Dtest="*Test" -Dgroups="unit" -q
elif [ "$1" = "--integration-only" ]; then
    print_status "Running integration tests only..."
    mvn test -Dtest="*IntegrationTest" -q
elif [ "$1" = "--coverage" ]; then
    print_status "Generating detailed coverage report..."
    mvn test jacoco:report jacoco:check -q
fi

echo ""
print_status "Test execution completed successfully!" 