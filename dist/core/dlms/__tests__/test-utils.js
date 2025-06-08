"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestObisCode = createTestObisCode;
exports.createTestDate = createTestDate;
exports.datesAreEqual = datesAreEqual;
exports.createTestBuffer = createTestBuffer;
exports.buffersAreEqual = buffersAreEqual;
exports.wait = wait;
const ObisCode_1 = require("../ObisCode");
/**
 * Create test OBIS code
 */
function createTestObisCode(a = 1, b = 0, c = 0, d = 0, e = 0, f = 255) {
    return new ObisCode_1.ObisCode(a, b, c, d, e, f);
}
/**
 * Create test date
 */
function createTestDate(year = 2024, month = 0, day = 1, hours = 0, minutes = 0, seconds = 0) {
    return new Date(year, month, day, hours, minutes, seconds);
}
/**
 * Compare dates ignoring milliseconds
 */
function datesAreEqual(date1, date2) {
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
function createTestBuffer(size = 10, fillValue = 0) {
    return Buffer.alloc(size, fillValue);
}
/**
 * Compare buffers
 */
function buffersAreEqual(buf1, buf2) {
    if (buf1.length !== buf2.length)
        return false;
    return buf1.every((value, index) => value === buf2[index]);
}
/**
 * Wait for specified milliseconds
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
