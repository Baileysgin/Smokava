import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Upload,
  Avatar,
  Row,
  Col,
  Descriptions,
  Image
} from 'antd';
import {
  ShopOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../lib/api';

const { Title } = Typography;

const OperatorRestaurant = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get('/operator/dashboard');
      if (response.data.restaurant) {
        setRestaurant(response.data.restaurant);
        setImageUrl(response.data.restaurant.image || '');
        form.setFieldsValue({
          name: response.data.restaurant.name,
          address: response.data.restaurant.address,
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Note: Restaurant editing endpoint needs to be added to backend
      // For now, just show a message
      message.info('قابلیت ویرایش رستوران به زودی اضافه خواهد شد');
      setEditing(false);
    } catch (error: any) {
      message.error('خطا در ذخیره اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (info: any) => {
    if (info.file.status === 'done') {
      setImageUrl(info.file.response?.url || info.file.thumbUrl);
      message.success('تصویر با موفقیت آپلود شد');
    }
  };

  if (!restaurant) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              <ShopOutlined /> اطلاعات رستوران
            </Title>
            {!editing && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              >
                ویرایش
              </Button>
            )}
          </div>

          {!editing ? (
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <div style={{ textAlign: 'center' }}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={restaurant.name}
                      style={{ maxWidth: '100%', borderRadius: '8px' }}
                      preview
                    />
                  ) : (
                    <Avatar
                      size={200}
                      icon={<ShopOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  )}
                </div>
              </Col>
              <Col xs={24} md={16}>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="نام رستوران">
                    {restaurant.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="آدرس">
                    <Space>
                      <EnvironmentOutlined />
                      {restaurant.address}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="شناسه">
                    {restaurant._id}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                name: restaurant.name,
                address: restaurant.address,
              }}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="نام رستوران"
                    name="name"
                    rules={[{ required: true, message: 'لطفا نام رستوران را وارد کنید' }]}
                  >
                    <Input prefix={<ShopOutlined />} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="آدرس"
                    name="address"
                    rules={[{ required: true, message: 'لطفا آدرس را وارد کنید' }]}
                  >
                    <Input prefix={<EnvironmentOutlined />} size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="تصویر رستوران">
                <Upload
                  name="image"
                  listType="picture-card"
                  showUploadList={false}
                  onChange={handleImageChange}
                  beforeUpload={() => false}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="restaurant" style={{ width: '100%' }} />
                  ) : (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>آپلود تصویر</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    size="large"
                  >
                    ذخیره تغییرات
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false);
                      form.resetFields();
                      fetchRestaurant();
                    }}
                    size="large"
                  >
                    انصراف
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default OperatorRestaurant;
