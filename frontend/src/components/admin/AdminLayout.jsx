import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const navItemClasses = ({ isActive }) =>
  `flex items-center px-4 py-2 rounded-lg transition-colors ${
    isActive ? 'bg-white text-[#1a365d] font-semibold' : 'text-white/90 hover:bg-white/10'
  }`;

const AdminSidebar = ({ open, onClose }) => {
  return (
    <aside
      className={`fixed z-30 inset-y-0 left-0 w-64 bg-[#1a365d] text-white p-4 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:min-h-screen ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Admin Sidebar"
    >
      <div className="flex items-center gap-3 px-2 mb-6">
        <img src="/kec-2.png" alt="KEC Logo" className="h-10 w-auto object-contain" />
        <div>
          <h1 className="text-lg font-bold">BYTSKEC Admin</h1>
          <p className="text-xs text-white/70">Control Panel</p>
        </div>
      </div>
      <nav className="space-y-2">
        <NavLink to="/admin/dashboard" className={navItemClasses}>
          <span className="ml-1">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/attendance" className={navItemClasses}>
          <span className="ml-1">Attendance</span>
        </NavLink>
        <NavLink to="/admin/hackathons" className={navItemClasses}>
          <span className="ml-1">Hackathons</span>
        </NavLink>
        <NavLink to="/admin/reports" className={navItemClasses}>
          <span className="ml-1">Reports</span>
        </NavLink>
        <div className="pt-2 mt-2 border-t border-white/10" />
        <NavLink to="/admin/students" className={navItemClasses}>
          <span className="ml-1">User Management - Students</span>
        </NavLink>
        <NavLink to="/admin/alumni" className={navItemClasses}>
          <span className="ml-1">User Management - Alumni</span>
        </NavLink>
      </nav>
      {/* Close area for mobile */}
      <button
        onClick={onClose}
        className="md:hidden mt-6 w-full px-3 py-2 bg-white/10 rounded text-white hover:bg-white/20"
      >
        Close
      </button>
    </aside>
  );
};

const AdminTopbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-md border border-gray-200 hover:bg-gray-50"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
          <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
          <span className="block w-5 h-0.5 bg-gray-800"></span>
        </button>
        <div className="text-gray-800 font-semibold">Admin Portal</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <Link
          to="/login"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Logout
        </Link>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-0">
        <AdminTopbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
