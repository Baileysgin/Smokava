import { useEffect, useState } from 'react';
import { Card, Table, Button, message, Input, Space, Popconfirm, Tag, Avatar } from 'antd';
import { SearchOutlined, DeleteOutlined, UserOutlined, LinkOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';

interface SharedProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  phoneNumber: string;
  createdAt: string;
  stats: {
    totalPosts: number;
    restaurantsVisited: number;
  };
  profileUrl: string;
}

const SharedProfiles = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<SharedProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadProfiles();
  }, [page]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSharedProfiles(page, pageSize, searchText || undefined);
      setProfiles(response.users || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error loading shared profiles:', error);
      message.error(error.response?.data?.message || 'خطا در بارگذاری پروفایل‌های به اشتراک گذاشته شده');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await adminService.deleteSharedProfile(userId);
      message.success('پروفایل با موفقیت غیرفعال شد');
      loadProfiles();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'خطا در حذف پروفایل');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const filteredProfiles = profiles.filter(profile => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      (profile.firstName || '').toLowerCase().includes(searchLower) ||
      (profile.lastName || '').toLowerCase().includes(searchLower) ||
      (profile.username || '').toLowerCase().includes(searchLower) ||
      profile.phoneNumber.includes(searchText)
    );
  });

  const columns = [
    {
      title: 'کاربر',
      key: 'user',
      render: (_: any, record: SharedProfile) => (
        <Space>
          <Avatar
            src={record.photoUrl}
            icon={<UserOutlined />}
            size="small"
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.firstName && record.lastName
                ? `${record.firstName} ${record.lastName}`
                : record.firstName || record.lastName || 'نامشخص'}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              @{record.username || `user_${record._id.slice(-6)}`}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'شماره تلفن',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'پست‌ها',
      dataIndex: ['stats', 'totalPosts'],
      key: 'totalPosts',
      render: (count: number) => formatNumber(count),
    },
    {
      title: 'رستوران‌ها',
      dataIndex: ['stats', 'restaurantsVisited'],
      key: 'restaurantsVisited',
      render: (count: number) => formatNumber(count),
    },
    {
      title: 'لینک پروفایل',
      key: 'profileUrl',
      render: (_: any, record: SharedProfile) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          onClick={() => window.open(record.profileUrl, '_blank')}
          size="small"
        >
          مشاهده
        </Button>
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_: any, record: SharedProfile) => (
        <Popconfirm
          title="غیرفعال کردن پروفایل عمومی"
          description="آیا مطمئن هستید که می‌خواهید این پروفایل را غیرفعال کنید؟"
          onConfirm={() => handleDelete(record._id)}
          okText="بله"
          cancelText="خیر"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            غیرفعال کردن
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>پروفایل‌های به اشتراک گذاشته شده</h1>

      {/* Search */}
      <Card style={{ marginBottom: 24 }}>
        <Input
          placeholder="جستجو بر اساس نام، نام کاربری یا شماره تلفن..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={loadProfiles}
          allowClear
        />
      </Card>

      {/* Profiles Table */}
      <Card>
        <Table
          dataSource={filteredProfiles}
          columns={columns}
          rowKey="_id"
          pagination={{
            current: page,
            pageSize,
            total: filteredProfiles.length > 0 ? total : 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => `مجموع ${formatNumber(total)} پروفایل`,
          }}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default SharedProfiles;
