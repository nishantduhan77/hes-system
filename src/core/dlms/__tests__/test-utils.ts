import { ObisCode } from '../ObisCode';

/**
 * Create test OBIS code
 */
export function createTestObisCode(a: number = 1, b: number = 0, c: number = 0, d: number = 0, e: number = 0, f: number = 255): ObisCode {
    return new ObisCode(a, b, c, d, e, f);
}

/**
 * Create test date
 */
export function createTestDate(year: number = 2024, month: number = 0, day: number = 1, hours: number = 0, minutes: number = 0, seconds: number = 0): Date {
    return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Compare dates ignoring milliseconds
 */
export function datesAreEqual(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate() &&
           date1.getHours() === date2.getHours() &&
           date1.getMinutes() === date2.getMinutes() &&
           date1.getSeconds() === date2.getSeconds();
}

/**
 * Create test buffer
 */
export function createTestBuffer(size: number = 10, fillValue: number = 0): Buffer {
    return Buffer.alloc(size, fillValue);
}

/**
 * Compare buffers
 */
export function buffersAreEqual(buf1: Buffer, buf2: Buffer): boolean {
    if (buf1.length !== buf2.length) return false;
    return buf1.every((value, index) => value === buf2[index]);
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
} 