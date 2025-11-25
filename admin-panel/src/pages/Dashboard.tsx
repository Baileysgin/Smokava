import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  FireOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import type { DashboardStats } from '../types/admin';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      console.log('Dashboard stats loaded:', data);
      setStats(data);
    } catch (error: any) {
      console.error('Dashboard error:', error);
      message.error(error.response?.data?.message || 'خطا در بارگذاری آمار');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>داشبورد</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="کل کاربران"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="رستوران‌ها"
              value={stats?.totalRestaurants || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="پست‌ها"
              value={stats?.totalPosts || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="پکیج‌های فروخته شده"
              value={stats?.totalPackages || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="قلیون‌های مصرف شده"
              value={stats?.totalConsumed || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="کاربران جدید (۷ روز گذشته)"
              value={stats?.recentUsers || 0}
              prefix={<UsergroupAddOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
