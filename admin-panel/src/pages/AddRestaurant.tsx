import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Space,
  Upload,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';

const { TextArea } = Input;
const { Title } = Typography;

const AddRestaurant = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setFieldsValue({ image: undefined });
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      let imageUrl = '';
      if (imageFile) {
        imageUrl = await convertImageToBase64(imageFile);
      } else if (values.image) {
        // If user entered a URL directly
        imageUrl = values.image;
      }

      const data = {
        name: values.name,
        nameFa: values.nameFa,
        address: values.address,
        addressFa: values.addressFa,
        phone: values.phone || '',
        city: values.city || '',
        description: values.description || '',
        image: imageUrl,
        active: true,
      };

      await adminService.createRestaurant(data);
      message.success('رستوران با موفقیت ایجاد شد');
      navigate('/restaurants');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'خطا در ایجاد رستوران');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/restaurants')}
        style={{ marginBottom: 16 }}
      >
        بازگشت
      </Button>

      <Card>
        <Title level={2} style={{ marginBottom: 24 }}>
          افزودن رستوران جدید
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="نام (انگلیسی)"
            rules={[{ required: true, message: 'لطفا نام را وارد کنید' }]}
          >
            <Input placeholder="Restaurant Name" />
          </Form.Item>

          <Form.Item
            name="nameFa"
            label="نام (فارسی)"
            rules={[{ required: true, message: 'لطفا نام فارسی را وارد کنید' }]}
          >
            <Input placeholder="نام رستوران" />
          </Form.Item>

          <Form.Item
            name="city"
            label="شهر"
          >
            <Input placeholder="تهران" />
          </Form.Item>

          <Form.Item
            name="address"
            label="آدرس (انگلیسی)"
            rules={[{ required: true, message: 'لطفا آدرس را وارد کنید' }]}
          >
            <TextArea rows={2} placeholder="Address" />
          </Form.Item>

          <Form.Item
            name="addressFa"
            label="آدرس (فارسی)"
            rules={[{ required: true, message: 'لطفا آدرس فارسی را وارد کنید' }]}
          >
            <TextArea rows={2} placeholder="آدرس رستوران" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="تلفن"
          >
            <Input placeholder="02112345678" />
          </Form.Item>

          <Form.Item
            name="description"
            label="توضیحات"
          >
            <TextArea rows={4} placeholder="توضیحات رستوران" />
          </Form.Item>

          <Form.Item
            name="image"
            label="تصویر رستوران"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                beforeUpload={() => false}
                onChange={handleImageChange}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>انتخاب تصویر</Button>
              </Upload>
              {imagePreview && (
                <div style={{ marginTop: 16 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
                  />
                  <Button
                    danger
                    size="small"
                    onClick={removeImage}
                    style={{ marginTop: 8 }}
                  >
                    حذف تصویر
                  </Button>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                یا لینک تصویر را وارد کنید:
              </div>
              <Input
                placeholder="https://example.com/image.jpg"
                onChange={(e) => {
                  form.setFieldsValue({ image: e.target.value });
                  if (e.target.value && !imageFile) {
                    setImagePreview(e.target.value);
                  } else if (!e.target.value && !imageFile) {
                    setImagePreview(null);
                  }
                }}
              />
            </Space>
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
                ذخیره
              </Button>
              <Button onClick={() => navigate('/restaurants')}>
                انصراف
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddRestaurant;
