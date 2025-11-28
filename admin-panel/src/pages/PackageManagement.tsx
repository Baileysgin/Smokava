import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Space,
  Typography,
  Select,
  Modal,
} from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';

const { Title } = Typography;

interface PackageData {
  _id?: string;
  name: string;
  nameFa: string;
  count: number;
  price: number;
  badge?: string;
  description?: string;
  quantity_display_fa?: string;
  price_per_item_fa?: string;
  feature_usage_fa?: string;
  feature_validity_fa?: string;
  feature_support_fa?: string;
}

const PackageManagement = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null | undefined>(undefined);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    console.log('🔐 Authentication check - isAuthenticated:', isAuthenticated);
    console.log('🔐 Token in localStorage:', !!localStorage.getItem('adminToken'));
  }, [checkAuth, isAuthenticated]);

  useEffect(() => {
    const init = async () => {
      console.log('=== Component Mounted - Loading Packages ===');
      await loadAllPackages();
    };
    init();
  }, []);

  useEffect(() => {
    console.log('🔄 selectedPackageId changed:', selectedPackageId);
    if (selectedPackageId && selectedPackageId !== 'new') {
      console.log('📦 Loading package for editing');
      loadPackage(selectedPackageId);
    } else if (selectedPackageId === null) {
      // Clear form when creating new package
      console.log('➕ Clearing form for new package');
      form.resetFields();
      form.setFieldsValue({
        item_quantity: 0,
        total_price: 0,
      });
      setPackageData(null);
    }
  }, [selectedPackageId]);

  const loadAllPackages = async () => {
    try {
      setLoadingPackages(true);
      console.log('=== LOADING PACKAGES ===');
      console.log('API URL:', import.meta.env.VITE_API_URL || 'Not set (check VITE_API_URL env variable)');
      const token = localStorage.getItem('adminToken');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');

      console.log('Calling adminService.getAllPackages()...');
      const data = await adminService.getAllPackages();
      console.log('API call completed');
      console.log('Loaded packages response:', data);
      console.log('Is array?', Array.isArray(data));
      console.log('Data length:', data?.length);

      if (data && Array.isArray(data)) {
        console.log('✅ Valid packages data received:', data.length, 'packages');
        console.log('Packages details:', data.map(p => ({ id: p._id, name: p.nameFa, count: p.count, price: p.price })));
        console.log('Setting packages state with:', data);
        setPackages(data);
        console.log('Packages state should now have', data.length, 'items');

        // Only auto-select if no package is currently selected and we have packages
        // Don't auto-select if user is creating a new package (selectedPackageId is null intentionally)
        if (data.length > 0 && selectedPackageId === undefined) {
          console.log('Auto-selecting first package:', data[0]._id);
          setSelectedPackageId(data[0]._id || null);
        } else if (data.length === 0) {
          console.warn('⚠️ Packages array is empty');
          message.warning('هیچ پکیجی در سیستم یافت نشد. می‌توانید پکیج جدید ایجاد کنید.');
        } else {
          console.log('Keeping current selection:', selectedPackageId);
        }
      } else {
        console.error('❌ Invalid packages data:', data);
        console.error('Data type:', typeof data);
        console.error('Is array?', Array.isArray(data));
        message.error('داده‌های دریافتی نامعتبر است');
      }
    } catch (error: any) {
      console.error('Error loading packages:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      const errorMsg = error.response?.data?.message || error.message || 'خطا در بارگذاری لیست پکیج‌ها';

      // Check for authentication errors
      if (error.response?.status === 401) {
        console.error('❌ Authentication error - token may be expired or invalid');
        message.error('خطای احراز هویت. لطفا دوباره وارد شوید.');
        // The interceptor should redirect to login, but let's make sure
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoadingPackages(false);
    }
  };

  const loadPackage = async (packageId?: string) => {
    try {
      if (!packageId) {
        console.log('⚠️ No package ID provided, skipping load');
        return;
      }
      setLoading(true);
      console.log('📦 Loading package with ID:', packageId);
      const data = await adminService.getPackageById(packageId);
      console.log('✅ Package loaded:', data);
      setPackageData(data);
      if (data._id) {
        setSelectedPackageId(data._id);
      }

      // Set form values
      console.log('📝 Setting form values from package data');
      form.setFieldsValue({
        item_quantity: data.count || 0,
        total_price: data.price || 0,
        package_title_fa: data.nameFa || '',
        quantity_display_fa: data.quantity_display_fa || '',
        price_per_item_fa: data.price_per_item_fa || '',
        feature_usage_fa: data.feature_usage_fa || '',
        feature_validity_fa: data.feature_validity_fa || '',
        feature_support_fa: data.feature_support_fa || '',
      });
      console.log('✅ Form values set:', form.getFieldsValue());
    } catch (error: any) {
      console.error('❌ Error loading package:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      message.error('خطا در بارگذاری اطلاعات پکیج: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      console.log('=== FORM SUBMISSION START ===');
      console.log('Form values:', values);
      console.log('Selected package ID:', selectedPackageId);
      console.log('Package data:', packageData);

      // Validate required fields
      if (!values.item_quantity && values.item_quantity !== 0) {
        message.error('لطفا تعداد آیتم را وارد کنید');
        setLoading(false);
        return;
      }

      if (!values.total_price && values.total_price !== 0) {
        message.error('لطفا قیمت کل را وارد کنید');
        setLoading(false);
        return;
      }

      if (!values.package_title_fa) {
        message.error('لطفا عنوان پکیج را وارد کنید');
        setLoading(false);
        return;
      }

      const updateData = {
        item_quantity: values.item_quantity,
        total_price: values.total_price,
        package_title_fa: values.package_title_fa,
        quantity_display_fa: values.quantity_display_fa || '',
        price_per_item_fa: values.price_per_item_fa || '',
        feature_usage_fa: values.feature_usage_fa || '',
        feature_validity_fa: values.feature_validity_fa || '',
        feature_support_fa: values.feature_support_fa || '',
      };

      console.log('Update data:', updateData);

      let savedPackage;
      if (selectedPackageId && selectedPackageId !== 'new') {
        // Update existing package
        console.log('🔄 Updating existing package:', selectedPackageId);
        savedPackage = await adminService.updatePackage(selectedPackageId, updateData);
        console.log('✅ Package updated:', savedPackage);
        message.success('پکیج با موفقیت به‌روزرسانی شد');
      } else {
        // Create new package
        console.log('➕ Creating new package with data:', updateData);
        savedPackage = await adminService.updatePackage(null, updateData);
        console.log('✅ Package created:', savedPackage);
        message.success('پکیج جدید با موفقیت ایجاد شد');
        // Set the newly created package as selected
        if (savedPackage?._id) {
          console.log('📌 Setting new package as selected:', savedPackage._id);
          setSelectedPackageId(savedPackage._id);
        }
      }

      // Reload all packages to refresh the list
      console.log('🔄 Reloading all packages...');
      await loadAllPackages();

      // Reload the current package to show updated data
      const packageToLoad = (selectedPackageId && selectedPackageId !== 'new') ? selectedPackageId : savedPackage?._id;
      if (packageToLoad) {
        console.log('📦 Reloading package:', packageToLoad);
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          loadPackage(packageToLoad);
        }, 100);
      } else {
        console.log('⚠️ No package to reload');
      }
    } catch (error: any) {
      console.error('=== FORM SUBMISSION ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      const errorMessage = error.response?.data?.message || error.message || 'خطا در به‌روزرسانی پکیج';
      console.error('Displaying error message:', errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('=== FORM SUBMISSION END ===');
    }
  };

  const handleDelete = async () => {
    if (!selectedPackageId || selectedPackageId === 'new') {
      message.warning('لطفا ابتدا پکیجی را انتخاب کنید');
      return;
    }

    const selectedPackage = packages.find(p => p._id === selectedPackageId);
    if (!selectedPackage) {
      message.error('پکیج انتخاب شده یافت نشد');
      return;
    }

    Modal.confirm({
      title: 'حذف پکیج',
      content: `آیا از حذف پکیج "${selectedPackage.nameFa}" مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
      okText: 'حذف',
      okType: 'danger',
      cancelText: 'انصراف',
      onOk: async () => {
        try {
          setLoading(true);
          console.log('🗑️ Deleting package:', selectedPackageId);
          await adminService.deletePackage(selectedPackageId);
          console.log('✅ Package deleted successfully');
          message.success('پکیج با موفقیت حذف شد');

          // Clear selection and reload packages
          setSelectedPackageId(undefined);
          form.resetFields();
          setPackageData(null);
          await loadAllPackages();
        } catch (error: any) {
          console.error('❌ Error deleting package:', error);
          message.error('خطا در حذف پکیج: ' + (error.response?.data?.message || error.message));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            مدیریت پکیج قلیون
          </Title>
          <Button
            type="primary"
            onClick={() => {
              setSelectedPackageId(null);
              form.resetFields();
              setPackageData(null);
            }}
            icon={<PlusOutlined />}
          >
            ایجاد پکیج جدید
          </Button>
        </div>

        <Form.Item
          label="انتخاب پکیج"
          style={{ marginBottom: 24 }}
        >
          <Space style={{ width: '100%' }} direction="vertical">
            {/* Debug info */}
            {import.meta.env.DEV && (
              <div style={{ padding: '8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
                Debug: Packages loaded: {packages.length} | Selected: {selectedPackageId || 'none'} | Loading: {loadingPackages ? 'yes' : 'no'}
              </div>
            )}
            <Select
              value={selectedPackageId || undefined}
              onChange={(value) => {
                console.log('📋 Package selection changed:', value);
                console.log('Current packages state:', packages.length);
                if (value === 'new') {
                  console.log('➕ Creating new package mode');
                  setSelectedPackageId(null);
                  form.resetFields();
                  setPackageData(null);
                } else if (value) {
                  console.log('📦 Selecting package:', value);
                  setSelectedPackageId(value);
                } else {
                    console.log('🗑️ Clearing selection');
                    setSelectedPackageId(null);
                    form.resetFields();
                    setPackageData(null);
                }
              }}
              style={{ width: '100%' }}
              placeholder="پکیج را انتخاب کنید یا پکیج جدید ایجاد کنید"
              loading={loadingPackages}
              allowClear
              showSearch
              filterOption={(input, option) => {
                if (option?.value === 'new') return true;
                const label = option?.children?.toString() || '';
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              notFoundContent={loadingPackages ? 'در حال بارگذاری...' : packages.length === 0 ? 'پکیجی یافت نشد - می‌توانید پکیج جدید ایجاد کنید' : 'پکیجی یافت نشد'}
              dropdownRender={(menu) => {
                console.log('Dropdown render - packages count:', packages.length);
                return menu;
              }}
            >
              <Select.Option value="new" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                ➕ ایجاد پکیج جدید
              </Select.Option>
              {packages && packages.length > 0 ? (
                packages.map((pkg) => {
                  if (!pkg || !pkg._id) {
                    console.warn('Invalid package in array:', pkg);
                    return null;
                  }
                  console.log('Rendering package option:', pkg._id, pkg.nameFa);
                  return (
                    <Select.Option key={pkg._id} value={pkg._id}>
                      {pkg.nameFa || 'بدون نام'} ({pkg.count || 0} عدد - {pkg.price?.toLocaleString('fa-IR') || pkg.price || 0} تومان)
                    </Select.Option>
                  );
                })
              ) : (
                !loadingPackages && (
                  <Select.Option disabled value="">
                    هیچ پکیجی یافت نشد
                  </Select.Option>
                )
              )}
            </Select>
            {selectedPackageId === null && (
              <div style={{ padding: '8px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                <span style={{ color: '#1890ff' }}>در حال ایجاد پکیج جدید...</span>
              </div>
            )}
            {(!loadingPackages && packages.length === 0) && (
              <div style={{ marginTop: 8 }}>
                <Button
                  type="default"
                  onClick={async () => {
                    console.log('🔄 Manual reload triggered');
                    await loadAllPackages();
                  }}
                  icon={<ReloadOutlined />}
                  loading={loadingPackages}
                >
                  تلاش مجدد برای بارگذاری پکیج‌ها
                </Button>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                  اگر پکیج‌ها بارگذاری نمی‌شوند، ممکن است نیاز به ورود مجدد داشته باشید.
                </div>
              </div>
            )}
          </Space>
        </Form.Item>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            item_quantity: 0,
            total_price: 0,
          }}
        >
          <Form.Item
            name="item_quantity"
            label="تعداد آیتم (item_quantity)"
            rules={[
              { required: true, message: 'لطفا تعداد آیتم را وارد کنید' },
              {
                type: 'number',
                min: 0,
                message: 'تعداد آیتم باید عدد صحیح و غیر منفی باشد',
              },
              {
                validator: (_, value) => {
                  if (value !== undefined && value !== null) {
                    if (!Number.isInteger(Number(value))) {
                      return Promise.reject(new Error('تعداد آیتم باید عدد صحیح باشد'));
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="مثال: 10"
              min={0}
              step={1}
              precision={0}
            />
          </Form.Item>

          <Form.Item
            name="total_price"
            label="قیمت کل (total_price)"
            rules={[
              { required: true, message: 'لطفا قیمت کل را وارد کنید' },
              {
                type: 'number',
                min: 0,
                message: 'قیمت باید عدد مثبت باشد',
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="مثال: 500000"
              min={0}
              step={1000}
              formatter={(value) => {
                if (!value) return '';
                // Format with Persian thousands separator
                return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }}
              addonAfter="تومان"
            />
          </Form.Item>

          <Form.Item
            name="package_title_fa"
            label="عنوان پکیج (package_title_fa)"
            rules={[
              { required: true, message: 'لطفا عنوان پکیج را وارد کنید' },
            ]}
          >
            <Input placeholder="مثال: پکیج ویژه" />
          </Form.Item>

          <Form.Item
            name="quantity_display_fa"
            label="نمایش تعداد (quantity_display_fa)"
          >
            <Input placeholder="مثال: 10 عدد قلیون" />
          </Form.Item>

          <Form.Item
            name="price_per_item_fa"
            label="قیمت هر آیتم (price_per_item_fa)"
          >
            <Input placeholder="مثال: هر قلیان 50000 تومان" />
          </Form.Item>

          <Form.Item
            name="feature_usage_fa"
            label="ویژگی استفاده (feature_usage_fa)"
          >
            <Input.TextArea
              rows={3}
              placeholder="مثال: قابل استفاده در تمام رستوران‌های شریک"
            />
          </Form.Item>

          <Form.Item
            name="feature_validity_fa"
            label="ویژگی اعتبار (feature_validity_fa)"
          >
            <Input.TextArea
              rows={3}
              placeholder="مثال: اعتبار 6 ماهه"
            />
          </Form.Item>

          <Form.Item
            name="feature_support_fa"
            label="ویژگی پشتیبانی (feature_support_fa)"
          >
            <Input.TextArea
              rows={3}
              placeholder="مثال: پشتیبانی 24/7"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                disabled={loading}
              >
                ذخیره و به‌روزرسانی
              </Button>
              {selectedPackageId && selectedPackageId !== 'new' && (
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading}
                  size="large"
                  disabled={loading}
                  onClick={handleDelete}
                >
                  حذف پکیج
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PackageManagement;
