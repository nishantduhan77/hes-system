"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CertificateManager_1 = require("../CertificateManager");
const types_1 = require("../types");
describe('CertificateManager', () => {
    let certificateManager;
    beforeEach(() => {
        certificateManager = CertificateManager_1.CertificateManager.getInstance();
    });
    describe('certificate generation', () => {
        it('should generate a valid certificate', async () => {
            const entityId = 1;
            const validityDays = 365;
            const certBuffer = await certificateManager.generateCertificate(entityId, types_1.CertificateType.DEVICE, validityDays);
            expect(certBuffer).toBeInstanceOf(Buffer);
            expect(certBuffer.length).toBeGreaterThan(0);
        });
        it('should generate certificates with correct validity period', async () => {
            const entityId = 1;
            const validityDays = 30;
            const certBuffer = await certificateManager.generateCertificate(entityId, types_1.CertificateType.DEVICE, validityDays);
            const certInfo = await certificateManager.getCertificateInfo(certBuffer);
            const validityPeriod = certInfo.validTo.getTime() - certInfo.validFrom.getTime();
            const expectedPeriod = validityDays * 24 * 60 * 60 * 1000;
            expect(validityPeriod).toBe(expectedPeriod);
        });
    });
    describe('certificate verification', () => {
        it('should verify a valid certificate', async () => {
            const entityId = 1;
            const validityDays = 365;
            const certBuffer = await certificateManager.generateCertificate(entityId, types_1.CertificateType.DEVICE, validityDays);
            const isValid = await certificateManager.verifyCertificate(certBuffer);
            expect(isValid).toBe(true);
        });
        it('should get correct certificate information', async () => {
            const entityId = 1;
            const validityDays = 365;
            const certBuffer = await certificateManager.generateCertificate(entityId, types_1.CertificateType.DEVICE, validityDays);
            const certInfo = await certificateManager.getCertificateInfo(certBuffer);
            expect(certInfo.subject).toContain(`DLMS-${types_1.CertificateType.DEVICE}-${entityId}`);
            expect(certInfo.issuer).toContain('DLMS/COSEM Simulator');
            expect(certInfo.serialNumber).toBeTruthy();
            expect(certInfo.validFrom).toBeInstanceOf(Date);
            expect(certInfo.validTo).toBeInstanceOf(Date);
        });
    });
    describe('error handling', () => {
        it('should throw error for invalid certificate data', async () => {
            const invalidCertBuffer = Buffer.from('invalid certificate data');
            await expect(certificateManager.verifyCertificate(invalidCertBuffer))
                .rejects
                .toThrow();
        });
        it('should throw error for invalid certificate info request', async () => {
            const invalidCertBuffer = Buffer.from('invalid certificate data');
            await expect(certificateManager.getCertificateInfo(invalidCertBuffer))
                .rejects
                .toThrow();
        });
    });
});
