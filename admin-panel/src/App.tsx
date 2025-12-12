import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import faIR from 'antd/locale/fa_IR';
import { useEffect, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import { useAuthStore } from './store/authStore';
import { useOperatorAuthStore } from './store/operatorAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import OperatorLayout from './components/OperatorLayout';
import OperatorProtectedRoute from './components/OperatorProtectedRoute';

// Login pages - load immediately (no lazy loading)
import Login from './pages/Login';
import OperatorLogin from './pages/OperatorLogin';

// Lazy load all other pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Restaurants = lazy(() => import('./pages/Restaurants'));
const AddRestaurant = lazy(() => import('./pages/AddRestaurant'));
const EditRestaurant = lazy(() => import('./pages/EditRestaurant'));
const ConsumedPackages = lazy(() => import('./pages/ConsumedPackages'));
const SoldPackages = lazy(() => import('./pages/SoldPackages'));
const Users = lazy(() => import('./pages/Users'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
const PackageManagement = lazy(() => import('./pages/PackageManagement'));
const ActivatePackage = lazy(() => import('./pages/ActivatePackage'));
const Gifts = lazy(() => import('./pages/Gifts'));
const Ratings = lazy(() => import('./pages/Ratings'));
const Moderation = lazy(() => import('./pages/Moderation'));
const Analytics = lazy(() => import('./pages/Analytics'));
const RestaurantPayments = lazy(() => import('./pages/RestaurantPayments'));
const SettlementHistory = lazy(() => import('./pages/SettlementHistory'));
const SharedProfiles = lazy(() => import('./pages/SharedProfiles'));
const OperatorDashboard = lazy(() => import('./pages/OperatorDashboard'));
const OperatorRedeem = lazy(() => import('./pages/OperatorRedeem'));
const OperatorHistory = lazy(() => import('./pages/OperatorHistory'));
const OperatorCustomers = lazy(() => import('./pages/OperatorCustomers'));
const OperatorRestaurant = lazy(() => import('./pages/OperatorRestaurant'));
const OperatorAccounting = lazy(() => import('./pages/OperatorAccounting'));

// Loading component for lazy routes
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#666'
  }}>
    در حال بارگذاری...
  </div>
);

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
            <Route index element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="restaurants" element={
              <Suspense fallback={<PageLoader />}>
                <Restaurants />
              </Suspense>
            } />
            <Route path="restaurants/new" element={
              <Suspense fallback={<PageLoader />}>
                <AddRestaurant />
              </Suspense>
            } />
            <Route path="restaurants/:id/edit" element={
              <Suspense fallback={<PageLoader />}>
                <EditRestaurant />
              </Suspense>
            } />
            <Route path="consumed" element={
              <Suspense fallback={<PageLoader />}>
                <ConsumedPackages />
              </Suspense>
            } />
            <Route path="sold-packages" element={
              <Suspense fallback={<PageLoader />}>
                <SoldPackages />
              </Suspense>
            } />
            <Route path="users" element={
              <Suspense fallback={<PageLoader />}>
                <Users />
              </Suspense>
            } />
            <Route path="users/:id" element={
              <Suspense fallback={<PageLoader />}>
                <UserDetails />
              </Suspense>
            } />
            <Route path="package-management" element={
              <Suspense fallback={<PageLoader />}>
                <PackageManagement />
              </Suspense>
            } />
            <Route path="activate-package" element={
              <Suspense fallback={<PageLoader />}>
                <ActivatePackage />
              </Suspense>
            } />
            <Route path="gifts" element={
              <Suspense fallback={<PageLoader />}>
                <Gifts />
              </Suspense>
            } />
            <Route path="ratings" element={
              <Suspense fallback={<PageLoader />}>
                <Ratings />
              </Suspense>
            } />
            <Route path="moderation" element={
              <Suspense fallback={<PageLoader />}>
                <Moderation />
              </Suspense>
            } />
            <Route path="analytics" element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            } />
            <Route path="restaurant-payments" element={
              <Suspense fallback={<PageLoader />}>
                <RestaurantPayments />
              </Suspense>
            } />
            <Route path="settlement-history" element={
              <Suspense fallback={<PageLoader />}>
                <SettlementHistory />
              </Suspense>
            } />
            <Route path="shared-profiles" element={
              <Suspense fallback={<PageLoader />}>
                <SharedProfiles />
              </Suspense>
            } />
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
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <OperatorDashboard />
            </Suspense>
          } />
          <Route path="redeem" element={
            <Suspense fallback={<PageLoader />}>
              <OperatorRedeem />
            </Suspense>
          } />
          <Route path="history" element={
            <Suspense fallback={<PageLoader />}>
              <OperatorHistory />
            </Suspense>
          } />
          <Route path="customers" element={
            <Suspense fallback={<PageLoader />}>
              <OperatorCustomers />
            </Suspense>
          } />
          <Route path="restaurant" element={
            <Suspense fallback={<PageLoader />}>
              <OperatorRestaurant />
            </Suspense>
          } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
