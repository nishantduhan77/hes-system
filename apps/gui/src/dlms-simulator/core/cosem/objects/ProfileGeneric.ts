import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel } from '../data/Types';

/**
 * Profile Generic Class (IC: 7)
 * Manages load profile data and capture periods
 * OBIS: 1.0.99.1.0.255
 */
export class ProfileGeneric extends CosemInterfaceClass {
    private captureObjects: any[] = []; // List of objects to capture
    private capturePeriod: number = 1800; // Capture period in seconds (default 30 min)
    private sortMethod: number = 1; // 1 = FIFO, 2 = LIFO
    private sortObject: number = 0; // Sort object reference
    private entriesInUse: number = 0; // Number of entries currently in use
    private profileEntries: any[] = []; // Array of profile entries
    private maxEntries: number = 1000; // Maximum number of entries
    private buffer: any[] = []; // Buffer for new entries

    constructor() {
        super(ObisCode.fromString('1.0.99.1.0.255'), 7);
        this.initializeAttributes();
        this.initializeMethods();
    }

    private initializeAttributes(): void {
        // Attribute 2: capture_objects (array)
        this.addAttribute(2, {
            name: 'capture_objects',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.captureObjects,
            setValue: (value: any[]) => { this.captureObjects = value; }
        });

        // Attribute 3: capture_period (unsigned)
        this.addAttribute(3, {
            name: 'capture_period',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.capturePeriod,
            setValue: (value: number) => { this.capturePeriod = value; }
        });

        // Attribute 4: sort_method (enum)
        this.addAttribute(4, {
            name: 'sort_method',
            type: 'enum',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.sortMethod,
            setValue: (value: number) => { this.sortMethod = value; }
        });

        // Attribute 5: sort_object (unsigned)
        this.addAttribute(5, {
            name: 'sort_object',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.sortObject,
            setValue: (value: number) => { this.sortObject = value; }
        });

        // Attribute 6: entries_in_use (unsigned)
        this.addAttribute(6, {
            name: 'entries_in_use',
            type: 'unsigned',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.entriesInUse
        });

        // Attribute 7: profile_entries (array)
        this.addAttribute(7, {
            name: 'profile_entries',
            type: 'array',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.profileEntries
        });
    }

    private initializeMethods(): void {
        // Method 1: reset()
        this.addMethod(1, {
            name: 'reset',
            execute: () => {
                this.profileEntries = [];
                this.entriesInUse = 0;
                this.buffer = [];
                return { success: true, message: 'Profile reset' };
            }
        });

        // Method 2: capture()
        this.addMethod(2, {
            name: 'capture',
            execute: () => {
                const entry = this.createProfileEntry();
                this.addEntry(entry);
                return { success: true, message: 'Profile captured' };
            }
        });

        // Method 3: get_entries()
        this.addMethod(3, {
            name: 'get_entries',
            execute: (params: { from?: number, to?: number }) => {
                const from = params.from || 0;
                const to = params.to || this.profileEntries.length;
                return this.profileEntries.slice(from, to);
            }
        });

        // Method 4: set_capture_period()
        this.addMethod(4, {
            name: 'set_capture_period',
            execute: (period: number) => {
                this.capturePeriod = period;
                return { success: true, message: `Capture period set to ${period} seconds` };
            }
        });

        // Method 5: add_capture_object()
        this.addMethod(5, {
            name: 'add_capture_object',
            execute: (object: any) => {
                this.captureObjects.push(object);
                return { success: true, message: 'Capture object added' };
            }
        });
    }

    /**
     * Create a new profile entry with current values
     */
    private createProfileEntry(): any {
        const entry = {
            timestamp: new Date(),
            values: []
        };

        // Simulate captured values for each capture object
        for (const obj of this.captureObjects) {
            entry.values.push({
                object: obj,
                value: Math.random() * 1000 // Simulate meter reading
            });
        }

        return entry;
    }

    /**
     * Add entry to profile with FIFO/LIFO logic
     */
    private addEntry(entry: any): void {
        if (this.sortMethod === 1) { // FIFO
            this.profileEntries.push(entry);
        } else { // LIFO
            this.profileEntries.unshift(entry);
        }

        this.entriesInUse = this.profileEntries.length;

        // Maintain max entries limit
        if (this.profileEntries.length > this.maxEntries) {
            if (this.sortMethod === 1) { // FIFO - remove oldest
                this.profileEntries.shift();
            } else { // LIFO - remove newest
                this.profileEntries.pop();
            }
            this.entriesInUse = this.profileEntries.length;
        }
    }

    /**
     * Get capture period in seconds
     */
    public getCapturePeriod(): number {
        return this.capturePeriod;
    }

    /**
     * Get capture period description
     */
    public getCapturePeriodDescription(): string {
        const minutes = Math.floor(this.capturePeriod / 60);
        if (minutes === 1) return '1 minute';
        if (minutes < 60) return `${minutes} minutes`;
        
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour';
        return `${hours} hours`;
    }

    /**
     * Get number of entries currently stored
     */
    public getEntriesCount(): number {
        return this.entriesInUse;
    }

    /**
     * Get maximum number of entries
     */
    public getMaxEntries(): number {
        return this.maxEntries;
    }

    /**
     * Check if profile is full
     */
    public isFull(): boolean {
        return this.entriesInUse >= this.maxEntries;
    }

    /**
     * Get latest profile entry
     */
    public getLatestEntry(): any {
        if (this.profileEntries.length === 0) return null;
        return this.profileEntries[this.profileEntries.length - 1];
    }

    /**
     * Get entries for a specific time range
     */
    public getEntriesForRange(startTime: Date, endTime: Date): any[] {
        return this.profileEntries.filter(entry => 
            entry.timestamp >= startTime && entry.timestamp <= endTime
        );
    }
} 