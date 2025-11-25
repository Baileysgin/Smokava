import { useEffect, useState } from 'react';
import { Table, Card, Tag, message, Input, Space, Button, Avatar } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import type { User } from '../types/admin';

const Users = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<User[]>([]);
  const [filteredData, setFilteredData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, [pagination.current]);

  useEffect(() => {
    if (searchText) {
      const filtered = data.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.phoneNumber?.includes(searchText)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchText, data]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await adminService.getUsers(
        pagination.current,
        pagination.pageSize
      );
      setData(result.users);
      setFilteredData(result.users);
      setPagination({
        ...pagination,
        total: result.total,
      });
    } catch (error: any) {
      message.error('خطا در بارگذاری کاربران');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const columns = [
    {
      title: 'کاربر',
      key: 'user',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name || 'بدون نام'}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{record.phoneNumber}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'شماره تلفن',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
    },
    {
      title: 'نقش',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => {
        const roleMap: Record<string, { text: string; color: string }> = {
          admin: { text: 'مدیر', color: 'red' },
          restaurant_operator: { text: 'اپراتور رستوران', color: 'blue' },
          user: { text: 'کاربر', color: 'default' },
        };
        const roleInfo = roleMap[role] || roleMap.user;
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      },
    },
    {
      title: 'تاریخ عضویت',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    {
      title: 'عملیات',
      key: 'action',
      width: 120,
      render: (_: any, record: User) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record._id)}
          type="link"
        >
          جزئیات
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>لیست کاربران</h1>
          <Space>
            <Input
              placeholder="جستجو..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
            >
              رفرش
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="_id"
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} کاربر`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 20 });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Users;
