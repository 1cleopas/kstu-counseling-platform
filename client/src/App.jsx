import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/AppLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import BookAppointment from './pages/student/BookAppointment';
import StudentAppointments from './pages/student/StudentAppointments';
import CounselorDashboard from './pages/counselor/CounselorDashboard';
import ClientList from './pages/counselor/ClientList';
import ClientDetail from './pages/counselor/ClientDetail';
import CounselorAppointments from './pages/counselor/CounselorAppointments';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import ChatPage from './pages/ChatPage';
import VideoSession from './pages/VideoSession';
import NotificationsPage from './pages/NotificationsPage';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'counselor') return <CounselorDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<RoleHome />} />
        <Route path="appointments" element={<StudentAppointments />} />
        <Route path="book" element={<Protected roles={['student']}><BookAppointment /></Protected>} />
        <Route path="clients" element={<Protected roles={['counselor', 'admin']}><ClientList /></Protected>} />
        <Route path="clients/:id" element={<Protected roles={['counselor', 'admin']}><ClientDetail /></Protected>} />
        <Route path="counselor-appointments" element={<Protected roles={['counselor', 'admin']}><CounselorAppointments /></Protected>} />
        <Route path="admin/users" element={<Protected roles={['admin']}><AdminUsers /></Protected>} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="video/:appointmentId" element={<VideoSession />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
