import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, message, Space, Input, DatePicker } from 'antd';
import { DownloadOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { adminService } from '../services/adminService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Settlement {
  _id: string;
  settlementNumber: string;
  settlementDate: string;
  restaurants: Array<{
    restaurant: any;
    restaurantName: string;
    totalAmount: number;
    totalShishaProvided: number;
    paymentCount: number;
  }>;
  totalAmount: number;
  totalShishaProvided: number;
  totalPaymentsSettled: number;
  document: {
    generatedAt: string;
    generatedBy: {
      username: string;
    };
    notes: string;
  };
  status: string;
  createdAt: string;
}

const SettlementHistory = () => {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadSettlements();
  }, [page]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSettlements(page, pageSize);
      setSettlements(response.settlements || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error loading settlements:', error);
      message.error(error.response?.data?.message || 'خطا در بارگذاری تسویه‌ها');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const exportToCSV = () => {
    if (settlements.length === 0) {
      message.warning('هیچ داده‌ای برای خروجی وجود ندارد');
      return;
    }

    // CSV Headers
    const headers = [
      'شماره تسویه',
      'تاریخ تسویه',
      'تعداد رستوران‌ها',
      'کل مبلغ (ریال)',
      'کل قلیون ارائه شده',
      'تعداد پرداخت‌های تسویه شده',
      'وضعیت',
      'توسط',
      'یادداشت',
      'تاریخ ایجاد',
    ];

    // CSV Rows
    const rows = settlements.map(settlement => [
      settlement.settlementNumber,
      dayjs(settlement.settlementDate).format('YYYY/MM/DD HH:mm'),
      settlement.restaurants.length,
      formatCurrency(settlement.totalAmount),
      formatNumber(settlement.totalShishaProvided),
      settlement.totalPaymentsSettled,
      settlement.status === 'completed' ? 'تکمیل شده' : settlement.status,
      settlement.document?.generatedBy?.username || '-',
      settlement.document?.notes || '-',
      dayjs(settlement.createdAt).format('YYYY/MM/DD HH:mm'),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for UTF-8 (Excel compatibility)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `settlements-${dayjs().format('YYYYMMDD-HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('فایل CSV با موفقیت دانلود شد');
  };

  const exportDetailedCSV = async (settlementId: string) => {
    try {
      const settlement = await adminService.getSettlementById(settlementId);

      // Detailed CSV with restaurant breakdown
      const headers = [
        'شماره تسویه',
        'رستوران',
        'مبلغ (ریال)',
        'قلیون ارائه شده',
        'تعداد پرداخت‌ها',
      ];

      const rows = settlement.restaurants.map((r: any) => [
        settlement.settlementNumber,
        r.restaurantName,
        formatCurrency(r.totalAmount),
        formatNumber(r.totalShishaProvided),
        r.paymentCount,
      ]);

      const csvContent = [
        ['جزئیات تسویه:', settlement.settlementNumber].join(','),
        ['تاریخ:', dayjs(settlement.settlementDate).format('YYYY/MM/DD HH:mm')].join(','),
        ['کل مبلغ:', formatCurrency(settlement.totalAmount)].join(','),
        ['کل قلیون:', formatNumber(settlement.totalShishaProvided)].join(','),
        [''],
        headers.join(','),
        ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `settlement-${settlement.settlementNumber}-${dayjs().format('YYYYMMDD-HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('جزئیات تسویه با موفقیت دانلود شد');
    } catch (error: any) {
      message.error('خطا در دانلود جزئیات تسویه');
    }
  };

  const filteredSettlements = settlements.filter(settlement => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      settlement.settlementNumber.toLowerCase().includes(searchLower) ||
      settlement.restaurants.some(r => r.restaurantName.toLowerCase().includes(searchLower)) ||
      (settlement.document?.notes || '').toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'شماره تسویه',
      dataIndex: 'settlementNumber',
      key: 'settlementNumber',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'تاریخ تسویه',
      dataIndex: 'settlementDate',
      key: 'settlementDate',
      render: (date: string) => dayjs(date).format('YYYY/MM/DD HH:mm'),
      sorter: (a: Settlement, b: Settlement) =>
        dayjs(a.settlementDate).unix() - dayjs(b.settlementDate).unix(),
    },
    {
      title: 'تعداد رستوران‌ها',
      key: 'restaurantCount',
      render: (_: any, record: Settlement) => record.restaurants.length,
    },
    {
      title: 'کل مبلغ (ریال)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatCurrency(amount),
      sorter: (a: Settlement, b: Settlement) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'کل قلیون',
      dataIndex: 'totalShishaProvided',
      key: 'totalShishaProvided',
      render: (count: number) => formatNumber(count),
    },
    {
      title: 'تعداد پرداخت‌ها',
      dataIndex: 'totalPaymentsSettled',
      key: 'totalPaymentsSettled',
      render: (count: number) => formatNumber(count),
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'success' : status === 'cancelled' ? 'error' : 'default'}>
          {status === 'completed' ? 'تکمیل شده' : status === 'cancelled' ? 'لغو شده' : 'در انتظار'}
        </Tag>
      ),
    },
    {
      title: 'توسط',
      key: 'generatedBy',
      render: (_: any, record: Settlement) =>
        record.document?.generatedBy?.username || '-',
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_: any, record: Settlement) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => exportDetailedCSV(record._id)}
            size="small"
          >
            جزئیات CSV
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>تاریخچه تسویه‌ها</h1>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
          disabled={settlements.length === 0}
        >
          خروجی CSV
        </Button>
      </div>

      {/* Search */}
      <Card style={{ marginBottom: 24 }}>
        <Input
          placeholder="جستجو بر اساس شماره تسویه، نام رستوران یا یادداشت..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </Card>

      {/* Settlements Table */}
      <Card>
        <Table
          dataSource={filteredSettlements}
          columns={columns}
          rowKey="_id"
          pagination={{
            current: page,
            pageSize,
            total: filteredSettlements.length > 0 ? total : 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => `مجموع ${formatNumber(total)} تسویه`,
          }}
          loading={loading}
          expandable={{
            expandedRowRender: (record: Settlement) => (
              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <h4>جزئیات رستوران‌ها:</h4>
                <Table
                  dataSource={record.restaurants}
                  columns={[
                    { title: 'رستوران', dataIndex: 'restaurantName', key: 'restaurantName' },
                    {
                      title: 'مبلغ (ریال)',
                      dataIndex: 'totalAmount',
                      key: 'totalAmount',
                      render: (amount: number) => formatCurrency(amount),
                    },
                    {
                      title: 'قلیون ارائه شده',
                      dataIndex: 'totalShishaProvided',
                      key: 'totalShishaProvided',
                      render: (count: number) => formatNumber(count),
                    },
                    {
                      title: 'تعداد پرداخت‌ها',
                      dataIndex: 'paymentCount',
                      key: 'paymentCount',
                      render: (count: number) => formatNumber(count),
                    },
                  ]}
                  rowKey={(record, index) => `restaurant-${index}`}
                  pagination={false}
                  size="small"
                />
                {record.document?.notes && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>یادداشت:</strong> {record.document.notes}
                  </div>
                )}
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default SettlementHistory;
