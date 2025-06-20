import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel } from '../data/Types';

/**
 * Limiter Class (IC: 71)
 * Controls load curtailment and demand limiting
 * OBIS: 0.0.17.0.0.255
 */
export class Limiter extends CosemInterfaceClass {
    private thresholdActive: number = 0; // Active power threshold in watts
    private thresholdReactive: number = 0; // Reactive power threshold in var
    private thresholdApparent: number = 0; // Apparent power threshold in VA
    private minOverThresholdDuration: number = 0; // Minimum duration in seconds
    private minUnderThresholdDuration: number = 0; // Minimum duration in seconds
    private emergencyProfile: number = 0; // Emergency profile ID
    private emergencyProfileActive: boolean = false; // Is emergency profile active
    private loadLimit: number = 0; // Current load limit in watts
    private status: number = 0; // 0 = normal, 1 = threshold exceeded, 2 = emergency

    constructor() {
        super(ObisCode.fromString('0.0.17.0.0.255'), 71);
        this.initializeAttributes();
        this.initializeMethods();
    }

    private initializeAttributes(): void {
        // Attribute 2: threshold_active (float)
        this.addAttribute(2, {
            name: 'threshold_active',
            type: 'float',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.thresholdActive,
            setValue: (value: number) => { this.thresholdActive = value; }
        });

        // Attribute 3: threshold_reactive (float)
        this.addAttribute(3, {
            name: 'threshold_reactive',
            type: 'float',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.thresholdReactive,
            setValue: (value: number) => { this.thresholdReactive = value; }
        });

        // Attribute 4: threshold_apparent (float)
        this.addAttribute(4, {
            name: 'threshold_apparent',
            type: 'float',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.thresholdApparent,
            setValue: (value: number) => { this.thresholdApparent = value; }
        });

        // Attribute 5: min_over_threshold_duration (unsigned)
        this.addAttribute(5, {
            name: 'min_over_threshold_duration',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.minOverThresholdDuration,
            setValue: (value: number) => { this.minOverThresholdDuration = value; }
        });

        // Attribute 6: min_under_threshold_duration (unsigned)
        this.addAttribute(6, {
            name: 'min_under_threshold_duration',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.minUnderThresholdDuration,
            setValue: (value: number) => { this.minUnderThresholdDuration = value; }
        });

        // Attribute 7: emergency_profile (unsigned)
        this.addAttribute(7, {
            name: 'emergency_profile',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.emergencyProfile,
            setValue: (value: number) => { this.emergencyProfile = value; }
        });

        // Attribute 8: emergency_profile_active (boolean)
        this.addAttribute(8, {
            name: 'emergency_profile_active',
            type: 'boolean',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.emergencyProfileActive
        });

        // Attribute 9: load_limit (float)
        this.addAttribute(9, {
            name: 'load_limit',
            type: 'float',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.loadLimit,
            setValue: (value: number) => { this.loadLimit = value; }
        });

        // Attribute 10: status (enum)
        this.addAttribute(10, {
            name: 'status',
            type: 'enum',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.status
        });
    }

    private initializeMethods(): void {
        // Method 1: set_threshold()
        this.addMethod(1, {
            name: 'set_threshold',
            execute: (params: { active?: number, reactive?: number, apparent?: number }) => {
                if (params.active !== undefined) this.thresholdActive = params.active;
                if (params.reactive !== undefined) this.thresholdReactive = params.reactive;
                if (params.apparent !== undefined) this.thresholdApparent = params.apparent;
                return { success: true, message: 'Thresholds updated' };
            }
        });

        // Method 2: set_load_limit()
        this.addMethod(2, {
            name: 'set_load_limit',
            execute: (limit: number) => {
                this.loadLimit = limit;
                return { success: true, message: `Load limit set to ${limit}W` };
            }
        });

        // Method 3: activate_emergency_profile()
        this.addMethod(3, {
            name: 'activate_emergency_profile',
            execute: () => {
                this.emergencyProfileActive = true;
                this.status = 2; // emergency
                return { success: true, message: 'Emergency profile activated' };
            }
        });

        // Method 4: deactivate_emergency_profile()
        this.addMethod(4, {
            name: 'deactivate_emergency_profile',
            execute: () => {
                this.emergencyProfileActive = false;
                this.status = 0; // normal
                return { success: true, message: 'Emergency profile deactivated' };
            }
        });

        // Method 5: reset()
        this.addMethod(5, {
            name: 'reset',
            execute: () => {
                this.status = 0;
                this.emergencyProfileActive = false;
                return { success: true, message: 'Limiter reset' };
            }
        });
    }

    /**
     * Check if current load exceeds threshold
     */
    public checkThreshold(currentActive: number, currentReactive: number, currentApparent: number): boolean {
        const activeExceeded = this.thresholdActive > 0 && currentActive > this.thresholdActive;
        const reactiveExceeded = this.thresholdReactive > 0 && currentReactive > this.thresholdReactive;
        const apparentExceeded = this.thresholdApparent > 0 && currentApparent > this.thresholdApparent;
        
        if (activeExceeded || reactiveExceeded || apparentExceeded) {
            this.status = 1; // threshold exceeded
            return true;
        }
        
        this.status = 0; // normal
        return false;
    }

    /**
     * Get status description
     */
    public getStatusDescription(): string {
        switch (this.status) {
            case 0: return 'Normal';
            case 1: return 'Threshold Exceeded';
            case 2: return 'Emergency';
            default: return 'Unknown';
        }
    }

    /**
     * Get current load limit in watts
     */
    public getLoadLimit(): number {
        return this.loadLimit;
    }

    /**
     * Check if emergency profile is active
     */
    public isEmergencyActive(): boolean {
        return this.emergencyProfileActive;
    }
} 