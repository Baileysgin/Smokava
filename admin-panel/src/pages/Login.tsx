import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      message.success('ورود موفقیت‌آمیز بود');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'ورود ناموفق بود';
      message.error(errorMessage);
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
          <h1 style={{ fontSize: 28, margin: 0 }}>پنل ادمین</h1>
          <p style={{ color: '#666', marginTop: 8 }}>ورود به سیستم</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="نام کاربری"
            name="username"
            rules={[{ required: true, message: 'لطفا نام کاربری را وارد کنید' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="نام کاربری"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="رمز عبور"
            name="password"
            rules={[{ required: true, message: 'لطفا رمز عبور را وارد کنید' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="رمز عبور"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
            >
              ورود
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
