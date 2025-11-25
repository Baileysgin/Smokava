import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Space,
  Button,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Avatar,
  Modal,
  Form,
  Select,
} from 'antd';
import { ArrowLeftOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import type { UserDetails } from '../types/admin';

const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadUserDetails();
      loadRestaurants();
    }
  }, [id]);

  const loadUserDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await adminService.getUserDetails(id);
      setUserDetails(data);
    } catch (error: any) {
      message.error('خطا در بارگذاری اطلاعات کاربر');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const data = await adminService.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const handleRoleUpdate = async (values: { role: string; assignedRestaurant?: string }) => {
    if (!id) return;
    try {
      await adminService.updateUserRole(id, values.role, values.assignedRestaurant);
      message.success('نقش کاربر با موفقیت به‌روزرسانی شد');
      setRoleModalVisible(false);
      loadUserDetails();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'خطا در به‌روزرسانی نقش');
    }
  };

  const openRoleModal = () => {
    if (userDetails) {
      form.setFieldsValue({
        role: userDetails.user.role || 'user',
        assignedRestaurant: userDetails.user.assignedRestaurant?._id || undefined,
      });
      setRoleModalVisible(true);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  const packageColumns = [
    {
      title: 'نوع پکیج',
      key: 'package',
      render: (_: any, record: any) => record.package?.nameFa || '-',
    },
    {
      title: 'کل',
      dataIndex: 'totalCount',
      key: 'totalCount',
      align: 'center' as const,
    },
    {
      title: 'مصرف شده',
      key: 'consumed',
      align: 'center' as const,
      render: (_: any, record: any) => record.totalCount - record.remainingCount,
    },
    {
      title: 'باقیمانده',
      dataIndex: 'remainingCount',
      key: 'remainingCount',
      align: 'center' as const,
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'red'}>{count}</Tag>
      ),
    },
    {
      title: 'تاریخ خرید',
      dataIndex: 'purchasedAt',
      key: 'purchasedAt',
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR');
      },
    },
  ];

  const postColumns = [
    {
      title: 'رستوران',
      key: 'restaurant',
      render: (_: any, record: any) => record.restaurant?.nameFa || '-',
    },
    {
      title: 'آدرس',
      key: 'address',
      render: (_: any, record: any) => record.restaurant?.addressFa || '-',
      ellipsis: true,
    },
    {
      title: 'طعم',
      dataIndex: 'flavor',
      key: 'flavor',
      render: (flavor: string) => flavor || '-',
    },
    {
      title: 'کپشن',
      dataIndex: 'caption',
      key: 'caption',
      ellipsis: true,
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR');
      },
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/users')}
        style={{ marginBottom: 16 }}
      >
        بازگشت
      </Button>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Descriptions
            title="اطلاعات کاربر"
            bordered
            extra={
              <Button icon={<EditOutlined />} onClick={openRoleModal}>
                ویرایش نقش
              </Button>
            }
          >
            <Descriptions.Item label="نام">
              <Space>
                <Avatar src={userDetails.user.avatar} icon={<UserOutlined />} />
                {userDetails.user.name || 'بدون نام'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="شماره تلفن">
              {userDetails.user.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="نقش">
              <Tag color={
                userDetails.user.role === 'admin' ? 'red' :
                userDetails.user.role === 'restaurant_operator' ? 'blue' : 'default'
              }>
                {userDetails.user.role === 'admin' ? 'مدیر' :
                 userDetails.user.role === 'restaurant_operator' ? 'اپراتور رستوران' : 'کاربر'}
              </Tag>
            </Descriptions.Item>
            {userDetails.user.role === 'restaurant_operator' && userDetails.user.assignedRestaurant && (
              <Descriptions.Item label="رستوران اختصاصی">
                {userDetails.user.assignedRestaurant.nameFa}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="تاریخ عضویت">
              {new Date(userDetails.user.createdAt).toLocaleDateString('fa-IR')}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="پکیج‌ها"
                  value={userDetails.stats.totalPackages}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="قلیون‌های مصرف شده"
                  value={userDetails.stats.totalConsumed}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="رستوران‌های بازدید شده"
                  value={userDetails.stats.restaurantsVisited}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="پست‌ها"
                  value={userDetails.stats.totalPosts}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="پکیج‌ها" style={{ marginTop: 16 }}>
            <Table
              columns={packageColumns}
              dataSource={userDetails.packages}
              rowKey="_id"
              pagination={false}
            />
          </Card>

          <Card title="پست‌ها" style={{ marginTop: 16 }}>
            <Table
              columns={postColumns}
              dataSource={userDetails.posts}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </Space>
      </Card>

      <Modal
        title="ویرایش نقش کاربر"
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        onOk={() => form.submit()}
        okText="ذخیره"
        cancelText="لغو"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRoleUpdate}
        >
          <Form.Item
            label="نقش"
            name="role"
            rules={[{ required: true, message: 'لطفا نقش را انتخاب کنید' }]}
          >
            <Select>
              <Select.Option value="user">کاربر عادی</Select.Option>
              <Select.Option value="restaurant_operator">اپراتور رستوران</Select.Option>
              <Select.Option value="admin">مدیر</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) =>
              getFieldValue('role') === 'restaurant_operator' ? (
                <Form.Item
                  label="رستوران اختصاصی"
                  name="assignedRestaurant"
                  rules={[{ required: true, message: 'لطفا رستوران را انتخاب کنید' }]}
                >
                  <Select placeholder="انتخاب رستوران">
                    {restaurants.map((restaurant) => (
                      <Select.Option key={restaurant._id} value={restaurant._id}>
                        {restaurant.nameFa}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserDetailsPage;
