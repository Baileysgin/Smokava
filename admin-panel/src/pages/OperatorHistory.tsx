import {
  Table,
  Card,
  Typography,
  DatePicker,
  Space,
  Button,
  message,
  Input,
  Tag,
  Avatar,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  HistoryOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface HistoryItem {
  id: string;
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
  };
  package: {
    nameFa: string;
    count: number;
    price: number;
  };
  count: number;
  flavor: string;
  consumedAt: string;
  rating?: number | null;
  isGift?: boolean;
}

const OperatorHistory = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({ total: 0, totalCount: 0 });

  useEffect(() => {
    fetchHistory();
  }, [pagination.current, dateRange, searchText]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      if (dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].startOf('day').toISOString();
        params.endDate = dateRange[1].endOf('day').toISOString();
      }

      const response = await api.get('/operator/history', { params });

      let filteredData = response.data.items;

      // Apply search filter
      if (searchText) {
        filteredData = filteredData.filter((item: HistoryItem) =>
          item.user?.phoneNumber?.includes(searchText) ||
          item.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.user?.firstName?.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      setData(filteredData);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));

      // Calculate stats
      const totalCount = filteredData.reduce((sum: number, item: HistoryItem) => sum + item.count, 0);
      setStats({ total: filteredData.length, totalCount });
    } catch (error) {
      console.error('Error fetching history:', error);
      message.error('خطا در دریافت تاریخچه');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<HistoryItem> = [
    {
      title: 'مشتری',
      dataIndex: 'user',
      key: 'user',
      width: 200,
      render: (user: HistoryItem['user']) => {
        const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber;
        return (
          <Space>
            <Avatar icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 500 }}>{name}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{user.phoneNumber}</div>
            </div>
          </Space>
        );
      },
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        const search = String(value).toLowerCase();
        return (
          record.user.phoneNumber.includes(search) ||
          record.user.name?.toLowerCase().includes(search) ||
          record.user.firstName?.toLowerCase().includes(search) ||
          false
        );
      },
    },
    {
      title: 'پکیج',
      dataIndex: ['package', 'nameFa'],
      key: 'package',
      width: 150,
    },
    {
      title: 'تعداد',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      width: 100,
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
      width: 120,
      render: (flavor: string) => flavor ? (
        <Tag color="blue">{flavor}</Tag>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: 'تاریخ و زمان',
      dataIndex: 'consumedAt',
      key: 'consumedAt',
      width: 180,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <div>{dayjs(date).format('YYYY/MM/DD')}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.consumedAt).unix() - dayjs(b.consumedAt).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'امتیاز',
      dataIndex: 'rating',
      key: 'rating',
      align: 'center',
      width: 120,
      render: (rating: number | null | undefined) => {
        if (!rating) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <Text strong>{rating}</Text>
          </Space>
        );
      },
    },
  ];

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Title level={2} style={{ margin: 0 }}>
              <HistoryOutlined /> تاریخچه مصرف
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchHistory}
              loading={loading}
            >
              بروزرسانی
            </Button>
          </div>

          {/* Stats */}
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="کل تراکنش‌ها"
                  value={stats.total}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="کل قلیون‌های مصرف شده"
                  value={stats.totalCount}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="جستجو بر اساس شماره تلفن یا نام..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 300 }}
              onChange={(e) => handleSearch(e.target.value)}
              value={searchText}
            />
            <RangePicker
              onChange={handleDateRangeChange}
              format="YYYY/MM/DD"
              placeholder={['تاریخ شروع', 'تاریخ پایان']}
              style={{ width: 300 }}
            />
            {(dateRange[0] || dateRange[1] || searchText) && (
              <Button
                onClick={() => {
                  setDateRange([null, null]);
                  setSearchText('');
                }}
              >
                پاک کردن فیلترها
              </Button>
            )}
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `مجموع ${total} تراکنش`,
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

export default OperatorHistory;
