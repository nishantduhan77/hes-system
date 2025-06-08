import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import MeterManagement from './components/Meters/MeterManagement';
import MeterDataProfiles from './components/MeterDataProfiles';
import EventsAndAlarms from './components/EventsAndAlarms';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

interface Meter {
  id: string;
  serialNumber: string;
  manufacturer: string;
  status: string;
}

const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('1');
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);

  const handleMeterSelect = (meter: Meter) => {
    setSelectedMeter(meter);
  };

  const renderContent = () => {
    switch (selectedKey) {
      case '1':
        return <MeterManagement onMeterSelect={handleMeterSelect} />;
      case '2':
        return selectedMeter ? (
          <MeterDataProfiles meterId={selectedMeter.id} />
        ) : (
          <Typography.Text>Please select a meter first</Typography.Text>
        );
      case '3':
        return selectedMeter ? (
          <EventsAndAlarms meterId={selectedMeter.id} />
        ) : (
          <Typography.Text>Please select a meter first</Typography.Text>
        );
      default:
        return <MeterManagement onMeterSelect={handleMeterSelect} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0, marginRight: '16px' }}>HES System</Title>
          {selectedMeter && (
            <Typography.Text style={{ marginLeft: '16px', fontSize: '16px' }}>
              Selected Meter: {selectedMeter.serialNumber} ({selectedMeter.manufacturer})
            </Typography.Text>
          )}
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            onSelect={({ key }) => setSelectedKey(key)}
          >
            <Menu.Item key="1">Meter Management</Menu.Item>
            <Menu.Item key="2" disabled={!selectedMeter}>Data Profiles</Menu.Item>
            <Menu.Item key="3" disabled={!selectedMeter}>Events & Alarms</Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '4px'
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
