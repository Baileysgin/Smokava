import { Layout as AntLayout, Menu, Button, Space, Avatar, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  QrcodeOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  ShopOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useOperatorAuthStore } from '../store/operatorAuthStore';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = AntLayout;

const OperatorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, operator } = useOperatorAuthStore();

  const menuItems: MenuProps['items'] = [
    {
      key: '/operator',
      icon: <HomeOutlined />,
      label: 'داشبورد',
    },
    {
      key: '/operator/redeem',
      icon: <QrcodeOutlined />,
      label: 'استفاده از کد OTP',
    },
    {
      key: '/operator/history',
      icon: <HistoryOutlined />,
      label: 'تاریخچه مصرف',
    },
    {
      key: '/operator/customers',
      icon: <UserOutlined />,
      label: 'مشتریان',
    },
    {
      key: '/operator/restaurant',
      icon: <ShopOutlined />,
      label: 'اطلاعات رستوران',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/operator/login');
  };

  const restaurantName = operator?.assignedRestaurant?.nameFa || 'رستوران';
  const operatorName = operator?.name || operator?.firstName || operator?.phoneNumber || 'اپراتور';

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'پروفایل',
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'خروج',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', direction: 'rtl' }}>
      <Sider
        width={260}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div
          style={{
            padding: '24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '8px',
          }}
        >
          <div style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            پنل اپراتور
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {restaurantName}
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Button
            type="text"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            style={{
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'right',
            }}
          >
            خروج از سیستم
          </Button>
        </div>
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#262626' }}>
            {restaurantName}
          </div>
          <Space size="large">
            <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
              {operator?.phoneNumber}
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomLeft">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.2s' }} className="hover:bg-gray-100">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span style={{ color: '#262626' }}>{operatorName}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 0,
            minHeight: 280,
            background: '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default OperatorLayout;
