import {
  Table,
  Card,
  Typography,
  DatePicker,
  Space,
  Button,
  message,
  Input,
  Select,
  Tag,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  StarOutlined as StarIcon,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RatingItem {
  _id: string;
  userId: {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  restaurantId: {
    _id: string;
    nameFa: string;
    addressFa?: string;
  };
  operatorId?: {
    firstName?: string;
    lastName?: string;
  };
  rating: number;
  packageType: 'Purchased' | 'Gift';
  createdAt: string;
}

const Ratings = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RatingItem[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    restaurantId: '',
    rating: '',
    startDate: '',
    endDate: '',
  });
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchRestaurants();
    fetchRatings();
    fetchAnalytics();
  }, [pagination.current, filters]);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/admin/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (filters.restaurantId) params.restaurantId = filters.restaurantId;
      if (filters.rating) params.rating = filters.rating;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/admin/ratings', { params });

      setData(response.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));
    } catch (error) {
      console.error('Error fetching ratings:', error);
      message.error('خطا در دریافت امتیازها');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params: any = {};
      if (filters.restaurantId) params.restaurantId = filters.restaurantId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/admin/ratings/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const columns: ColumnsType<RatingItem> = [
    {
      title: 'شماره کاربر',
      dataIndex: ['userId', 'phoneNumber'],
      key: 'phone',
      width: 150,
      render: (phone) => (
        <Space>
          <UserOutlined />
          <span>{phone}</span>
        </Space>
      ),
    },
    {
      title: 'رستوران',
      dataIndex: ['restaurantId', 'nameFa'],
      key: 'restaurant',
      width: 200,
      render: (text) => (
        <Space>
          <ShopOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'اپراتور',
      dataIndex: ['operatorId'],
      key: 'operator',
      width: 150,
      render: (operator) => {
        if (!operator) return <Text type="secondary">—</Text>;
        const name = `${operator.firstName || ''} ${operator.lastName || ''}`.trim();
        return name || <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'امتیاز',
      dataIndex: 'rating',
      key: 'rating',
      align: 'center',
      width: 120,
      render: (rating: number) => (
        <Space>
          <StarIcon style={{ color: '#faad14' }} />
          <Text strong>{rating}</Text>
        </Space>
      ),
    },
    {
      title: 'نوع پکیج',
      dataIndex: 'packageType',
      key: 'packageType',
      align: 'center',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'Gift' ? 'orange' : 'blue'}>
          {type === 'Gift' ? 'هدیه' : 'خریداری شده'}
        </Tag>
      ),
    },
    {
      title: 'تاریخ و زمان',
      dataIndex: 'createdAt',
      key: 'date',
      width: 180,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <div>{dayjs(date).format('YYYY/MM/DD')}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </Space>
      ),
    },
  ];

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].startOf('day').toISOString(),
        endDate: dates[1].endOf('day').toISOString(),
      }));
      setPagination(prev => ({ ...prev, current: 1 }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      restaurantId: '',
      rating: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Title level={2} style={{ margin: 0 }}>
              <StarIcon /> نظرات و امتیازها
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchRatings();
                fetchAnalytics();
              }}
              loading={loading}
            >
              بروزرسانی
            </Button>
          </div>

          {/* Analytics */}
          {analytics && (
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="تعداد کل امتیازها"
                    value={analytics.totalRatings}
                    prefix={<StarIcon />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              {analytics.bestRestaurant && (
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="بهترین رستوران"
                      value={analytics.bestRestaurant.averageRating}
                      prefix={<TrophyOutlined />}
                      suffix={`/ ${analytics.bestRestaurant.restaurantName}`}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              )}
            </Row>
          )}

          {/* Filters */}
          <Space wrap style={{ width: '100%' }}>
            <Select
              placeholder="فیلتر بر اساس رستوران"
              style={{ width: 200 }}
              allowClear
              value={filters.restaurantId || undefined}
              onChange={(value) => {
                setFilters(prev => ({ ...prev, restaurantId: value || '' }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            >
              {restaurants.map((r) => (
                <Select.Option key={r._id} value={r._id}>
                  {r.nameFa}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="فیلتر بر اساس امتیاز"
              style={{ width: 150 }}
              allowClear
              value={filters.rating || undefined}
              onChange={(value) => {
                setFilters(prev => ({ ...prev, rating: value || '' }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            >
              <Select.Option value="5">5 ستاره</Select.Option>
              <Select.Option value="4">4 ستاره</Select.Option>
              <Select.Option value="3">3 ستاره</Select.Option>
              <Select.Option value="2">2 ستاره</Select.Option>
              <Select.Option value="1">1 ستاره</Select.Option>
            </Select>
            <RangePicker
              onChange={handleDateRangeChange}
              format="YYYY/MM/DD"
              placeholder={['تاریخ شروع', 'تاریخ پایان']}
              style={{ width: 300 }}
            />
            {(filters.restaurantId || filters.rating || filters.startDate) && (
              <Button onClick={clearFilters}>
                پاک کردن فیلترها
              </Button>
            )}
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `مجموع ${total} امتیاز`,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }));
              },
            }}
            scroll={{ x: 800 }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default Ratings;
