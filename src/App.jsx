import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminAttendance from './pages/admin/Attendance';
import AdminAlumni from './pages/admin/Alumni';

// Student pages
import StudentProfile from './pages/student/Profile';
import StudentTeams from './pages/student/Teams';
import StudentCompanies from './pages/student/Companies';
import StudentAlumni from './pages/student/Alumni';
import ProblemStatements from './pages/student/ProblemStatements';

// Alumni pages
import AlumniProfile from './pages/alumni/Profile';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        path="/student/teams"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentTeams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/problem-statements"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ProblemStatements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/companies"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentCompanies />
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
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
