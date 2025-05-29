declare module '@ant-design/charts' {
  import { FC } from 'react';

  interface ChartProps {
    data: any[];
    xField?: string;
    yField?: string;
    seriesField?: string;
    angleField?: string;
    colorField?: string;
    point?: {
      size?: number;
      shape?: string;
      style?: Record<string, any>;
    };
    isGroup?: boolean;
    [key: string]: any;
  }

  export const Line: FC<ChartProps>;
  export const Column: FC<ChartProps>;
  export const Pie: FC<ChartProps>;
} 