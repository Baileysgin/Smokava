import {
  Table,
  Card,
  Typography,
  Input,
  Space,
  Avatar,
  Tag,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  PhoneOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface Customer {
  _id: string;
  phoneNumber: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  totalRedemptions: number;
  totalCount: number;
  lastVisit?: string;
}

const OperatorCustomers = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.current]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/operator/history', {
        params: {
          page: 1,
          limit: 1000, // Get all to calculate customer stats
        },
      });

      // Group by customer
      const customerMap = new Map<string, Customer>();

      response.data.items.forEach((item: any) => {
        const userId = item.user?._id || item.user?.phoneNumber;
        if (!userId) return;

        if (!customerMap.has(userId)) {
          customerMap.set(userId, {
            _id: userId,
            phoneNumber: item.user.phoneNumber,
            name: item.user.name || item.user.firstName || item.user.lastName,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            totalRedemptions: 0,
            totalCount: 0,
            lastVisit: item.consumedAt,
          });
        }

        const customer = customerMap.get(userId)!;
        customer.totalRedemptions += 1;
        customer.totalCount += item.count;

        // Update last visit if this is more recent
        if (new Date(item.consumedAt) > new Date(customer.lastVisit || 0)) {
          customer.lastVisit = item.consumedAt;
        }
      });

      const customerList = Array.from(customerMap.values());
      setCustomers(customerList);
      setPagination(prev => ({
        ...prev,
        total: customerList.length,
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.phoneNumber.includes(searchText) ||
    customer.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.firstName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Customer> = [
    {
      title: 'مشتری',
      key: 'customer',
      width: 250,
      render: (_, record: Customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'نامشخص'}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              <PhoneOutlined /> {record.phoneNumber}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'تعداد بازدید',
      dataIndex: 'totalRedemptions',
      key: 'totalRedemptions',
      align: 'center',
      width: 120,
      render: (count: number) => (
        <Tag color="blue">{count} بار</Tag>
      ),
      sorter: (a, b) => a.totalRedemptions - b.totalRedemptions,
    },
    {
      title: 'کل قلیون مصرف شده',
      dataIndex: 'totalCount',
      key: 'totalCount',
      align: 'center',
      width: 150,
      render: (count: number) => (
        <Tag color="orange">{count} عدد</Tag>
      ),
      sorter: (a, b) => a.totalCount - b.totalCount,
    },
    {
      title: 'آخرین بازدید',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      width: 180,
      render: (date: string) => date ? (
        <Text>{new Date(date).toLocaleDateString('fa-IR')}</Text>
      ) : <Text type="secondary">-</Text>,
      sorter: (a, b) => {
        const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return dateA - dateB;
      },
    },
  ];

  const totalCustomers = filteredCustomers.length;
  const totalRedemptions = filteredCustomers.reduce((sum, c) => sum + c.totalRedemptions, 0);
  const totalShisha = filteredCustomers.reduce((sum, c) => sum + c.totalCount, 0);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Title level={2} style={{ margin: 0 }}>
              <UserOutlined /> مشتریان
            </Title>
            <Input
              placeholder="جستجو بر اساس شماره تلفن یا نام..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="کل مشتریان"
                  value={totalCustomers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="کل بازدیدها"
                  value={totalRedemptions}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="کل قلیون مصرف شده"
                  value={totalShisha}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={filteredCustomers}
            loading={loading}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredCustomers.length,
              showSizeChanger: true,
              showTotal: (total) => `مجموع ${total} مشتری`,
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

export default OperatorCustomers;
