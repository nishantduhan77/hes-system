export class ObisCode {
    constructor(
        public readonly groupA: number,
        public readonly groupB: number,
        public readonly groupC: number,
        public readonly groupD: number,
        public readonly groupE: number,
        public readonly groupF: number
    ) {
        this.validate();
    }

    private validate(): void {
        if (this.groupA < 0 || this.groupA > 255) throw new Error('Group A must be between 0 and 255');
        if (this.groupB < 0 || this.groupB > 255) throw new Error('Group B must be between 0 and 255');
        if (this.groupC < 0 || this.groupC > 255) throw new Error('Group C must be between 0 and 255');
        if (this.groupD < 0 || this.groupD > 255) throw new Error('Group D must be between 0 and 255');
        if (this.groupE < 0 || this.groupE > 255) throw new Error('Group E must be between 0 and 255');
        if (this.groupF < 0 || this.groupF > 255) throw new Error('Group F must be between 0 and 255');
    }

    public toString(): string {
        return `${this.groupA}.${this.groupB}.${this.groupC}.${this.groupD}.${this.groupE}.${this.groupF}`;
    }

    public equals(other: ObisCode): boolean {
        return this.groupA === other.groupA &&
               this.groupB === other.groupB &&
               this.groupC === other.groupC &&
               this.groupD === other.groupD &&
               this.groupE === other.groupE &&
               this.groupF === other.groupF;
    }

    public static fromString(str: string): ObisCode {
        const parts = str.split('.').map(Number);
        if (parts.length !== 6) {
            throw new Error('Invalid OBIS code format');
        }
        return new ObisCode(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]);
    }
} 