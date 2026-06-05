import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from './store/authStore';

import Layout from './components/Layout';
import PageLoader from './components/PageLoader';

// Lazy loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const OrderStatus = lazy(() => import('./pages/OrderStatus'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Payment = lazy(() => import('./pages/Payment'));
const Contact = lazy(() => import('./pages/Contact'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminServiceManagement = lazy(() => import('./pages/admin/AdminServiceManagement'));
const AdminOrderManagement = lazy(() => import('./pages/admin/AdminOrderManagement'));
const AdminReport = lazy(() => import('./pages/admin/AdminReport'));
const AdminPromoManagement = lazy(() => import('./pages/admin/AdminPromoManagement'));
const AdminLandingConfig = lazy(() => import('./pages/admin/AdminLandingConfig'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Public Route wrapper (redirects to appropriate home if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  return children;
};

// Protected Route for Customers
const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
};

// Protected Route for Admins
const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/home" replace />;
  return <Outlet />;
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 1. PUBLIC ROUTES (No Auth Check) */}
            <Route path="/" element={<Landing />} />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* 2. PRIVATE ROUTES (Customer) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/order-history" element={<OrderHistory />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/:order_id" element={<Payment />} />
                <Route path="/contact" element={<Contact />} />
              </Route>
            </Route>

            {/* 3. ADMIN ROUTES */}
            <Route element={<AdminRoute />}>
              <Route element={<Layout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/services" element={<AdminServiceManagement />} />
                <Route path="/admin/orders" element={<AdminOrderManagement />} />
                <Route path="/admin/promos" element={<AdminPromoManagement />} />
                <Route path="/admin/report" element={<AdminReport />} />
                <Route path="/admin/landing" element={<AdminLandingConfig />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* Catch all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
