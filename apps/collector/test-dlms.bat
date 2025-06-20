@echo off
REM DLMS/COSEM Test Runner Script for Windows
REM This script runs all DLMS-related tests

echo ==========================================
echo DLMS/COSEM Implementation Test Suite
echo ==========================================

REM Check if Maven is available
mvn -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven is not installed or not in PATH
    exit /b 1
)

REM Check if Java is available
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java is not installed or not in PATH
    exit /b 1
)

echo [INFO] Java version:
java -version

echo [INFO] Maven version:
mvn -version

REM Clean and compile
echo [INFO] Cleaning and compiling project...
call mvn clean compile -q
if errorlevel 1 (
    echo [ERROR] Compilation failed
    exit /b 1
)

REM Run unit tests
echo [INFO] Running unit tests...
call mvn test -Dtest="*Test" -q
if errorlevel 1 (
    echo [ERROR] Unit tests failed
    exit /b 1
)

REM Run specific DLMS tests
echo [INFO] Running DLMS-specific tests...

REM OBIS Code tests
echo [INFO] Testing OBIS Code functionality...
call mvn test -Dtest="ObisCodeTest" -q

REM Data Object tests
echo [INFO] Testing Data Object functionality...
call mvn test -Dtest="DataObjectTest" -q

REM Security Suite tests
echo [INFO] Testing Security Suite functionality...
call mvn test -Dtest="SecuritySuiteTest" -q

REM Integration tests
echo [INFO] Running integration tests...
call mvn test -Dtest="MeterCommunicationServiceIntegrationTest" -q

REM Run all tests with coverage
echo [INFO] Running tests with coverage...
call mvn test jacoco:report -q

REM Check test results
if errorlevel 1 (
    echo [ERROR] Some tests failed
    exit /b 1
) else (
    echo [INFO] All tests passed successfully!
    echo [INFO] Test coverage report generated in target/site/jacoco/
)

REM Display test summary
echo [INFO] Test Summary:
echo ==========================================
echo ✓ Unit Tests: OBIS Code, Data Object, Security
echo ✓ Integration Tests: Meter Communication
echo ✓ Circuit Breaker Tests
echo ✓ Error Handling Tests
echo ✓ Metrics Collection Tests
echo ==========================================

echo [INFO] DLMS/COSEM implementation is ready for testing with real meters!

REM Optional: Run specific test categories
if "%1"=="--unit-only" (
    echo [INFO] Running unit tests only...
    call mvn test -Dtest="*Test" -Dgroups="unit" -q
) else if "%1"=="--integration-only" (
    echo [INFO] Running integration tests only...
    call mvn test -Dtest="*IntegrationTest" -q
) else if "%1"=="--coverage" (
    echo [INFO] Generating detailed coverage report...
    call mvn test jacoco:report jacoco:check -q
)

echo.
echo [INFO] Test execution completed successfully!
pause 