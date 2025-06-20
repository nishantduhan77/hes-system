import { MeterCommandService } from '../core/commands/MeterCommandService';
import { expect } from 'chai';

describe('MeterCommandService', () => {
    let commandService: MeterCommandService;

    beforeEach(() => {
        commandService = new MeterCommandService();
    });

    describe('Communication Settings', () => {
        it('should set server endpoint', () => {
            const result = commandService.setServerEndpoint('192.168.1.100', 4059);
            expect(result.success).to.be.true;
            expect(result.message).to.include('192.168.1.100:4059');
        });

        it('should set APN', () => {
            const result = commandService.setAPN('internet.mnc001.mcc001.gprs');
            expect(result.success).to.be.true;
            expect(result.message).to.include('internet.mnc001.mcc001.gprs');
        });

        it('should set push configuration', () => {
            const config = {
                pushObjectList: ['1.0.99.1.0.255'],
                sendDestinationAndMethod: {
                    destination: '192.168.1.100:4059',
                    method: 'TCP'
                },
                communicationWindow: {
                    startTime: '00:00',
                    endTime: '23:59'
                }
            };
            const result = commandService.setPushConfiguration(config);
            expect(result.success).to.be.true;
        });
    });

    describe('Control & Operational Commands', () => {
        it('should connect meter', () => {
            const result = commandService.connectMeter();
            expect(result.success).to.be.true;
            expect(result.message).to.equal('Meter connected');
            expect(result.timestamp).to.be.instanceOf(Date);
        });

        it('should disconnect meter', () => {
            const result = commandService.disconnectMeter();
            expect(result.success).to.be.true;
            expect(result.message).to.equal('Meter disconnected');
            expect(result.timestamp).to.be.instanceOf(Date);
        });

        it('should set load threshold', () => {
            const result = commandService.setLoadThreshold(5000, 2000, 6000);
            expect(result.success).to.be.true;
            expect(result.message).to.include('5000W');
            expect(result.message).to.include('2000var');
            expect(result.message).to.include('6000VA');
        });

        it('should activate emergency profile', () => {
            const result = commandService.activateEmergencyProfile();
            expect(result.success).to.be.true;
            expect(result.message).to.equal('Emergency profile activated');
        });
    });

    describe('Billing Configuration', () => {
        it('should set valid billing date', () => {
            const result = commandService.setBillingDate(15);
            expect(result.success).to.be.true;
            expect(result.message).to.include('15th');
        });

        it('should reject invalid billing date', () => {
            const result = commandService.setBillingDate(32);
            expect(result.success).to.be.false;
            expect(result.message).to.include('between 1 and 31');
        });

        it('should get billing date', () => {
            const result = commandService.getBillingDate();
            expect(result.success).to.be.true;
            expect(result.billingDate).to.be.a('number');
        });
    });

    describe('Load Profile & TOU', () => {
        it('should set profile period', () => {
            const result = commandService.setProfilePeriod(300);
            expect(result.success).to.be.true;
            expect(result.period).to.equal(300);
            expect(result.message).to.include('300 seconds');
        });

        it('should set TOU schedule', () => {
            const seasonProfiles = [
                { name: 'Summer', startDate: '2024-06-01', weekProfile: 'SummerWeek' }
            ];
            const weekProfiles = [
                { name: 'SummerWeek', monday: 'SummerDay', tuesday: 'SummerDay' }
            ];
            const dayProfiles = [
                { name: 'SummerDay', startTime: '00:00', tariff: 1 }
            ];

            const result = commandService.setTOUSchedule(seasonProfiles, weekProfiles, dayProfiles);
            expect(result.success).to.be.true;
            expect(result.message).to.include('1 seasons');
        });

        it('should get current TOU tariff', () => {
            const result = commandService.getCurrentTOUTariff();
            expect(result.success).to.be.true;
            expect(result.tariff).to.be.a('number');
            expect(result.description).to.be.a('string');
        });
    });

    describe('Firmware & Metadata', () => {
        it('should get nameplate details', () => {
            const result = commandService.getNameplateDetails();
            expect(result.success).to.be.true;
            expect(result.make).to.equal('SmartMeter Corp');
            expect(result.model).to.equal('SM-2000');
            expect(result.serialNumber).to.match(/^SM2000\d+$/);
        });

        it('should initiate firmware upgrade', () => {
            const firmwareData = {
                version: '2.2.0',
                size: '2.5MB',
                checksum: 'abc123'
            };
            const result = commandService.initiateFirmwareUpgrade(firmwareData);
            expect(result.success).to.be.true;
            expect(result.message).to.equal('Firmware upgrade initiated');
            expect(result.firmwareSize).to.equal('2.5MB');
        });
    });

    describe('Utility Methods', () => {
        it('should get available commands', () => {
            const result = commandService.getAvailableCommands();
            expect(result).to.have.property('communication');
            expect(result).to.have.property('control');
            expect(result).to.have.property('billing');
            expect(result).to.have.property('profile');
            expect(result).to.have.property('firmware');
        });

        it('should execute command by name', () => {
            const result = commandService.executeCommand('setServerEndpoint', '192.168.1.100', 4059);
            expect(result.success).to.be.true;
            expect(result.message).to.include('192.168.1.100:4059');
        });

        it('should get command documentation', () => {
            const result = commandService.getCommandDocumentation();
            expect(result).to.be.an('object');
            expect(result).to.have.property('commands');
            expect(result).to.have.property('parameters');
        });
    });
}); 