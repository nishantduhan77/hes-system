import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel } from '../data/Types';

/**
 * Disconnect Control Class (IC: 70)
 * Controls the relay for connect/disconnect operations
 * OBIS: 0.0.96.3.10.255
 */
export class DisconnectControl extends CosemInterfaceClass {
    private outputState: boolean = true; // true = connected, false = disconnected
    private controlState: number = 0; // 0 = ready, 1 = connected, 2 = disconnected
    private controlMode: number = 0; // 0 = direct, 1 = remote, 2 = automatic

    constructor() {
        super(ObisCode.fromString('0.0.96.3.10.255'), 70);
        this.initializeAttributes();
        this.initializeMethods();
    }

    private initializeAttributes(): void {
        // Attribute 2: output_state (boolean)
        this.addAttribute(2, {
            name: 'output_state',
            type: 'boolean',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.outputState,
            setValue: (value: boolean) => { this.outputState = value; }
        });

        // Attribute 3: control_state (enum)
        this.addAttribute(3, {
            name: 'control_state',
            type: 'enum',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.controlState
        });

        // Attribute 4: control_mode (enum)
        this.addAttribute(4, {
            name: 'control_mode',
            type: 'enum',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.controlMode,
            setValue: (value: number) => { this.controlMode = value; }
        });
    }

    private initializeMethods(): void {
        // Method 1: disconnect()
        this.addMethod(1, {
            name: 'disconnect',
            execute: () => {
                this.outputState = false;
                this.controlState = 2; // disconnected
                return { success: true, message: 'Meter disconnected' };
            }
        });

        // Method 2: connect()
        this.addMethod(2, {
            name: 'connect',
            execute: () => {
                this.outputState = true;
                this.controlState = 1; // connected
                return { success: true, message: 'Meter connected' };
            }
        });

        // Method 3: remote_disconnect()
        this.addMethod(3, {
            name: 'remote_disconnect',
            execute: () => {
                if (this.controlMode === 1 || this.controlMode === 2) { // remote or automatic
                    this.outputState = false;
                    this.controlState = 2;
                    return { success: true, message: 'Remote disconnect successful' };
                }
                return { success: false, message: 'Remote control not enabled' };
            }
        });

        // Method 4: remote_connect()
        this.addMethod(4, {
            name: 'remote_connect',
            execute: () => {
                if (this.controlMode === 1 || this.controlMode === 2) { // remote or automatic
                    this.outputState = true;
                    this.controlState = 1;
                    return { success: true, message: 'Remote connect successful' };
                }
                return { success: false, message: 'Remote control not enabled' };
            }
        });
    }

    /**
     * Get current connection status
     */
    public isConnected(): boolean {
        return this.outputState;
    }

    /**
     * Get control state description
     */
    public getControlStateDescription(): string {
        switch (this.controlState) {
            case 0: return 'Ready';
            case 1: return 'Connected';
            case 2: return 'Disconnected';
            default: return 'Unknown';
        }
    }

    /**
     * Get control mode description
     */
    public getControlModeDescription(): string {
        switch (this.controlMode) {
            case 0: return 'Direct';
            case 1: return 'Remote';
            case 2: return 'Automatic';
            default: return 'Unknown';
        }
    }
} 