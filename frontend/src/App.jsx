import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminAttendance from './pages/admin/Attendance';
import AdminAlumni from './pages/admin/Alumni';
import AdminTeamSettings from './pages/admin/TeamSettings';

// Student pages
import StudentProfile from './pages/student/Profile';
import StudentAlumni from './pages/student/Alumni';
import StudentAttendance from './pages/student/Attendance';
import StudentResources from './pages/student/Resources';

// Alumni pages
import AlumniProfile from './pages/alumni/Profile';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FCF6]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a365d] border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !user ? (
            <Login />
          ) : (
            <Navigate 
              to={
                user.role === 'admin' 
                  ? '/admin/dashboard' 
                  : user.role === 'student' 
                    ? '/student/profile' 
                    : '/alumni/profile'
              } 
              replace 
            />
          )
        } 
      />
      <Route 
        path="/signup" 
        element={
          !user ? (
            <Signup />
          ) : (
            <Navigate 
              to={
                user.role === 'admin' 
                  ? '/admin/dashboard' 
                  : user.role === 'student' 
                    ? '/student/profile' 
                    : '/alumni/profile'
              } 
              replace 
            />
          )
        } 
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/alumni"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAlumni />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/team-settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTeamSettings />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/resources"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/alumni"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAlumni />
          </ProtectedRoute>
        }
      />

      {/* Alumni Routes */}
      <Route
        path="/alumni/profile"
        element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <AlumniProfile />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Only show loading screen on first login (check sessionStorage)
    const isFirstLogin = sessionStorage.getItem('firstLogin');
    if (isFirstLogin === 'true') {
      setShowLoading(true);
      // Clear the flag after showing
      sessionStorage.removeItem('firstLogin');
    }
  }, []);

  return (
    <AuthProvider>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
