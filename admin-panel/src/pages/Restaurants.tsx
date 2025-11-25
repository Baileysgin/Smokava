import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  message,
  Space,
  Popconfirm,
  Card,
  Tag,
  Input,
  Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import type { Restaurant } from '../types/admin';

const Restaurants = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = restaurants.filter(
        (r) =>
          r.nameFa.toLowerCase().includes(searchText.toLowerCase()) ||
          r.name.toLowerCase().includes(searchText.toLowerCase()) ||
          r.addressFa.toLowerCase().includes(searchText.toLowerCase()) ||
          (r.city && r.city.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants(restaurants);
    }
  }, [searchText, restaurants]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      console.log('Loading restaurants...');
      const data = await adminService.getRestaurants();
      console.log('Restaurants loaded:', data);
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (error: any) {
      console.error('Error loading restaurants:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'خطا در بارگذاری رستوران‌ها';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteRestaurant(id);
      message.success('رستوران با موفقیت حذف شد');
      loadRestaurants();
    } catch (error: any) {
      message.error('خطا در حذف رستوران');
    }
  };

  const columns = [
    {
      title: 'تصویر',
      key: 'image',
      width: 100,
      render: (_: any, record: Restaurant) => (
        <Image
          src={record.image || record.imageUrl || ''}
          alt={record.nameFa}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
        />
      ),
    },
    {
      title: 'نام',
      dataIndex: 'nameFa',
      key: 'nameFa',
    },
    {
      title: 'شهر',
      dataIndex: 'city',
      key: 'city',
      render: (city: string) => city || '-',
    },
    {
      title: 'آدرس',
      dataIndex: 'addressFa',
      key: 'addressFa',
      ellipsis: true,
    },
    {
      title: 'تلفن',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'وضعیت',
      key: 'status',
      render: (_: any, record: Restaurant) => {
        const isActive = record.accepted || record.active || true;
        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'فعال' : 'غیرفعال'}
          </Tag>
        );
      },
    },
    {
      title: 'عملیات',
      key: 'action',
      width: 180,
      render: (_: any, record: Restaurant) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/restaurants/${record._id}/edit`)}
            size="small"
          >
            ویرایش
          </Button>
          <Popconfirm
            title="آیا مطمئن هستید که می‌خواهید این رستوران را حذف کنید؟"
            onConfirm={() => handleDelete(record._id)}
            okText="بله"
            cancelText="خیر"
            okType="danger"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>مدیریت رستوران‌ها</h1>
          <Space>
            <Input
              placeholder="جستجو..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/restaurants/new')}
            >
              افزودن رستوران جدید
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRestaurants}
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} رستوران`,
          }}
        />
      </Card>
    </div>
  );
};

export default Restaurants;
