import { Card, Statistic, Row, Col, Typography, Spin, Table, Tag, Avatar, Empty, Space, Button } from 'antd';
import {
  FireOutlined,
  CalendarOutlined,
  UserOutlined,
  TrophyOutlined,
  ShopOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DashboardStats {
  restaurant: {
    name: string;
    address: string;
    _id: string;
    image?: string;
  };
  stats: {
    todayRedemptions: number;
    weekRedemptions: number;
    monthRedemptions: number;
    todayItemsCount: number;
    uniqueCustomers: number;
    topFlavors: Array<{ flavor: string; count: number }>;
    chartData: Array<{ date: string; day: string; count: number }>;
    recentRedemptions: Array<{
      id: string;
      user: any;
      count: number;
      flavor?: string;
      consumedAt: string;
    }>;
  };
}

const OperatorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/operator/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentColumns = [
    {
      title: 'مشتری',
      key: 'user',
      render: (_: any, record: any) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.user?.name || record.user?.firstName || record.user?.phoneNumber || 'نامشخص'}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.user?.phoneNumber}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'تعداد',
      dataIndex: 'count',
      key: 'count',
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="orange" style={{ fontSize: '14px', padding: '4px 12px' }}>
          {count} عدد
        </Tag>
      ),
    },
    {
      title: 'طعم',
      dataIndex: 'flavor',
      key: 'flavor',
      render: (flavor: string) => flavor ? (
        <Tag color="blue">{flavor}</Tag>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: 'زمان',
      dataIndex: 'consumedAt',
      key: 'consumedAt',
      render: (date: string) => dayjs(date).format('HH:mm - YYYY/MM/DD'),
    },
  ];

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Restaurant Header */}
      {stats && (
        <Card
          style={{
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff',
          }}
        >
          <Row align="middle" gutter={24}>
            <Col flex="auto">
              <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: '8px' }}>
                {stats.restaurant.name}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                <ShopOutlined /> {stats.restaurant.address}
              </Text>
            </Col>
            {stats.restaurant.image && (
              <Col>
                <Avatar
                  size={80}
                  src={stats.restaurant.image}
                  icon={<ShopOutlined />}
                  style={{ border: '3px solid rgba(255,255,255,0.3)' }}
                />
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="قلیون‌های امروز"
              value={stats?.stats.todayRedemptions || 0}
              prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: '28px' }}
              suffix="عدد"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="قلیون‌های این هفته"
              value={stats?.stats.weekRedemptions || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
              suffix="عدد"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="قلیون‌های این ماه"
              value={stats?.stats.monthRedemptions || 0}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '28px' }}
              suffix="عدد"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="مشتریان منحصر به فرد"
              value={stats?.stats.uniqueCustomers || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
              suffix="نفر"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>آمار مصرف ۷ روز گذشته</span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            {stats?.stats.chartData && stats.stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} عدد`, 'مصرف']}
                    labelFormatter={(label) => `روز: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#1890ff"
                    radius={[8, 8, 0, 0]}
                    name="تعداد مصرف"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="داده‌ای برای نمایش وجود ندارد" />
            )}
          </Card>
        </Col>

        {/* Top Flavors */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <TrophyOutlined />
                <span>محبوب‌ترین طعم‌ها</span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            {stats?.stats.topFlavors && stats.stats.topFlavors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.stats.topFlavors.map((item, index) => (
                  <div
                    key={item.flavor}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: index === 0 ? '#f0f5ff' : '#fafafa',
                      borderRadius: '8px',
                      border: index === 0 ? '2px solid #1890ff' : '1px solid #e8e8e8',
                    }}
                  >
                    <Space>
                      {index === 0 && <TrophyOutlined style={{ color: '#faad14' }} />}
                      <span style={{ fontWeight: index === 0 ? 600 : 400 }}>
                        {item.flavor}
                      </span>
                    </Space>
                    <Tag color={index === 0 ? 'gold' : 'default'}>
                      {item.count} عدد
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="اطلاعاتی ثبت نشده" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Redemptions */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>آخرین مصرف‌ها</span>
          </Space>
        }
        style={{ marginTop: '24px' }}
        extra={
          <Button type="link" onClick={fetchDashboard}>
            بروزرسانی
          </Button>
        }
      >
        {stats?.stats.recentRedemptions && stats.stats.recentRedemptions.length > 0 ? (
          <Table
            columns={recentColumns}
            dataSource={stats.stats.recentRedemptions}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        ) : (
          <Empty description="هنوز مصرفی ثبت نشده است" />
        )}
      </Card>
    </div>
  );
};

export default OperatorDashboard;
