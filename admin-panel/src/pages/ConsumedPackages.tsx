import { useEffect, useState } from 'react';
import { Table, Card, Tag, message, Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import type { ConsumedItem } from '../types/admin';

const ConsumedPackages = () => {
  const [data, setData] = useState<ConsumedItem[]>([]);
  const [filteredData, setFilteredData] = useState<ConsumedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, [pagination.current]);

  useEffect(() => {
    if (searchText) {
      const filtered = data.filter(
        (item) =>
          item.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.user?.phoneNumber?.includes(searchText) ||
          item.restaurant?.nameFa?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.package?.nameFa?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchText, data]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await adminService.getConsumedPackages(
        pagination.current,
        pagination.pageSize
      );
      setData(result.items);
      setFilteredData(result.items);
      setPagination({
        ...pagination,
        total: result.total,
      });
    } catch (error: any) {
      message.error('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'کاربر',
      key: 'user',
      width: 150,
      render: (_: any, record: ConsumedItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user?.name || 'بدون نام'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.user?.phoneNumber}</div>
        </div>
      ),
    },
    {
      title: 'پکیج',
      key: 'package',
      width: 150,
      render: (_: any, record: ConsumedItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.package?.nameFa}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {record.package?.count} قلیون
          </div>
        </div>
      ),
    },
    {
      title: 'رستوران',
      key: 'restaurant',
      width: 200,
      ellipsis: true,
      render: (_: any, record: ConsumedItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.restaurant?.nameFa}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.restaurant?.addressFa}</div>
        </div>
      ),
    },
    {
      title: 'تعداد',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'طعم',
      dataIndex: 'flavor',
      key: 'flavor',
      width: 120,
      render: (flavor: string) => flavor || '-',
    },
    {
      title: 'تاریخ مصرف',
      dataIndex: 'consumedAt',
      key: 'consumedAt',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>لیست قلیون‌های مصرف شده</h1>
          <Space>
            <Input
              placeholder="جستجو..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
            >
              رفرش
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} مورد`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 20 });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ConsumedPackages;
