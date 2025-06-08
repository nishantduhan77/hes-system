// Set up environment variables for testing
process.env.DB_USER = 'test_user';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'dlms_simulator_test';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_PORT = '5432';

// Mock database connection
jest.mock('../dlms-simulator/database/DatabaseManager', () => {
    return {
        DatabaseManager: {
            getInstance: jest.fn().mockReturnValue({
                query: jest.fn().mockImplementation(async (sql: string, params: any[] = []) => {
                    // Mock query responses based on SQL
                    if (sql.includes('INSERT INTO security_settings')) {
                        return [{
                            id: 1,
                            securityPolicy: params[0],
                            securitySuite: params[1],
                            encryptionKey: params[2],
                            authenticationKey: params[3],
                            masterKey: params[4],
                            globalKeyChangeInterval: params[5],
                            lastKeyChange: params[6],
                            createdAt: new Date()
                        }];
                    }
                    if (sql.includes('INSERT INTO certificates')) {
                        return [{
                            id: 1,
                            entityId: params[0],
                            certificateType: params[1],
                            certificateData: params[2],
                            validFrom: params[3],
                            validUntil: params[4],
                            status: 'ACTIVE',
                            createdAt: new Date()
                        }];
                    }
                    return [];
                }),
                executeTransaction: jest.fn().mockImplementation(async (callback) => {
                    const mockClient = {
                        query: jest.fn().mockResolvedValue({ rows: [] })
                    };
                    return callback(mockClient);
                })
            })
        }
    };
}); 