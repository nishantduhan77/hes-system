"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityError = exports.CertificateType = exports.SecuritySuite = exports.SecurityPolicy = void 0;
/**
 * Security Policy Levels as per DLMS/COSEM
 */
var SecurityPolicy;
(function (SecurityPolicy) {
    SecurityPolicy[SecurityPolicy["NONE"] = 0] = "NONE";
    SecurityPolicy[SecurityPolicy["AUTHENTICATED"] = 1] = "AUTHENTICATED";
    SecurityPolicy[SecurityPolicy["ENCRYPTED"] = 2] = "ENCRYPTED";
    SecurityPolicy[SecurityPolicy["AUTH_ENCRYPTED"] = 3] = "AUTH_ENCRYPTED"; // Authentication and Encryption
})(SecurityPolicy || (exports.SecurityPolicy = SecurityPolicy = {}));
/**
 * Security Suite Options
 */
var SecuritySuite;
(function (SecuritySuite) {
    SecuritySuite[SecuritySuite["AES_GCM_128"] = 0] = "AES_GCM_128";
    SecuritySuite[SecuritySuite["AES_GCM_256"] = 1] = "AES_GCM_256"; // AES-GCM-256
})(SecuritySuite || (exports.SecuritySuite = SecuritySuite = {}));
/**
 * Certificate Types
 */
var CertificateType;
(function (CertificateType) {
    CertificateType["DEVICE"] = "DEVICE";
    CertificateType["AUTHORITY"] = "AUTHORITY";
    CertificateType["CLIENT"] = "CLIENT";
})(CertificateType || (exports.CertificateType = CertificateType = {}));
/**
 * Error type for security operations
 */
class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
