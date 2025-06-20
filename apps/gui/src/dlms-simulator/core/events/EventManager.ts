import { CustomObisManager } from '../meter/CustomObisManager';
import { EventType } from './EventType';
import { Event } from './Event';

export interface EventConfig {
    enabled: boolean;
    pushEnabled: boolean;
    pushInterval: number;
    retentionDays: number;
}

export class EventManager {
    private customObisManager: CustomObisManager;
    private events: Event[] = [];
    private readonly maxEvents: number = 1000;
    private config: EventConfig;

    constructor(customObisManager: CustomObisManager, config: Partial<EventConfig> = {}) {
        this.customObisManager = customObisManager;
        this.config = {
            enabled: true,
            pushEnabled: true,
            pushInterval: 60000, // 1 minute
            retentionDays: 30,
            ...config
        };
    }

    public recordPowerFail(durationSeconds: number): void {
        if (!this.config.enabled) return;

        const event = new Event(
            EventType.POWER_FAIL,
            Date.now(),
            durationSeconds,
            { duration: durationSeconds }
        );
        this.addEvent(event);
        this.updatePowerFailObis(durationSeconds);
    }

    public recordTamper(type: 'magnetic' | 'terminal' | 'dc_field' | 'reverse_current'): void {
        if (!this.config.enabled) return;

        const event = new Event(
            EventType.TAMPER,
            Date.now(),
            0,
            { type }
        );
        this.addEvent(event);
        this.updateTamperObis(type);
    }

    public recordLowBattery(): void {
        if (!this.config.enabled) return;

        const event = new Event(
            EventType.LOW_BATTERY,
            Date.now(),
            0,
            { level: 10 }
        );
        this.addEvent(event);
        this.updateLowBatteryObis();
    }

    public recordPhaseReversal(): void {
        if (!this.config.enabled) return;

        const event = new Event(
            EventType.PHASE_REVERSAL,
            Date.now(),
            0,
            { phase: 'all' }
        );
        this.addEvent(event);
        this.updatePhaseReversalObis();
    }

    public recordNeutralDisconnect(): void {
        if (!this.config.enabled) return;

        const event = new Event(
            EventType.NEUTRAL_DISCONNECT,
            Date.now(),
            0,
            { status: 'disconnected' }
        );
        this.addEvent(event);
        this.updateNeutralDisconnectObis();
    }

    private addEvent(event: Event): void {
        this.events.unshift(event);
        if (this.events.length > this.maxEvents) {
            this.events.pop();
        }
    }

    private updatePowerFailObis(durationSeconds: number): void {
        const obisCode = this.customObisManager.getObisCode('POWER_FAIL_EVENT');
        this.customObisManager.setValue(obisCode, durationSeconds);
    }

    private updateTamperObis(type: string): void {
        const obisCode = this.customObisManager.getObisCode('TAMPER_EVENT');
        this.customObisManager.setValue(obisCode, 1);

        switch (type) {
            case 'magnetic':
                this.customObisManager.setValue(this.customObisManager.getObisCode('MAGNETIC_TAMPER'), 1);
                break;
            case 'terminal':
                this.customObisManager.setValue(this.customObisManager.getObisCode('TERMINAL_COVER_TAMPER'), 1);
                break;
            case 'dc_field':
                this.customObisManager.setValue(this.customObisManager.getObisCode('STRONG_DC_FIELD'), 1);
                break;
            case 'reverse_current':
                this.customObisManager.setValue(this.customObisManager.getObisCode('REVERSE_CURRENT'), 1);
                break;
        }
    }

    private updateLowBatteryObis(): void {
        const obisCode = this.customObisManager.getObisCode('LOW_BATTERY');
        this.customObisManager.setValue(obisCode, 1);
    }

    private updatePhaseReversalObis(): void {
        const obisCode = this.customObisManager.getObisCode('PHASE_REVERSAL');
        this.customObisManager.setValue(obisCode, 1);
    }

    private updateNeutralDisconnectObis(): void {
        const obisCode = this.customObisManager.getObisCode('NEUTRAL_DISCONNECT');
        this.customObisManager.setValue(obisCode, 1);
    }

    public getEvents(): Event[] {
        return [...this.events];
    }

    public getEventsByType(type: EventType): Event[] {
        return this.events.filter(event => event.type === type);
    }

    public getEventsInTimeRange(startTime: number, endTime: number): Event[] {
        return this.events.filter(event => 
            event.timestamp >= startTime && event.timestamp <= endTime
        );
    }

    public clearEvents(): void {
        this.events = [];
    }

    public updateConfig(config: Partial<EventConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public reset(): void {
        this.events = [];
        this.config = {
            enabled: true,
            pushEnabled: true,
            pushInterval: 60000,
            retentionDays: 30
        };
    }
} 