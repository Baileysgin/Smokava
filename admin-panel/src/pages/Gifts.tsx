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
  Statistic
} from 'antd';
import {
  GiftOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface GiftItem {
  _id: string;
  user: {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  giftFromRestaurantId: {
    _id: string;
    nameFa: string;
    addressFa?: string;
  };
  operatorId?: {
    firstName?: string;
    lastName?: string;
  };
  purchasedAt: string;
  remainingCount: number;
  status: 'Used' | 'Not used';
}

const Gifts = () => {
  console.log('Gifts component rendering...');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GiftItem[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    restaurantId: '',
    operatorId: '',
    customerPhone: '',
    startDate: '',
    endDate: '',
  });

  // Initialize restaurants on mount
  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch gifts when filters or pagination changes
  useEffect(() => {
    fetchGifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, filters.restaurantId, filters.operatorId, filters.customerPhone, filters.startDate, filters.endDate]);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/admin/restaurants');
      setRestaurants(response.data || []);
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      // Don't show error message for restaurants, just log it
    }
  };

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (filters.restaurantId) params.restaurantId = filters.restaurantId;
      if (filters.operatorId) params.operatorId = filters.operatorId;
      if (filters.customerPhone) params.customerPhone = filters.customerPhone;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/admin/gifts', { params });

      setData(response.data?.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (error: any) {
      console.error('Error fetching gifts:', error);
      message.error(error.response?.data?.message || 'خطا در دریافت هدایا');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<GiftItem> = [
    {
      title: 'رستوران',
      dataIndex: ['giftFromRestaurantId', 'nameFa'],
      key: 'restaurant',
      width: 200,
      render: (text, record) => (
        <Space>
          <ShopOutlined />
          <span>{text || record.giftFromRestaurantId?.nameFa || 'نامشخص'}</span>
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
      title: 'شماره مشتری',
      dataIndex: ['user', 'phoneNumber'],
      key: 'phone',
      width: 150,
      render: (phone) => (
        <Space>
          <UserOutlined />
          <span>{phone || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'تاریخ و زمان',
      dataIndex: 'purchasedAt',
      key: 'date',
      width: 180,
      render: (date: string) => {
        if (!date) return <Text type="secondary">—</Text>;
        try {
          return (
            <Space direction="vertical" size={0}>
              <div>{dayjs(date).format('YYYY/MM/DD')}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {dayjs(date).format('HH:mm')}
              </div>
            </Space>
          );
        } catch {
          return <Text type="secondary">—</Text>;
        }
      },
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'Used' ? 'red' : 'green'}>
          {status === 'Used' ? 'استفاده شده' : 'استفاده نشده'}
        </Tag>
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
      operatorId: '',
      customerPhone: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const stats = {
    total: pagination.total,
    used: data.filter(item => item.status === 'Used').length,
    notUsed: data.filter(item => item.status === 'Not used').length,
  };

  console.log('Gifts component render - data:', data.length, 'loading:', loading);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Title level={2} style={{ margin: 0 }}>
              <GiftOutlined /> هدایای رستوران‌ها
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchGifts}
              loading={loading}
            >
              بروزرسانی
            </Button>
          </div>

          {/* Stats */}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="کل هدایا"
                  value={stats.total}
                  prefix={<GiftOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="استفاده شده"
                  value={stats.used}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="استفاده نشده"
                  value={stats.notUsed}
                  prefix={<GiftOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

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
            <Input
              placeholder="جستجو بر اساس شماره تلفن مشتری..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 250 }}
              value={filters.customerPhone}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, customerPhone: e.target.value }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            />
            <RangePicker
              onChange={handleDateRangeChange}
              format="YYYY/MM/DD"
              placeholder={['تاریخ شروع', 'تاریخ پایان']}
              style={{ width: 300 }}
            />
            {(filters.restaurantId || filters.customerPhone || filters.startDate) && (
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
              showTotal: (total) => `مجموع ${total} هدیه`,
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

export default Gifts;
