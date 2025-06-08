"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationType = exports.SecurityLevel = exports.Unit = exports.AccessLevel = void 0;
/**
 * Access levels for COSEM attributes
 */
var AccessLevel;
(function (AccessLevel) {
    AccessLevel[AccessLevel["NO_ACCESS"] = 0] = "NO_ACCESS";
    AccessLevel[AccessLevel["READ_ONLY"] = 1] = "READ_ONLY";
    AccessLevel[AccessLevel["WRITE_ONLY"] = 2] = "WRITE_ONLY";
    AccessLevel[AccessLevel["READ_WRITE"] = 3] = "READ_WRITE";
})(AccessLevel || (exports.AccessLevel = AccessLevel = {}));
/**
 * Units for physical quantities
 */
var Unit;
(function (Unit) {
    Unit[Unit["NONE"] = 0] = "NONE";
    Unit[Unit["YEAR"] = 1] = "YEAR";
    Unit[Unit["MONTH"] = 2] = "MONTH";
    Unit[Unit["WEEK"] = 3] = "WEEK";
    Unit[Unit["DAY"] = 4] = "DAY";
    Unit[Unit["HOUR"] = 5] = "HOUR";
    Unit[Unit["MINUTE"] = 6] = "MINUTE";
    Unit[Unit["SECOND"] = 7] = "SECOND";
    Unit[Unit["DEGREE"] = 8] = "DEGREE";
    Unit[Unit["DEGREE_CELSIUS"] = 9] = "DEGREE_CELSIUS";
    Unit[Unit["CURRENCY"] = 10] = "CURRENCY";
    Unit[Unit["METER"] = 11] = "METER";
    Unit[Unit["METER_PER_SECOND"] = 12] = "METER_PER_SECOND";
    Unit[Unit["CUBIC_METER"] = 13] = "CUBIC_METER";
    Unit[Unit["CUBIC_METER_CORRECTED"] = 14] = "CUBIC_METER_CORRECTED";
    Unit[Unit["CUBIC_METER_PER_HOUR"] = 15] = "CUBIC_METER_PER_HOUR";
    Unit[Unit["CUBIC_METER_PER_HOUR_CORRECTED"] = 16] = "CUBIC_METER_PER_HOUR_CORRECTED";
    Unit[Unit["CUBIC_METER_PER_DAY"] = 17] = "CUBIC_METER_PER_DAY";
    Unit[Unit["CUBIC_METER_PER_DAY_CORRECTED"] = 18] = "CUBIC_METER_PER_DAY_CORRECTED";
    Unit[Unit["LITER"] = 19] = "LITER";
    Unit[Unit["KILOGRAM"] = 20] = "KILOGRAM";
    Unit[Unit["NEWTON"] = 21] = "NEWTON";
    Unit[Unit["NEWTON_METER"] = 22] = "NEWTON_METER";
    Unit[Unit["PASCAL"] = 23] = "PASCAL";
    Unit[Unit["BAR"] = 24] = "BAR";
    Unit[Unit["JOULE"] = 25] = "JOULE";
    Unit[Unit["JOULE_PER_HOUR"] = 26] = "JOULE_PER_HOUR";
    Unit[Unit["WATT"] = 27] = "WATT";
    Unit[Unit["VOLT_AMPERE"] = 28] = "VOLT_AMPERE";
    Unit[Unit["VAR"] = 29] = "VAR";
    Unit[Unit["WATT_HOUR"] = 30] = "WATT_HOUR";
    Unit[Unit["VOLT_AMPERE_HOUR"] = 31] = "VOLT_AMPERE_HOUR";
    Unit[Unit["VAR_HOUR"] = 32] = "VAR_HOUR";
    Unit[Unit["AMPERE"] = 33] = "AMPERE";
    Unit[Unit["COULOMB"] = 34] = "COULOMB";
    Unit[Unit["VOLT"] = 35] = "VOLT";
    Unit[Unit["VOLT_PER_METER"] = 36] = "VOLT_PER_METER";
    Unit[Unit["FARAD"] = 37] = "FARAD";
    Unit[Unit["OHM"] = 38] = "OHM";
    Unit[Unit["OHM_METER"] = 39] = "OHM_METER";
    Unit[Unit["WEBER"] = 40] = "WEBER";
    Unit[Unit["TESLA"] = 41] = "TESLA";
    Unit[Unit["AMPERE_PER_METER"] = 42] = "AMPERE_PER_METER";
    Unit[Unit["HENRY"] = 43] = "HENRY";
    Unit[Unit["HERTZ"] = 44] = "HERTZ";
    Unit[Unit["ACTIVE_ENERGY"] = 45] = "ACTIVE_ENERGY";
    Unit[Unit["REACTIVE_ENERGY"] = 46] = "REACTIVE_ENERGY";
    Unit[Unit["APPARENT_ENERGY"] = 47] = "APPARENT_ENERGY";
    Unit[Unit["VOLT_SQUARED_HOURS"] = 48] = "VOLT_SQUARED_HOURS";
    Unit[Unit["AMPERE_SQUARED_HOURS"] = 49] = "AMPERE_SQUARED_HOURS";
    Unit[Unit["KILOGRAM_PER_SECOND"] = 50] = "KILOGRAM_PER_SECOND";
    Unit[Unit["SIEMENS"] = 51] = "SIEMENS";
    Unit[Unit["KELVIN"] = 52] = "KELVIN";
    Unit[Unit["VOLT_SQUARED_HOUR_METER_SQUARED"] = 53] = "VOLT_SQUARED_HOUR_METER_SQUARED";
    Unit[Unit["PERCENT"] = 54] = "PERCENT";
    Unit[Unit["AMPERE_HOUR"] = 55] = "AMPERE_HOUR";
    Unit[Unit["ENERGY_PER_VOLUME"] = 56] = "ENERGY_PER_VOLUME";
    Unit[Unit["CALORIFIC_VALUE"] = 57] = "CALORIFIC_VALUE";
    Unit[Unit["MOLE_PERCENT"] = 58] = "MOLE_PERCENT";
    Unit[Unit["MASS_DENSITY"] = 59] = "MASS_DENSITY";
    Unit[Unit["PASCAL_SECOND"] = 60] = "PASCAL_SECOND";
})(Unit || (exports.Unit = Unit = {}));
/**
 * Security levels
 */
var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel[SecurityLevel["NONE"] = 0] = "NONE";
    SecurityLevel[SecurityLevel["LOW"] = 1] = "LOW";
    SecurityLevel[SecurityLevel["HIGH"] = 2] = "HIGH";
    SecurityLevel[SecurityLevel["HIGH_GMAC"] = 3] = "HIGH_GMAC";
    SecurityLevel[SecurityLevel["HIGH_SHA256"] = 4] = "HIGH_SHA256";
    SecurityLevel[SecurityLevel["HIGH_ECDSA"] = 5] = "HIGH_ECDSA";
})(SecurityLevel || (exports.SecurityLevel = SecurityLevel = {}));
/**
 * Authentication types
 */
var AuthenticationType;
(function (AuthenticationType) {
    AuthenticationType[AuthenticationType["NONE"] = 0] = "NONE";
    AuthenticationType[AuthenticationType["LOW"] = 1] = "LOW";
    AuthenticationType[AuthenticationType["HIGH"] = 2] = "HIGH";
    AuthenticationType[AuthenticationType["HIGH_MD5"] = 3] = "HIGH_MD5";
    AuthenticationType[AuthenticationType["HIGH_SHA1"] = 4] = "HIGH_SHA1";
    AuthenticationType[AuthenticationType["HIGH_GMAC"] = 5] = "HIGH_GMAC";
    AuthenticationType[AuthenticationType["HIGH_SHA256"] = 6] = "HIGH_SHA256";
    AuthenticationType[AuthenticationType["HIGH_ECDSA"] = 7] = "HIGH_ECDSA";
})(AuthenticationType || (exports.AuthenticationType = AuthenticationType = {}));
