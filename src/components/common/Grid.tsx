import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

interface GridProps extends Omit<MuiGridProps, 'item'> {
  item?: boolean;
}

export const Grid: React.FC<GridProps> = ({ children, item, ...props }) => {
  return (
    <MuiGrid {...props} item={item}>
      {children}
    </MuiGrid>
  );
};

export default Grid; 