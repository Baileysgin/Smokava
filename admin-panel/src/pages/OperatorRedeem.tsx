import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  Statistic,
  Divider
} from 'antd';
import {
  QrcodeOutlined,
  PhoneOutlined,
  SafetyOutlined,
  NumberOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useOperatorAuthStore } from '../store/operatorAuthStore';

const { Title, Text } = Typography;

const OperatorRedeem = () => {
  const { operator } = useOperatorAuthStore();
  const [loading, setLoading] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [successCount, setSuccessCount] = useState(0);
  const [todayRedeemed, setTodayRedeemed] = useState(0);
  const [giftForm] = Form.useForm();
  const [giftLoading, setGiftLoading] = useState(false);

  useEffect(() => {
    fetchTodayStats();
  }, []);

  const fetchTodayStats = async () => {
    try {
      const response = await api.get('/operator/dashboard');
      setTodayRedeemed(response.data.stats.todayRedemptions || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateTestOtp = async (phoneNumber: string, count: number = 1) => {
    try {
      setGeneratingOtp(true);
      const response = await api.post('/operator/generate-test-otp', {
        phoneNumber,
        count,
      });
      setGeneratedOtp(response.data.otpCode);
      form.setFieldsValue({ otpCode: response.data.otpCode });
      message.success(`کد تأیید تست ایجاد شد: ${response.data.otpCode}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'خطا در ایجاد کد تأیید';
      message.error(errorMessage);
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleGift = async (values: { phoneNumber: string }) => {
    try {
      setGiftLoading(true);
      const response = await api.post('/operator/gift', {
        phoneNumber: values.phoneNumber,
      });

      message.success({
        content: response.data.message || 'یک قلیون به عنوان هدیه برای کاربر فعال شد.',
        duration: 4,
        icon: <GiftOutlined style={{ color: '#52c41a' }} />,
      });

      giftForm.resetFields();
      fetchTodayStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'خطا در هدیه دادن قلیون';
      message.error({
        content: `❌ ${errorMessage}`,
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      });
    } finally {
      setGiftLoading(false);
    }
  };

  const onFinish = async (values: { phoneNumber: string; otpCode: string; count?: number; flavor?: string }) => {
    try {
      setLoading(true);

      // Normalize OTP to 5 digits
      const normalizedOtp = String(values.otpCode).replace(/\D/g, '').padStart(5, '0');

      const response = await api.post('/operator/redeem', {
        phoneNumber: values.phoneNumber,
        otpCode: normalizedOtp,
        count: values.count || 1,
        flavor: values.flavor || '',
      });

      message.success({
        content: `✅ پکیج با موفقیت استفاده شد! تعداد: ${response.data.count} عدد`,
        duration: 4,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });

      form.resetFields();
      setGeneratedOtp(null);
      setSuccessCount(prev => prev + 1);
      fetchTodayStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'خطا در استفاده از پکیج';
      message.error({
        content: `❌ ${errorMessage}`,
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const isDevelopment = import.meta.env.DEV;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* Gift Card */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <GiftOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
                <Title level={4} style={{ margin: 0 }}>هدیه دادن یک قلیون</Title>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Form
              form={giftForm}
              name="gift"
              onFinish={handleGift}
              layout="inline"
              autoComplete="off"
              size="large"
              style={{ width: '100%' }}
            >
              <Form.Item
                name="phoneNumber"
                rules={[
                  { required: true, message: 'لطفا شماره تلفن را وارد کنید' },
                  { pattern: /^09\d{9}$/, message: 'شماره تلفن معتبر نیست' }
                ]}
                style={{ flex: 1, marginRight: '8px' }}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="09123456789"
                  style={{ fontSize: '16px' }}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<GiftOutlined />}
                  loading={giftLoading}
                  danger
                  style={{
                    height: '40px',
                    fontSize: '16px',
                  }}
                >
                  هدیه دادن قلیون
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Main Form */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <QrcodeOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>استفاده از کد OTP</Title>
              </Space>
            }
            extra={
              <Text type="secondary">
                رستوران: {operator?.assignedRestaurant?.nameFa || 'نامشخص'}
              </Text>
            }
          >
            <Form
              form={form}
              name="redeem"
              onFinish={onFinish}
              layout="vertical"
              autoComplete="off"
              size="large"
            >
              <Form.Item
                label={
                  <Space>
                    <PhoneOutlined />
                    <span>شماره تلفن مشتری</span>
                  </Space>
                }
                name="phoneNumber"
                rules={[
                  { required: true, message: 'لطفا شماره تلفن را وارد کنید' },
                  { pattern: /^09\d{9}$/, message: 'شماره تلفن معتبر نیست (مثال: 09123456789)' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="09123456789"
                  style={{ fontSize: '16px' }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <SafetyOutlined />
                    <span>کد تأیید (OTP)</span>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      (۵ رقم)
                    </Text>
                  </Space>
                }
                name="otpCode"
                rules={[
                  { required: true, message: 'لطفا کد تأیید را وارد کنید' },
                  {
                    len: 5,
                    message: 'کد تأیید باید دقیقاً ۵ رقم باشد',
                    transform: (value) => String(value || '').replace(/\D/g, '').slice(0, 5)
                  }
                ]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    prefix={<SafetyOutlined />}
                    placeholder="12345"
                    maxLength={5}
                    style={{ flex: 1, fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
                    onInput={(e: any) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      form.setFieldsValue({ otpCode: value });
                    }}
                  />
                  {isDevelopment && (
                    <Button
                      type="dashed"
                      loading={generatingOtp}
                      onClick={() => {
                        const phoneNumber = form.getFieldValue('phoneNumber');
                        const count = form.getFieldValue('count') || 1;
                        if (phoneNumber) {
                          generateTestOtp(phoneNumber, count);
                        } else {
                          message.warning('لطفا ابتدا شماره تلفن مشتری را وارد کنید');
                        }
                      }}
                      style={{ width: '140px' }}
                    >
                      <ThunderboltOutlined /> ایجاد OTP تست
                    </Button>
                  )}
                </Space.Compact>
              </Form.Item>

              {generatedOtp && (
                <Alert
                  message={
                    <Space>
                      <Text strong>کد تأیید تست ایجاد شد:</Text>
                      <Text code style={{ fontSize: '18px', letterSpacing: '2px' }}>
                        {String(generatedOtp).padStart(5, '0')}
                      </Text>
                    </Space>
                  }
                  type="info"
                  showIcon
                  closable
                  onClose={() => setGeneratedOtp(null)}
                  style={{ marginBottom: '16px' }}
                />
              )}

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={
                      <Space>
                        <NumberOutlined />
                        <span>تعداد</span>
                      </Space>
                    }
                    name="count"
                    initialValue={1}
                    rules={[
                      { required: true, message: 'لطفا تعداد را وارد کنید' },
                      {
                        validator: (_, value) => {
                          const num = Number(value);
                          if (!value || isNaN(num) || num < 1) {
                            return Promise.reject(new Error('تعداد باید حداقل ۱ باشد'));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input
                      type="number"
                      min={1}
                      style={{ fontSize: '16px' }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={
                      <Space>
                        <EditOutlined />
                        <span>طعم (اختیاری)</span>
                      </Space>
                    }
                    name="flavor"
                  >
                    <Input
                      placeholder="مثال: سیب، نعنا، توت‌فرنگی..."
                      style={{ fontSize: '16px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<QrcodeOutlined />}
                  size="large"
                  block
                  loading={loading}
                  style={{
                    height: '50px',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  استفاده از پکیج
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Stats Sidebar */}
        <Col xs={24} lg={8}>
          <Card title="آمار امروز" style={{ marginBottom: '16px' }}>
            <Statistic
              title="قلیون‌های مصرف شده"
              value={todayRedeemed}
              prefix={<QrcodeOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '32px' }}
            />
          </Card>

          <Card title="عملکرد">
            <Statistic
              title="استفاده‌های موفق"
              value={successCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>

          <Card
            title="راهنما"
            style={{ marginTop: '16px' }}
            type="inner"
          >
            <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
              <p><strong>نحوه استفاده:</strong></p>
              <ol style={{ paddingRight: '20px', margin: 0 }}>
                <li>شماره تلفن مشتری را وارد کنید</li>
                <li>کد OTP دریافتی از اپلیکیشن را وارد کنید</li>
                <li>تعداد قلیون را مشخص کنید</li>
                <li>در صورت تمایل طعم را اضافه کنید</li>
                <li>دکمه "استفاده از پکیج" را بزنید</li>
              </ol>
              <Divider style={{ margin: '12px 0' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ⚠️ کد OTP فقط ۱۵ دقیقه معتبر است و پس از استفاده غیرفعال می‌شود
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OperatorRedeem;
