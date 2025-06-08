import React, { useState } from 'react';
import { Table, Card, Tabs, Tag } from 'antd';

const { TabPane } = Tabs;

interface Event {
  timestamp: string;
  type: string;
  description: string;
  status: string;
  obisCode: string;
}

const EVENT_TYPES = {
  voltage: {
    name: 'Voltage Events',
    obisCode: '0.0.99.98.0.255'
  },
  current: {
    name: 'Current Events',
    obisCode: '0.0.99.98.1.255'
  },
  power: {
    name: 'Power Events',
    obisCode: '0.0.99.98.2.255'
  },
  transaction: {
    name: 'Transaction Events',
    obisCode: '0.0.99.98.3.255'
  },
  other: {
    name: 'Other Events',
    obisCode: '0.0.99.98.4.255'
  },
  nonRollover: {
    name: 'Non-rollover Events',
    obisCode: '0.0.99.98.5.255'
  },
  control: {
    name: 'Control Events',
    obisCode: '0.0.99.98.6.255'
  }
};

const EventsAndAlarms: React.FC<{ meterId: string }> = ({ meterId }) => {
  const [activeTab, setActiveTab] = useState('voltage');

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'red' : 'green'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'OBIS Code',
      dataIndex: 'obisCode',
      key: 'obisCode',
    }
  ];

  const mockEventData = (type: string): Event[] => {
    // This is mock data - in real implementation, this would fetch from backend
    return Array(3).fill(null).map((_, index) => ({
      timestamp: new Date(Date.now() - index * 3600000).toISOString(),
      type,
      description: `Sample ${type} event ${index + 1}`,
      status: index === 0 ? 'Active' : 'Cleared',
      obisCode: EVENT_TYPES[type as keyof typeof EVENT_TYPES].obisCode
    }));
  };

  return (
    <Card title={`Events and Alarms - ${meterId}`}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {Object.entries(EVENT_TYPES).map(([key, value]) => (
          <TabPane tab={value.name} key={key}>
            <div>OBIS Code: {value.obisCode}</div>
            <Table 
              columns={columns} 
              dataSource={mockEventData(key)}
              rowKey="timestamp"
            />
          </TabPane>
        ))}
      </Tabs>
    </Card>
  );
};

export default EventsAndAlarms; 