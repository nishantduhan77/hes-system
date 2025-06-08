"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = void 0;
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const Grid = ({ children, item, ...props }) => {
    return (<material_1.Grid {...props} item={item}>
      {children}
    </material_1.Grid>);
};
exports.Grid = Grid;
exports.default = exports.Grid;
