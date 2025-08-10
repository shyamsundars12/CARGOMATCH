import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// LSP pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Containers from './pages/Containers';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Shipments from './pages/Shipments';
import ShipmentDetail from './pages/ShipmentDetail';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminContainers from './pages/admin/Containers';
import AdminContainerDetail from './pages/admin/ContainerDetail';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminBookings from './pages/admin/Bookings';
import AdminBookingDetail from './pages/admin/BookingDetail';
import AdminContainerTypes from './pages/admin/ContainerTypes';
import AdminLayout from './components/admin/AdminLayout';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

function App() {
  const lspToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');

  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect based on token */}
        <Route
          index
          element={
            adminToken
            ? <Navigate to="/admin/dashboard" replace />
            : lspToken
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
          }
        />

        {/* LSP routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="containers" element={<Containers />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/:id" element={<ShipmentDetail />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="containers" element={<AdminContainers />} />
          <Route path="containers/:id" element={<AdminContainerDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="bookings/:id" element={<AdminBookingDetail />} />
          <Route path="container-types" element={<AdminContainerTypes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
