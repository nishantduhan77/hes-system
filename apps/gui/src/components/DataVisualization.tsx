import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Space, message } from 'antd';
import { Line, Column, Pie } from '@ant-design/charts';
import WebSocketService from '../services/WebSocketService';
import DataExportService from '../services/DataExportService';
import type { MeterUpdate } from '../services/WebSocketService';

const { Option } = Select;

interface DataPoint {
  timestamp: string;
  value: number;
  parameter: string;
}

interface Props {
  meterId: string;
  compareMeterId?: string;
}

const DataVisualization: React.FC<Props> = ({ meterId, compareMeterId }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [data, setData] = useState<DataPoint[]>([]);
  const [compareData, setCompareData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    wsService.connect();

    const unsubscribe = wsService.subscribe(meterId, (update: MeterUpdate) => {
      const newData = update.readings.map(reading => ({
        timestamp: update.timestamp,
        value: reading.value,
        parameter: reading.obisCode,
      }));
      setData(prev => [...prev, ...newData].slice(-100));
    });

    if (compareMeterId) {
      const unsubscribeCompare = wsService.subscribe(compareMeterId, (update: MeterUpdate) => {
        const newData = update.readings.map(reading => ({
          timestamp: update.timestamp,
          value: reading.value,
          parameter: reading.obisCode,
        }));
        setCompareData(prev => [...prev, ...newData].slice(-100));
      });

      return () => {
        unsubscribe();
        unsubscribeCompare();
      };
    }

    return unsubscribe;
  }, [meterId, compareMeterId]);

  const handleExport = () => {
    const exportService = DataExportService.getInstance();
    const exportData = data.map(point => ({
      timestamp: point.timestamp,
      meterId,
      parameterName: point.parameter,
      value: point.value,
      unit: 'kWh',
      obisCode: point.parameter,
    }));

    if (compareMeterId && compareData.length > 0) {
      const compareExportData = compareData.map(point => ({
        timestamp: point.timestamp,
        meterId: compareMeterId,
        parameterName: point.parameter,
        value: point.value,
        unit: 'kWh',
        obisCode: point.parameter,
      }));

      const comparison = exportService.compareMeters(exportData, compareExportData);
      if (comparison.differences.length > 0) {
        message.info(`Found ${comparison.differences.length} significant differences`);
      }
    }

    exportService.exportToExcel(exportData, `meter-data-${meterId}`);
  };

  const getConfig = () => {
    const baseConfig = {
      data,
      xField: 'timestamp',
      yField: 'value',
      seriesField: 'parameter',
    };

    switch (chartType) {
      case 'line':
        return {
          ...baseConfig,
          point: { size: 5 },
        };
      case 'bar':
        return {
          ...baseConfig,
          isGroup: true,
        };
      case 'pie':
        return {
          data,
          angleField: 'value',
          colorField: 'parameter',
        };
      default:
        return baseConfig;
    }
  };

  const ChartComponent = {
    line: Line,
    bar: Column,
    pie: Pie,
  }[chartType];

  return (
    <Card title="Data Visualization">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Select value={chartType} onChange={setChartType} style={{ width: 120 }}>
            <Option value="line">Line Chart</Option>
            <Option value="bar">Bar Chart</Option>
            <Option value="pie">Pie Chart</Option>
          </Select>
          <Button onClick={handleExport}>Export Data</Button>
        </Space>
        <div style={{ height: 400 }}>
          {ChartComponent && <ChartComponent {...getConfig()} />}
        </div>
      </Space>
    </Card>
  );
};

export default DataVisualization; 