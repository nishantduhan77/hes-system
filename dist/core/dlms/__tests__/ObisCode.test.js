"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ObisCode_1 = require("../ObisCode");
describe('ObisCode', () => {
    describe('constructor', () => {
        it('should create OBIS code with valid values', () => {
            const obis = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            expect(obis.toString()).toBe('1.0.1.8.0.255');
        });
        it('should throw error for invalid values', () => {
            expect(() => new ObisCode_1.ObisCode(-1, 0, 0, 0, 0, 0)).toThrow();
            expect(() => new ObisCode_1.ObisCode(256, 0, 0, 0, 0, 0)).toThrow();
        });
    });
    describe('parsing', () => {
        it('should parse from string', () => {
            const obis = ObisCode_1.ObisCode.fromString('1.0.1.8.0.255');
            expect(obis.getA()).toBe(1);
            expect(obis.getB()).toBe(0);
            expect(obis.getC()).toBe(1);
            expect(obis.getD()).toBe(8);
            expect(obis.getE()).toBe(0);
            expect(obis.getF()).toBe(255);
        });
        it('should parse from buffer', () => {
            const buffer = Buffer.from([1, 0, 1, 8, 0, 255]);
            const obis = ObisCode_1.ObisCode.fromBuffer(buffer);
            expect(obis.toString()).toBe('1.0.1.8.0.255');
        });
        it('should throw error for invalid string format', () => {
            expect(() => ObisCode_1.ObisCode.fromString('1.0.1')).toThrow();
            expect(() => ObisCode_1.ObisCode.fromString('1.0.1.8.0.256')).toThrow();
            expect(() => ObisCode_1.ObisCode.fromString('invalid')).toThrow();
        });
        it('should throw error for invalid buffer', () => {
            expect(() => ObisCode_1.ObisCode.fromBuffer(Buffer.from([1, 0, 1]))).toThrow();
        });
    });
    describe('comparison', () => {
        it('should compare OBIS codes', () => {
            const obis1 = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            const obis2 = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            const obis3 = new ObisCode_1.ObisCode(2, 0, 1, 8, 0, 255);
            expect(obis1.equals(obis2)).toBe(true);
            expect(obis1.equals(obis3)).toBe(false);
        });
        it('should match wildcard values', () => {
            const obis1 = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            const pattern = new ObisCode_1.ObisCode(1, 255, 1, 8, 255, 255); // B and E are wildcards
            expect(obis1.matches(pattern)).toBe(true);
        });
    });
    describe('serialization', () => {
        it('should convert to string', () => {
            const obis = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            expect(obis.toString()).toBe('1.0.1.8.0.255');
        });
        it('should convert to buffer', () => {
            const obis = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            const buffer = obis.toBuffer();
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBe(6);
            expect([...buffer]).toEqual([1, 0, 1, 8, 0, 255]);
        });
        it('should convert to array', () => {
            const obis = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            const array = obis.toArray();
            expect(array).toEqual([1, 0, 1, 8, 0, 255]);
        });
    });
    describe('validation', () => {
        it('should validate individual values', () => {
            expect(() => new ObisCode_1.ObisCode(256, 0, 0, 0, 0, 0)).toThrow();
            expect(() => new ObisCode_1.ObisCode(0, 256, 0, 0, 0, 0)).toThrow();
            expect(() => new ObisCode_1.ObisCode(0, 0, 256, 0, 0, 0)).toThrow();
            expect(() => new ObisCode_1.ObisCode(0, 0, 0, 256, 0, 0)).toThrow();
            expect(() => new ObisCode_1.ObisCode(0, 0, 0, 0, 256, 0)).toThrow();
            expect(() => new ObisCode_1.ObisCode(0, 0, 0, 0, 0, 256)).toThrow();
        });
        it('should validate array values', () => {
            expect(() => ObisCode_1.ObisCode.fromArray([-1, 0, 0, 0, 0, 0])).toThrow();
            expect(() => ObisCode_1.ObisCode.fromArray([0, 0, 0, 0, 0])).toThrow(); // Too short
            expect(() => ObisCode_1.ObisCode.fromArray([0, 0, 0, 0, 0, 0, 0])).toThrow(); // Too long
        });
    });
    describe('utility methods', () => {
        it('should check if value is wildcard', () => {
            const obis = new ObisCode_1.ObisCode(1, 255, 1, 8, 255, 255);
            expect(obis.isWildcard(0)).toBe(false);
            expect(obis.isWildcard(1)).toBe(true);
            expect(obis.isWildcard(4)).toBe(true);
            expect(obis.isWildcard(5)).toBe(true);
        });
        it('should get individual values', () => {
            const obis = new ObisCode_1.ObisCode(1, 0, 1, 8, 0, 255);
            expect(obis.getA()).toBe(1);
            expect(obis.getB()).toBe(0);
            expect(obis.getC()).toBe(1);
            expect(obis.getD()).toBe(8);
            expect(obis.getE()).toBe(0);
            expect(obis.getF()).toBe(255);
        });
    });
});
