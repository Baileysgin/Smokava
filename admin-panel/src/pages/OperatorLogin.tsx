import { Form, Input, Button, Card, message, Steps } from 'antd';
import { PhoneOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOperatorAuthStore } from '../store/operatorAuthStore';
import { useEffect, useState } from 'react';

const OperatorLogin = () => {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, isAuthenticated } = useOperatorAuthStore();
  const [step, setStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/operator', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSendOtp = async (values: { phoneNumber: string }) => {
    try {
      setLoading(true);
      console.log('Sending OTP to:', values.phoneNumber);
      await sendOtp(values.phoneNumber);
      setPhoneNumber(values.phoneNumber);

      // In development, fetch OTP to display
      if (import.meta.env.DEV) {
        try {
          const api = (await import('../lib/api')).default;
          const response = await api.get('/auth/get-otp', {
            params: { phoneNumber: values.phoneNumber }
          });
          if (response.data?.otpCode) {
            setDevOtp(response.data.otpCode);
            console.log('🔑 OTP Code:', response.data.otpCode);
          }
        } catch (e) {
          // Ignore if endpoint doesn't exist
        }
      }

      setStep(1);
      message.success('کد تأیید ارسال شد');
    } catch (error: any) {
      console.error('OTP send error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'خطا در ارسال کد تأیید';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (values: { otpCode: string }) => {
    try {
      setLoading(true);
      await verifyOtp(phoneNumber, values.otpCode);
      message.success('ورود موفقیت‌آمیز بود');
      navigate('/operator');
    } catch (error: any) {
      message.error(error.message || 'کد تأیید نامعتبر است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>پنل اپراتور رستوران</h1>
          <p style={{ color: '#666', marginTop: 8 }}>ورود به سیستم</p>
        </div>

        <Steps
          current={step}
          items={[
            { title: 'شماره تلفن' },
            { title: 'کد تأیید' },
          ]}
          style={{ marginBottom: 30 }}
        />

        {step === 0 ? (
          <Form
            name="sendOtp"
            onFinish={onSendOtp}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="شماره تلفن"
              name="phoneNumber"
              rules={[
                { required: true, message: 'لطفا شماره تلفن را وارد کنید' },
                { pattern: /^09\d{9}$/, message: 'شماره تلفن معتبر نیست' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="09123456789"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                ارسال کد تأیید
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            name="verifyOtp"
            onFinish={onVerifyOtp}
            autoComplete="off"
            layout="vertical"
          >
            {devOtp && (
              <div style={{
                marginBottom: 16,
                padding: 12,
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 4,
                textAlign: 'center'
              }}>
                <strong>🔑 کد تأیید (حالت توسعه):</strong> {devOtp}
              </div>
            )}
            <Form.Item
              label="کد تأیید"
              name="otpCode"
              rules={[
                { required: true, message: 'لطفا کد تأیید را وارد کنید' },
                { len: 6, message: 'کد تأیید باید ۶ رقم باشد' }
              ]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder={devOtp || "123456"}
                size="large"
                maxLength={6}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                تأیید و ورود
              </Button>
            </Form.Item>

            <Button
              type="link"
              block
              onClick={() => setStep(0)}
            >
              تغییر شماره تلفن
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default OperatorLogin;
