import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from './store/authStore';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import OrderStatus from './pages/OrderStatus';
import OrderHistory from './pages/OrderHistory';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Contact from './pages/Contact';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServiceManagement from './pages/admin/AdminServiceManagement';
import AdminOrderManagement from './pages/admin/AdminOrderManagement';
import AdminReport from './pages/admin/AdminReport';
import AdminPromoManagement from './pages/admin/AdminPromoManagement';
import AdminLandingConfig from './pages/admin/AdminLandingConfig';

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
            </Route>
          </Route>

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
