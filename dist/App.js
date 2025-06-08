"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const styles_1 = require("@mui/material/styles");
const notistack_1 = require("notistack");
const theme_1 = __importDefault(require("./theme"));
const MeterManagement_1 = __importDefault(require("./components/Meters/MeterManagement"));
const Dashboard_1 = __importDefault(require("./components/Dashboard/Dashboard"));
const SystemStatus_1 = __importDefault(require("./components/System/SystemStatus"));
const drawerWidth = 240;
function App() {
    return (<styles_1.ThemeProvider theme={theme_1.default}>
      <material_1.CssBaseline />
      <notistack_1.SnackbarProvider maxSnack={3}>
        <react_router_dom_1.BrowserRouter>
          <material_1.Box sx={{ display: 'flex' }}>
            <material_1.AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
              <material_1.Toolbar>
                <material_1.Typography variant="h6" noWrap component="div">
                  HES System
                </material_1.Typography>
              </material_1.Toolbar>
            </material_1.AppBar>
            <material_1.Drawer sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
            },
        }} variant="permanent" anchor="left">
              <material_1.Toolbar />
              <material_1.Box sx={{ overflow: 'auto' }}>
                <material_1.List>
                  <material_1.ListItem disablePadding>
                    <material_1.ListItemButton component={react_router_dom_1.Link} to="/">
                      <material_1.ListItemIcon>
                        <icons_material_1.Dashboard />
                      </material_1.ListItemIcon>
                      <material_1.ListItemText primary="Dashboard"/>
                    </material_1.ListItemButton>
                  </material_1.ListItem>
                  <material_1.ListItem disablePadding>
                    <material_1.ListItemButton component={react_router_dom_1.Link} to="/meters">
                      <material_1.ListItemIcon>
                        <icons_material_1.DeviceHub />
                      </material_1.ListItemIcon>
                      <material_1.ListItemText primary="Meter Management"/>
                    </material_1.ListItemButton>
                  </material_1.ListItem>
                  <material_1.ListItem disablePadding>
                    <material_1.ListItemButton component={react_router_dom_1.Link} to="/system">
                      <material_1.ListItemIcon>
                        <icons_material_1.SettingsSystemDaydream />
                      </material_1.ListItemIcon>
                      <material_1.ListItemText primary="System Status"/>
                    </material_1.ListItemButton>
                  </material_1.ListItem>
                </material_1.List>
              </material_1.Box>
            </material_1.Drawer>
            <material_1.Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
              <material_1.Toolbar />
              <react_router_dom_1.Routes>
                <react_router_dom_1.Route path="/" element={<Dashboard_1.default />}/>
                <react_router_dom_1.Route path="/meters" element={<MeterManagement_1.default />}/>
                <react_router_dom_1.Route path="/system" element={<SystemStatus_1.default />}/>
              </react_router_dom_1.Routes>
            </material_1.Box>
          </material_1.Box>
        </react_router_dom_1.BrowserRouter>
      </notistack_1.SnackbarProvider>
    </styles_1.ThemeProvider>);
}
exports.default = App;
