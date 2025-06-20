import { DisconnectControl } from '../cosem/objects/DisconnectControl';
import { Limiter } from '../cosem/objects/Limiter';
import { ProfileGeneric } from '../cosem/objects/ProfileGeneric';
import { ActivityCalendar } from '../cosem/objects/ActivityCalendar';
import { Data } from '../cosem/objects/Data';
import { ConfigurationParameters } from '../cosem/objects/ConfigurationParameters';
import { ObisCode } from '../cosem/obis/ObisCode';

/**
 * Comprehensive Meter Command Service
 * Handles all 21 DLMS/COSEM features for smart meter control
 */
export class MeterCommandService {
    private disconnectControl: DisconnectControl;
    private limiter: Limiter;
    private profileGeneric: ProfileGeneric;
    private activityCalendar: ActivityCalendar;
    private configurationParams: ConfigurationParameters;
    private communicationData: Map<string, Data> = new Map();

    constructor() {
        this.disconnectControl = new DisconnectControl();
        this.limiter = new Limiter();
        this.profileGeneric = new ProfileGeneric();
        this.activityCalendar = new ActivityCalendar();
        this.configurationParams = new ConfigurationParameters();
        this.initializeCommunicationData();
    }

    private initializeCommunicationData(): void {
        // Communication Settings (OBIS: 1.0.0.x.0.255)
        this.communicationData.set('1.0.0.2.0.255', new Data(ObisCode.fromString('1.0.0.2.0.255'), 'octet-string')); // APN
        this.communicationData.set('1.0.0.5.0.255', new Data(ObisCode.fromString('1.0.0.5.0.255'), 'octet-string')); // Server IP/Port
        this.communicationData.set('0.x.25.9.0.255', new Data(ObisCode.fromString('0.x.25.9.0.255'), 'structure')); // Push Setup
    }

    // ==================== COMMUNICATION SETTINGS ====================

    /**
     * Set Server IP/Port (OBIS: 1.0.0.5.0.255)
     */
    public setServerEndpoint(ip: string, port: number): any {
        const serverData = this.communicationData.get('1.0.0.5.0.255');
        if (serverData) {
            serverData.setValue(`${ip}:${port}`);
            return { success: true, message: `Server endpoint set to ${ip}:${port}` };
        }
        return { success: false, message: 'Server endpoint data object not found' };
    }

    /**
     * Set APN (OBIS: 1.0.0.2.0.255)
     */
    public setAPN(apn: string): any {
        const apnData = this.communicationData.get('1.0.0.2.0.255');
        if (apnData) {
            apnData.setValue(apn);
            return { success: true, message: `APN set to ${apn}` };
        }
        return { success: false, message: 'APN data object not found' };
    }

    /**
     * Set Push Configuration (OBIS: 0.x.25.9.0.255)
     */
    public setPushConfiguration(config: any): any {
        const pushData = this.communicationData.get('0.x.25.9.0.255');
        if (pushData) {
            pushData.setValue(config);
            return { success: true, message: 'Push configuration updated' };
        }
        return { success: false, message: 'Push configuration data object not found' };
    }

    // ==================== CONTROL & OPERATIONAL COMMANDS ====================

    /**
     * Relay Connect/Disconnect (OBIS: 0.0.96.3.10.255, IC: 70)
     */
    public connectMeter(): any {
        // Simulate connect operation
        return { success: true, message: 'Meter connected', timestamp: new Date() };
    }

    public disconnectMeter(): any {
        // Simulate disconnect operation
        return { success: true, message: 'Meter disconnected', timestamp: new Date() };
    }

    public remoteConnectMeter(): any {
        // Simulate remote connect operation
        return { success: true, message: 'Remote connect successful', timestamp: new Date() };
    }

    public remoteDisconnectMeter(): any {
        // Simulate remote disconnect operation
        return { success: true, message: 'Remote disconnect successful', timestamp: new Date() };
    }

    /**
     * Load Curtailment (OBIS: 0.0.17.0.0.255, IC: 71)
     */
    public setLoadThreshold(active: number, reactive?: number, apparent?: number): any {
        // Simulate setting load threshold
        return { 
            success: true, 
            message: `Load threshold set - Active: ${active}W${reactive ? `, Reactive: ${reactive}var` : ''}${apparent ? `, Apparent: ${apparent}VA` : ''}`,
            timestamp: new Date()
        };
    }

    public setLoadLimit(limit: number): any {
        // Simulate setting load limit
        return { success: true, message: `Load limit set to ${limit}W`, timestamp: new Date() };
    }

    public activateEmergencyProfile(): any {
        // Simulate emergency profile activation
        return { success: true, message: 'Emergency profile activated', timestamp: new Date() };
    }

    public deactivateEmergencyProfile(): any {
        // Simulate emergency profile deactivation
        return { success: true, message: 'Emergency profile deactivated', timestamp: new Date() };
    }

    // ==================== BILLING CONFIGURATION ====================

    /**
     * Set Billing Date (OBIS: 0.0.10.0.0.255)
     */
    public setBillingDate(dayOfMonth: number): any {
        if (dayOfMonth < 1 || dayOfMonth > 31) {
            return { success: false, message: 'Billing date must be between 1 and 31' };
        }
        return { success: true, message: `Billing date set to ${dayOfMonth}th of each month`, timestamp: new Date() };
    }

    /**
     * Get Billing Date
     */
    public getBillingDate(): any {
        return { success: true, billingDate: 1, message: 'Billing date is 1st of each month' };
    }

    // ==================== LOAD PROFILE & TOU ====================

    /**
     * Set Profile Period (OBIS: 1.0.99.1.0.255, IC: 7)
     */
    public setProfilePeriod(periodSeconds: number): any {
        // Simulate setting profile period
        const minutes = Math.floor(periodSeconds / 60);
        return { 
            success: true, 
            message: `Profile period set to ${periodSeconds} seconds (${minutes} minutes)`,
            period: periodSeconds,
            timestamp: new Date()
        };
    }

    /**
     * Get Profile Period
     */
    public getProfilePeriod(): any {
        const period = this.profileGeneric.getCapturePeriod();
        return { 
            success: true, 
            period, 
            description: this.profileGeneric.getCapturePeriodDescription() 
        };
    }

    /**
     * Set TOU Schedule (OBIS: 0.0.13.0.0.255, IC: 20)
     */
    public setTOUSchedule(seasonProfiles: any[], weekProfiles: any[], dayProfiles: any[]): any {
        // Simulate TOU schedule update
        return { 
            success: true, 
            message: `TOU schedule updated - ${seasonProfiles.length} seasons, ${weekProfiles.length} weeks, ${dayProfiles.length} days`,
            timestamp: new Date()
        };
    }

    /**
     * Get Current TOU Tariff
     */
    public getCurrentTOUTariff(): any {
        const tariff = this.activityCalendar.getTariffForDateTime(new Date());
        const description = this.activityCalendar.getCurrentTariffDescription();
        return { success: true, tariff, description };
    }

    // ==================== FIRMWARE & METADATA ====================

    /**
     * Get Nameplate Details (OBIS: 0.0.96.1.0.255)
     */
    public getNameplateDetails(): any {
        return {
            success: true,
            make: 'SmartMeter Corp',
            model: 'SM-2000',
            version: '2.1.0',
            serialNumber: 'SM2000123456789',
            firmwareVersion: 'FW-2.1.0-2024',
            timestamp: new Date()
        };
    }

    /**
     * Firmware Upgrade (OBIS: 0.0.44.0.0.255, IC: 18)
     */
    public initiateFirmwareUpgrade(firmwareData: any): any {
        // Simulate firmware upgrade
        return { 
            success: true, 
            message: 'Firmware upgrade initiated', 
            firmwareSize: firmwareData?.size || 'Unknown',
            timestamp: new Date()
        };
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get all available commands
     */
    public getAvailableCommands(): any {
        return {
            communication: [
                'setServerEndpoint(ip, port)',
                'setAPN(apn)',
                'setPushConfiguration(config)'
            ],
            control: [
                'connectMeter()',
                'disconnectMeter()',
                'remoteConnectMeter()',
                'remoteDisconnectMeter()',
                'setLoadThreshold(active, reactive, apparent)',
                'setLoadLimit(limit)',
                'activateEmergencyProfile()',
                'deactivateEmergencyProfile()'
            ],
            billing: [
                'setBillingDate(dayOfMonth)',
                'getBillingDate()'
            ],
            profile: [
                'setProfilePeriod(periodSeconds)',
                'getProfilePeriod()',
                'setTOUSchedule(seasonProfiles, weekProfiles, dayProfiles)',
                'getCurrentTOUTariff()'
            ],
            firmware: [
                'getNameplateDetails()',
                'initiateFirmwareUpgrade(firmwareData)'
            ]
        };
    }

    /**
     * Get meter status summary
     */
    public getMeterStatus(): any {
        return {
            connection: this.disconnectControl.isConnected() ? 'Connected' : 'Disconnected',
            controlMode: this.disconnectControl.getControlModeDescription(),
            loadLimit: this.limiter.getLoadLimit(),
            emergencyActive: this.limiter.isEmergencyActive(),
            currentTariff: this.activityCalendar.getCurrentTariffDescription(),
            profilePeriod: this.profileGeneric.getCapturePeriodDescription(),
            entriesCount: this.profileGeneric.getEntriesCount(),
            timestamp: new Date()
        };
    }

    /**
     * Execute command by name and parameters
     */
    public executeCommand(commandName: string, ...params: any[]): any {
        const methodMap: { [key: string]: Function } = {
            'connectMeter': () => this.connectMeter(),
            'disconnectMeter': () => this.disconnectMeter(),
            'remoteConnectMeter': () => this.remoteConnectMeter(),
            'remoteDisconnectMeter': () => this.remoteDisconnectMeter(),
            'setLoadThreshold': () => this.setLoadThreshold(params[0], params[1], params[2]),
            'setLoadLimit': () => this.setLoadLimit(params[0]),
            'activateEmergencyProfile': () => this.activateEmergencyProfile(),
            'deactivateEmergencyProfile': () => this.deactivateEmergencyProfile(),
            'setBillingDate': () => this.setBillingDate(params[0]),
            'getBillingDate': () => this.getBillingDate(),
            'setProfilePeriod': () => this.setProfilePeriod(params[0]),
            'getProfilePeriod': () => this.getProfilePeriod(),
            'getCurrentTOUTariff': () => this.getCurrentTOUTariff(),
            'getNameplateDetails': () => this.getNameplateDetails(),
            'getMeterStatus': () => this.getMeterStatus()
        };

        const method = methodMap[commandName];
        if (method) {
            return method();
        }

        return { success: false, message: `Unknown command: ${commandName}` };
    }

    /**
     * Get command documentation with OBIS codes
     */
    public getCommandDocumentation(): any {
        return {
            communication: {
                'setServerEndpoint': { obis: '1.0.0.5.0.255', ic: 1, description: 'Set HES server IP/Port' },
                'setAPN': { obis: '1.0.0.2.0.255', ic: 1, description: 'Set GPRS APN' },
                'setPushConfiguration': { obis: '0.x.25.9.0.255', ic: 40, description: 'Configure push settings' }
            },
            control: {
                'connectMeter': { obis: '0.0.96.3.10.255', ic: 70, description: 'Connect meter relay' },
                'disconnectMeter': { obis: '0.0.96.3.10.255', ic: 70, description: 'Disconnect meter relay' },
                'setLoadThreshold': { obis: '0.0.17.0.0.255', ic: 71, description: 'Set load curtailment threshold' },
                'setLoadLimit': { obis: '0.0.17.0.0.255', ic: 71, description: 'Set maximum load limit' }
            },
            billing: {
                'setBillingDate': { obis: '0.0.10.0.0.255', ic: 1, description: 'Set monthly billing date' },
                'getBillingDate': { obis: '0.0.10.0.0.255', ic: 1, description: 'Get current billing date' }
            },
            profile: {
                'setProfilePeriod': { obis: '1.0.99.1.0.255', ic: 7, description: 'Set load profile capture period' },
                'setTOUSchedule': { obis: '0.0.13.0.0.255', ic: 20, description: 'Set Time-of-Use tariff schedule' }
            },
            firmware: {
                'getNameplateDetails': { obis: '0.0.96.1.0.255', ic: 1, description: 'Get meter specifications' },
                'initiateFirmwareUpgrade': { obis: '0.0.44.0.0.255', ic: 18, description: 'Start firmware upgrade' }
            }
        };
    }
} 