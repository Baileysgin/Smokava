import { useEffect, useState } from 'react';
import { Table, Card, Tag, message, Input, Space, Button, Progress } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import type { SoldPackage } from '../types/admin';

const SoldPackages = () => {
  const [data, setData] = useState<SoldPackage[]>([]);
  const [filteredData, setFilteredData] = useState<SoldPackage[]>([]);
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
      const result = await adminService.getSoldPackages(
        pagination.current,
        pagination.pageSize
      );
      setData(result.packages);
      setFilteredData(result.packages);
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

  const getUsagePercent = (consumed: number, total: number) => {
    return Math.round((consumed / total) * 100);
  };

  const columns = [
    {
      title: 'کاربر',
      key: 'user',
      width: 150,
      render: (_: any, record: SoldPackage) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user?.name || 'بدون نام'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.user?.phoneNumber}</div>
        </div>
      ),
    },
    {
      title: 'نوع پکیج',
      key: 'package',
      width: 150,
      render: (_: any, record: SoldPackage) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.package?.nameFa}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {record.package?.count} قلیون - {record.package?.price?.toLocaleString()} تومان
          </div>
        </div>
      ),
    },
    {
      title: 'وضعیت',
      key: 'status',
      width: 200,
      render: (_: any, record: SoldPackage) => {
        const percent = getUsagePercent(record.consumedCount, record.totalCount);
        return (
          <div>
            <Progress
              percent={percent}
              status={percent === 100 ? 'success' : 'active'}
              format={() => `${record.consumedCount}/${record.totalCount}`}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
              باقیمانده: {record.remainingCount}
            </div>
          </div>
        );
      },
    },
    {
      title: 'مصرف شده',
      key: 'consumed',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: SoldPackage) => (
        <Tag color={record.consumedCount > 0 ? 'orange' : 'default'}>
          {record.consumedCount}
        </Tag>
      ),
    },
    {
      title: 'باقیمانده',
      key: 'remaining',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: SoldPackage) => (
        <Tag color={record.remainingCount > 0 ? 'green' : 'red'}>
          {record.remainingCount}
        </Tag>
      ),
    },
    {
      title: 'تاریخ خرید',
      dataIndex: 'purchasedAt',
      key: 'purchasedAt',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>پکیج‌های فروخته شده</h1>
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
          rowKey="_id"
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} پکیج`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize: pageSize || 20 });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default SoldPackages;
