import { Layout as AntLayout, Menu, Button, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShopOutlined,
  FireOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  UserOutlined,
  AppstoreOutlined,
  GiftOutlined,
  StarOutlined,
  PlusCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Content, Sider } = AntLayout;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, admin } = useAuthStore();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'داشبورد',
    },
    {
      key: '/restaurants',
      icon: <ShopOutlined />,
      label: 'رستوران‌ها',
    },
    {
      key: '/consumed',
      icon: <FireOutlined />,
      label: 'قلیون‌های مصرف شده',
    },
    {
      key: '/sold-packages',
      icon: <ShoppingOutlined />,
      label: 'پکیج‌های فروخته شده',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'کاربران',
    },
    {
      key: '/package-management',
      icon: <AppstoreOutlined />,
      label: 'مدیریت پکیج',
    },
    {
      key: '/activate-package',
      icon: <PlusCircleOutlined />,
      label: 'فعال‌سازی پکیج',
    },
    {
      key: '/gifts',
      icon: <GiftOutlined />,
      label: 'هدایا',
    },
    {
      key: '/ratings',
      icon: <StarOutlined />,
      label: 'نظرات و امتیازها',
    },
    {
      key: '/moderation',
      icon: <EditOutlined />,
      label: 'مدیریت پست‌ها و نظرات',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AntLayout style={{ minHeight: '100vh', direction: 'rtl' }}>
      <Sider
        width={200}
        style={{
          background: '#001529',
        }}
      >
        <div
          style={{
            color: '#fff',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderBottom: '1px solid #1890ff',
          }}
        >
          پنل ادمین
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Space>
            <span>خوش آمدید، {admin?.username}</span>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
            >
              خروج
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
