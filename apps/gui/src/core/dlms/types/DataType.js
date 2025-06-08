"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataType = void 0;
/**
 * DLMS Data Types
 */
var DataType;
(function (DataType) {
    DataType[DataType["NULL"] = 0] = "NULL";
    DataType[DataType["ARRAY"] = 1] = "ARRAY";
    DataType[DataType["STRUCT"] = 2] = "STRUCT";
    DataType[DataType["BOOLEAN"] = 3] = "BOOLEAN";
    DataType[DataType["BIT_STRING"] = 4] = "BIT_STRING";
    DataType[DataType["INT32"] = 5] = "INT32";
    DataType[DataType["UINT32"] = 6] = "UINT32";
    DataType[DataType["OCTET_STRING"] = 9] = "OCTET_STRING";
    DataType[DataType["STRING"] = 10] = "STRING";
    DataType[DataType["UTF8_STRING"] = 12] = "UTF8_STRING";
    DataType[DataType["BCD"] = 13] = "BCD";
    DataType[DataType["INT8"] = 15] = "INT8";
    DataType[DataType["INT16"] = 16] = "INT16";
    DataType[DataType["UINT8"] = 17] = "UINT8";
    DataType[DataType["UINT16"] = 18] = "UINT16";
    DataType[DataType["INT64"] = 20] = "INT64";
    DataType[DataType["UINT64"] = 21] = "UINT64";
    DataType[DataType["ENUM"] = 22] = "ENUM";
    DataType[DataType["FLOAT32"] = 23] = "FLOAT32";
    DataType[DataType["FLOAT64"] = 24] = "FLOAT64";
    DataType[DataType["DATE_TIME"] = 25] = "DATE_TIME";
    DataType[DataType["DATE"] = 26] = "DATE";
    DataType[DataType["TIME"] = 27] = "TIME";
    DataType[DataType["COMPACT_ARRAY"] = 28] = "COMPACT_ARRAY";
})(DataType || (exports.DataType = DataType = {}));
