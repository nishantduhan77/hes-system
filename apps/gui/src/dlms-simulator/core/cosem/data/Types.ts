/**
 * Access levels for COSEM attributes
 */
export enum AccessLevel {
    NONE = 0,
    READ = 1,
    WRITE = 2,
    READ_WRITE = 3,
    ADMIN = 4
}

/**
 * DLMS data types
 */
export type DlmsDataType =
    | 'null'
    | 'array'
    | 'structure'
    | 'boolean'
    | 'bit-string'
    | 'double-long'
    | 'double-long-unsigned'
    | 'octet-string'
    | 'visible-string'
    | 'utf8-string'
    | 'bcd'
    | 'integer'
    | 'long'
    | 'unsigned'
    | 'long-unsigned'
    | 'compact-array'
    | 'long64'
    | 'long64-unsigned'
    | 'enum'
    | 'float32'
    | 'float64'
    | 'date-time'
    | 'date'
    | 'time'
    | 'don\'t-care';

/**
 * Descriptor for COSEM attribute
 */
export interface AttributeDescriptor {
    name: string;
    type: DlmsDataType;
    access: AccessLevel;
    getValue: () => any;
    setValue?: (value: any) => void;
}

/**
 * Descriptor for COSEM method
 */
export interface MethodDescriptor {
    name: string;
    execute: (params?: any[]) => any;
}

/**
 * Units for physical quantities
 */
export enum Unit {
    NONE = 0,
    YEAR = 1,
    MONTH = 2,
    WEEK = 3,
    DAY = 4,
    HOUR = 5,
    MINUTE = 6,
    SECOND = 7,
    DEGREE = 8,
    DEGREE_CELSIUS = 9,
    CURRENCY = 10,
    METER = 11,
    METER_PER_SECOND = 12,
    CUBIC_METER = 13,
    CUBIC_METER_CORRECTED = 14,
    CUBIC_METER_PER_HOUR = 15,
    CUBIC_METER_PER_HOUR_CORRECTED = 16,
    CUBIC_METER_PER_DAY = 17,
    CUBIC_METER_PER_DAY_CORRECTED = 18,
    LITER = 19,
    KILOGRAM = 20,
    NEWTON = 21,
    NEWTON_METER = 22,
    PASCAL = 23,
    BAR = 24,
    JOULE = 25,
    JOULE_PER_HOUR = 26,
    WATT = 27,
    VOLT_AMPERE = 28,
    VAR = 29,
    WATT_HOUR = 30,
    VOLT_AMPERE_HOUR = 31,
    VAR_HOUR = 32,
    AMPERE = 33,
    COULOMB = 34,
    VOLT = 35,
    VOLT_PER_METER = 36,
    FARAD = 37,
    OHM = 38,
    OHM_METER = 39,
    WEBER = 40,
    TESLA = 41,
    AMPERE_PER_METER = 42,
    HENRY = 43,
    HERTZ = 44,
    ACTIVE_ENERGY = 45,
    REACTIVE_ENERGY = 46,
    APPARENT_ENERGY = 47,
    VOLT_SQUARED_HOURS = 48,
    AMPERE_SQUARED_HOURS = 49,
    KILOGRAM_PER_SECOND = 50,
    SIEMENS = 51,
    KELVIN = 52,
    VOLT_SQUARED_HOUR_METER_SQUARED = 53,
    PERCENT = 54,
    AMPERE_HOUR = 55,
    ENERGY_PER_VOLUME = 56,
    CALORIFIC_VALUE = 57,
    MOLE_PERCENT = 58,
    MASS_DENSITY = 59,
    PASCAL_SECOND = 60
}

/**
 * Scalar unit combination
 */
export interface ScalarUnit {
    scalar: number;
    unit: Unit;
}

/**
 * Security levels
 */
export enum SecurityLevel {
    NONE = 0,
    AUTHENTICATION = 1,
    ENCRYPTION = 2,
    AUTHENTICATION_ENCRYPTION = 3,
    LOW = 1,
    HIGH = 2,
    HIGH_GMAC = 3,
    HIGH_SHA256 = 4,
    HIGH_ECDSA = 5
}

/**
 * Authentication types
 */
export enum AuthenticationType {
    NONE = 0,
    LOW = 1,
    HIGH = 2,
    MD5 = 3,
    SHA1 = 4,
    GMAC = 5,
    SHA256 = 6,
    ECDSA = 7
}

/**
 * Conformance block
 */
export interface ConformanceBlock {
    general: boolean;
    generalProtection: boolean;
    generalEstablishment: boolean;
    generalEstablishmentNoAck: boolean;
    generalReleaseNoAck: boolean;
    generalPriority: boolean;
    generalBlockTransfer: boolean;
    generalBlockTransferWithGet: boolean;
    generalBlockTransferWithSet: boolean;
    generalActionBlockTransfer: boolean;
    generalMultipleReferences: boolean;
    generalDataNotification: boolean;
    generalAccessNoResponse: boolean;
    generalUnitaryManagement: boolean;
    generalAttributeGet: boolean;
    generalAttributeSet: boolean;
    generalAttributeSetMultiple: boolean;
    generalMethodInvoke: boolean;
    generalSelectiveAccess: boolean;
    generalEventNotification: boolean;
    generalInformationReport: boolean;
} 