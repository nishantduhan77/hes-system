import React, { useState } from 'react';
import { Tabs, Table, Card, Space, DatePicker, Row, Col, Statistic, Tag } from 'antd';
import type { RangePickerProps } from 'antd/lib/date-picker';
import type { Dayjs } from 'dayjs';
import { Line } from '@ant-design/charts';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface ProfileData {
  timestamp: string;
  parameterName: string;
  obisCode: string;
  value: number;
  unit: string;
}

// Define all OBIS codes and their parameters
const PROFILE_PARAMETERS = {
  billing: [
    { name: 'Billing Date', obisCode: '0.0.0.1.2.255', unit: '', type: 'Octet-string' },
    { name: 'PF for Billing Period', obisCode: '1.0.13.0.0.255', unit: '', type: 'Float32' },
    { name: 'Cum Active Import Energy - Wh', obisCode: '1.0.1.8.0.255', unit: 'Wh', type: 'Float32' },
    { name: 'Cum. Energy - Wh Import', obisCode: '1.0.1.8.1.255', unit: 'Wh', type: 'Float32' },
    // Add all billing parameters from the image
  ],
  daily: [
    { name: 'RTC', obisCode: '0.0.1.0.0.255', unit: '', type: 'Octet-string' },
    { name: 'Cum Energy - Wh Import', obisCode: '1.0.1.8.0.255', unit: 'Wh', type: 'Float32' },
    { name: 'Cum Energy - VAh Import', obisCode: '1.0.9.8.0.255', unit: 'VAh', type: 'Float32' },
    { name: 'Cum Energy -Wh Export', obisCode: '1.0.2.8.0.255', unit: 'Wh', type: 'Float32' },
    { name: 'Cum Energy - VAh Export', obisCode: '1.0.10.8.0.255', unit: 'VAh', type: 'Float32' }
  ],
  instantaneous: [
    { name: 'RTC - Date & Time', obisCode: '0.0.1.0.0.255', unit: '', type: 'Octet-string' },
    { name: 'L1 Current - IR', obisCode: '1.0.31.7.0.255', unit: 'A', type: 'Float32' },
    { name: 'L2 Current - IY', obisCode: '1.0.51.7.0.255', unit: 'A', type: 'Float32' },
    { name: 'L3 Current - IB', obisCode: '1.0.71.7.0.255', unit: 'A', type: 'Float32' },
    { name: 'L1 Voltage - VRN', obisCode: '1.0.32.7.0.255', unit: 'V', type: 'Float32' },
    { name: 'L2 Voltage - VYN', obisCode: '1.0.52.7.0.255', unit: 'V', type: 'Float32' },
    { name: 'L3 Voltage - VBN', obisCode: '1.0.72.7.0.255', unit: 'V', type: 'Float32' },
    { name: 'L1 Power Factor - R Phase', obisCode: '1.0.33.7.0.255', unit: '', type: 'Float32' },
    { name: 'L2 Power Factor - Y Phase', obisCode: '1.0.53.7.0.255', unit: '', type: 'Float32' },
    { name: 'L3 Power Factor - B Phase', obisCode: '1.0.73.7.0.255', unit: '', type: 'Float32' },
    { name: 'Total Power Factor - PF', obisCode: '1.0.13.7.0.255', unit: '', type: 'Float32' },
    { name: 'Frequency', obisCode: '1.0.14.7.0.255', unit: 'Hz', type: 'Float32' },
    { name: 'Total Apparent Power - VA', obisCode: '1.0.9.7.0.255', unit: 'VA', type: 'Float32' },
    { name: 'Total active Power - W', obisCode: '1.0.1.7.0.255', unit: 'W', type: 'Float32' },
    { name: 'Total Reactive Power- VAr', obisCode: '1.0.3.7.0.255', unit: 'VAr', type: 'Float32' },
    { name: 'Neutral current', obisCode: '1.0.91.7.0.255', unit: 'A', type: 'Float32' }
  ],
  block: [
    { name: 'Current,Ir', obisCode: '1.0.31.27.0.255', unit: 'A', type: 'Float32' },
    { name: 'Current,Iy', obisCode: '1.0.51.27.0.255', unit: 'A', type: 'Float32' },
    { name: 'Current,Ib', obisCode: '1.0.71.27.0.255', unit: 'A', type: 'Float32' },
    { name: 'Voltage,Vrn', obisCode: '1.0.32.27.0.255', unit: 'V', type: 'Float32' },
    { name: 'Voltage,Vyn', obisCode: '1.0.52.27.0.255', unit: 'V', type: 'Float32' },
    { name: 'Voltage,Vbn', obisCode: '1.0.72.27.0.255', unit: 'V', type: 'Float32' },
    { name: 'Energy - Wh Import', obisCode: '1.0.1.29.0.255', unit: 'Wh', type: 'Float32' },
    { name: 'Energy - VAh Import', obisCode: '1.0.9.29.0.255', unit: 'VAh', type: 'Float32' },
    { name: 'Energy -Wh Export', obisCode: '1.0.2.29.0.255', unit: 'Wh', type: 'Float32' },
    { name: 'Energy - VAh Export', obisCode: '1.0.10.29.0.255', unit: 'VAh', type: 'Float32' },
    { name: 'Energy - VArh - Q1', obisCode: '1.0.5.29.0.255', unit: 'VArh', type: 'Float32' },
    { name: 'Energy - VArh - Q2', obisCode: '1.0.6.29.0.255', unit: 'VArh', type: 'Float32' },
    { name: 'Energy - VArh - Q3', obisCode: '1.0.7.29.0.255', unit: 'VArh', type: 'Float32' },
    { name: 'Energy - VArh - Q4', obisCode: '1.0.8.29.0.255', unit: 'VArh', type: 'Float32' }
  ]
};

const MeterDataProfiles: React.FC<{ meterId: string }> = ({ meterId }) => {
  const [activeTab, setActiveTab] = useState('instantaneous');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'Parameter',
      dataIndex: 'parameterName',
      key: 'parameterName',
    },
    {
      title: 'OBIS Code',
      dataIndex: 'obisCode',
      key: 'obisCode',
      render: (code: string) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    }
  ];

  const mockData = (type: keyof typeof PROFILE_PARAMETERS): ProfileData[] => {
    const parameters = PROFILE_PARAMETERS[type];
    const currentTime = new Date();
    
    return parameters.flatMap(param => {
      // For instantaneous, return only current values
      if (type === 'instantaneous') {
        return [{
          timestamp: currentTime.toISOString(),
          parameterName: param.name,
          value: Math.random() * 100,
          unit: param.unit,
          obisCode: param.obisCode
        }];
      }
      
      // For other profiles, return historical data
      return Array(5).fill(null).map((_, index) => ({
        timestamp: new Date(currentTime.getTime() - index * 3600000).toISOString(),
        parameterName: param.name,
        value: Math.random() * 100,
        unit: param.unit,
        obisCode: param.obisCode
      }));
    });
  };

  const renderCharts = (type: keyof typeof PROFILE_PARAMETERS, data: ProfileData[]) => {
    const chartData = data.reduce((acc: any[], reading) => {
      if (reading.unit) { // Only chart readings with units
        acc.push({
          timestamp: reading.timestamp,
          value: reading.value,
          parameter: reading.parameterName
        });
      }
      return acc;
    }, []);

    return (
      <Line
        data={chartData}
        xField="timestamp"
        yField="value"
        seriesField="parameter"
        point={{ size: 5, shape: 'diamond' }}
        legend={{ position: 'top' }}
      />
    );
  };

  const renderInstantaneousStats = (data: ProfileData[]) => {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {data.map(reading => (
          <Col span={8} key={reading.obisCode}>
            <Card>
              <Statistic
                title={reading.parameterName}
                value={reading.value}
                suffix={reading.unit}
                precision={2}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{reading.obisCode}</Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setDateRange(dates as [Dayjs, Dayjs] | null);
    // Add your logic here to fetch data based on the new date range
  };

  const renderProfileContent = (type: keyof typeof PROFILE_PARAMETERS) => {
    const data = mockData(type);
    return (
      <>
        {type === 'instantaneous' && renderInstantaneousStats(data)}
        {type !== 'instantaneous' && (
          <>
            <div style={{ marginBottom: 16 }}>
              {renderCharts(type, data)}
            </div>
            <Table 
              columns={columns} 
              dataSource={data}
              rowKey={(record) => `${record.obisCode}-${record.timestamp}`}
              scroll={{ y: 400 }}
            />
          </>
        )}
      </>
    );
  };

  return (
    <Card title={`Meter Data Profiles - ${meterId}`}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <RangePicker onChange={handleDateRangeChange} />
      </Space>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Instantaneous" key="instantaneous">
          {renderProfileContent('instantaneous')}
        </TabPane>
        <TabPane tab="Block Load Profile" key="block">
          {renderProfileContent('block')}
        </TabPane>
        <TabPane tab="Daily Load Profile" key="daily">
          {renderProfileContent('daily')}
        </TabPane>
        <TabPane tab="Billing Profile" key="billing">
          {renderProfileContent('billing')}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default MeterDataProfiles; 