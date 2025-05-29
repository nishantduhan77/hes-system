import { Grid as MuiGrid } from '@mui/material';
import { GridTypeMap } from '@mui/material/Grid';
import { OverridableComponent } from '@mui/material/OverridableComponent';

const Grid: OverridableComponent<GridTypeMap> & {
  defaultComponent: 'div';
} = MuiGrid as any;

export default Grid; 