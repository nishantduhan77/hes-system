"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const Dashboard = () => {
    return (<material_1.Box sx={{ flexGrow: 1 }}>
      <material_1.Typography variant="h4" gutterBottom>
        Dashboard
      </material_1.Typography>
      <material_1.Grid container spacing={3}>
        <material_1.Grid item xs={12} md={6}>
          <material_1.Paper sx={{ p: 2 }}>
            <material_1.Typography variant="h6">System Overview</material_1.Typography>
            <material_1.Typography>Coming soon...</material_1.Typography>
          </material_1.Paper>
        </material_1.Grid>
        <material_1.Grid item xs={12} md={6}>
          <material_1.Paper sx={{ p: 2 }}>
            <material_1.Typography variant="h6">Recent Activity</material_1.Typography>
            <material_1.Typography>Coming soon...</material_1.Typography>
          </material_1.Paper>
        </material_1.Grid>
      </material_1.Grid>
    </material_1.Box>);
};
exports.default = Dashboard;
