"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.ServiceType = void 0;
/**
 * Service Type
 */
var ServiceType;
(function (ServiceType) {
    ServiceType[ServiceType["TCP"] = 0] = "TCP";
    ServiceType[ServiceType["UDP"] = 1] = "UDP";
    ServiceType[ServiceType["FTP"] = 2] = "FTP";
    ServiceType[ServiceType["SMTP"] = 3] = "SMTP";
    ServiceType[ServiceType["SMS"] = 4] = "SMS";
    ServiceType[ServiceType["HDLC"] = 5] = "HDLC";
    ServiceType[ServiceType["M_BUS"] = 6] = "M_BUS";
    ServiceType[ServiceType["ZIG_BEE"] = 7] = "ZIG_BEE";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
/**
 * Message Type
 */
var MessageType;
(function (MessageType) {
    MessageType[MessageType["COSEM_APDU"] = 0] = "COSEM_APDU";
    MessageType[MessageType["XML_ENCODED"] = 1] = "XML_ENCODED";
    MessageType[MessageType["JSON_ENCODED"] = 2] = "JSON_ENCODED";
})(MessageType || (exports.MessageType = MessageType = {}));
