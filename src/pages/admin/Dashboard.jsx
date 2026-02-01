import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const TeamSizeConfig = ({ currentSize, onUpdate }) => {
  const [teamSize, setTeamSize] = useState(currentSize);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (teamSize < 2) {
      toast.error('Team size must be at least 2');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/settings/team-size', { teamSize });
      toast.success('Team size updated successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update team size');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Team Size (including leader)
        </label>
        <input
          type="number"
          min="2"
          max="20"
          value={teamSize}
          onChange={(e) => setTeamSize(parseInt(e.target.value) || 2)}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Current setting: {currentSize} members per team (including leader)
        </p>
      </div>
      <button
        type="submit"
        disabled={loading || teamSize === currentSize}
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-700">BYTS Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <Link
                to="/admin/students"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Manage Students
              </Link>
              <Link
                to="/admin/attendance"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Mark Attendance
              </Link>
              <Link
                to="/admin/alumni"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Upload Alumni
              </Link>
              <Link
                to="/admin/team-settings"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Team Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalStudents || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Alumni</h3>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalAlumni || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Teams</h3>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalTeams || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Problem Statements</h3>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalProblemStatements || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Companies</h3>
            <p className="text-3xl font-bold text-primary-600">{stats?.totalCompanies || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Overall Attendance</h3>
            <p className="text-3xl font-bold text-primary-600">
              {stats?.attendance?.overallPercentage || 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.attendance?.presentRecords || 0} / {stats?.attendance?.totalRecords || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Team Size Configuration</h3>
          <TeamSizeConfig currentSize={stats?.teamSize || 5} onUpdate={fetchDashboard} />
        </div>

        {stats?.departmentStats && stats.departmentStats.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Department Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.departmentStats.map((dept, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{dept.department}</h4>
                  <p className="text-2xl font-bold text-primary-600 mt-2">{dept.students} students</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
