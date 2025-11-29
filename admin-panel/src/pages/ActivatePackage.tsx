import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  message,
  Space,
  Typography,
  Table,
  Tag,
} from 'antd';
import { GiftOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import type { User } from '../types/admin';

const { Title } = Typography;

interface Package {
  _id: string;
  name: string;
  nameFa: string;
  count: number;
  price: number;
  badge?: string;
}

const ActivatePackage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    loadUsers();
    loadPackages();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await adminService.getUsers(1, 1000); // Get all users
      setUsers(result.users || []);
    } catch (error: any) {
      console.error('Load users error:', error);
      message.error('خطا در بارگذاری کاربران');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const packagesList = await adminService.getAllPackages();
      setPackages(packagesList || []);
    } catch (error: any) {
      console.error('Load packages error:', error);
      message.error('خطا در بارگذاری پکیج‌ها');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleActivate = async (values: { userId: string; packageId: string }) => {
    try {
      setLoading(true);
      await adminService.activatePackage(values.userId, values.packageId);
      message.success('پکیج با موفقیت برای کاربر فعال شد');
      form.resetFields();

      // Reload users to show updated package count
      await loadUsers();
    } catch (error: any) {
      console.error('Activate package error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'خطا در فعال‌سازی پکیج';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    {
      title: 'نام کاربر',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: User) => {
        return record.name || record.phoneNumber || 'بدون نام';
      },
    },
    {
      title: 'شماره تلفن',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
  ];

  return (
    <div>
      <Title level={2}>فعال‌سازی پکیج برای کاربر</Title>

      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleActivate}
        >
          <Form.Item
            label="انتخاب کاربر"
            name="userId"
            rules={[{ required: true, message: 'لطفا کاربر را انتخاب کنید' }]}
          >
            <Select
              showSearch
              placeholder="جستجو و انتخاب کاربر"
              optionFilterProp="children"
              loading={loadingUsers}
              filterOption={(input, option) => {
                const user = users.find(u => u._id === option?.value);
                const searchText = input.toLowerCase();
                return (
                  user?.phoneNumber?.includes(searchText) ||
                  user?.name?.toLowerCase().includes(searchText) ||
                  false
                );
              }}
            >
              {users.map((user) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name
                    ? `${user.name} - ${user.phoneNumber}`
                    : user.phoneNumber}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="انتخاب پکیج"
            name="packageId"
            rules={[{ required: true, message: 'لطفا پکیج را انتخاب کنید' }]}
          >
            <Select
              placeholder="انتخاب پکیج"
              loading={loadingPackages}
            >
              {packages.map((pkg) => (
                <Select.Option key={pkg._id} value={pkg._id}>
                  {pkg.nameFa} ({pkg.count} عدد) - {pkg.price.toLocaleString()} تومان
                  {pkg.badge && (
                    <Tag color={pkg.badge === 'popular' ? 'blue' : 'red'} style={{ marginLeft: 8 }}>
                      {pkg.badge === 'popular' ? 'محبوب' : 'ویژه'}
                    </Tag>
                  )}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<GiftOutlined />}
                loading={loading}
              >
                فعال‌سازی پکیج
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadUsers();
                  loadPackages();
                }}
              >
                بروزرسانی
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="لیست کاربران">
        <Table
          dataSource={users}
          columns={userColumns}
          rowKey="_id"
          loading={loadingUsers}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} کاربر`,
          }}
        />
      </Card>
    </div>
  );
};

export default ActivatePackage;
