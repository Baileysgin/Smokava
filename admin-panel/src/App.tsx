import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import faIR from 'antd/locale/fa_IR';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import AddRestaurant from './pages/AddRestaurant';
import EditRestaurant from './pages/EditRestaurant';
import ConsumedPackages from './pages/ConsumedPackages';
import SoldPackages from './pages/SoldPackages';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import PackageManagement from './pages/PackageManagement';
import { useAuthStore } from './store/authStore';
import { useOperatorAuthStore } from './store/operatorAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import OperatorLogin from './pages/OperatorLogin';
import OperatorLayout from './components/OperatorLayout';
import OperatorProtectedRoute from './components/OperatorProtectedRoute';
import OperatorDashboard from './pages/OperatorDashboard';
import OperatorRedeem from './pages/OperatorRedeem';
import OperatorHistory from './pages/OperatorHistory';
import OperatorCustomers from './pages/OperatorCustomers';
import OperatorRestaurant from './pages/OperatorRestaurant';

function App() {
  const { checkAuth } = useAuthStore();
  const { checkAuth: checkOperatorAuth } = useOperatorAuthStore();

  useEffect(() => {
    checkAuth();
    checkOperatorAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConfigProvider
      locale={faIR}
      direction="rtl"
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="restaurants" element={<Restaurants />} />
            <Route path="restaurants/new" element={<AddRestaurant />} />
            <Route path="restaurants/:id/edit" element={<EditRestaurant />} />
            <Route path="consumed" element={<ConsumedPackages />} />
            <Route path="sold-packages" element={<SoldPackages />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="package-management" element={<PackageManagement />} />
          </Route>
          <Route path="/operator/login" element={<OperatorLogin />} />
          <Route
            path="/operator"
            element={
              <OperatorProtectedRoute>
                <OperatorLayout />
              </OperatorProtectedRoute>
            }
          >
          <Route index element={<OperatorDashboard />} />
          <Route path="redeem" element={<OperatorRedeem />} />
          <Route path="history" element={<OperatorHistory />} />
          <Route path="customers" element={<OperatorCustomers />} />
          <Route path="restaurant" element={<OperatorRestaurant />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
