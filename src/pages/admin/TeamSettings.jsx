import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TeamSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [teamSize, setTeamSize] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchTeamSize();
  }, []);

  const fetchTeamSize = async () => {
    try {
      const res = await api.get('/admin/settings/team-size');
      setTeamSize(res.data.teamSize);
    } catch (error) {
      toast.error('Failed to load team size setting');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/settings/team-size', { teamSize });
      toast.success('Team size updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update team size');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/admin/dashboard" className="text-primary-700 font-bold">
              ← Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Size Settings</h2>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-6">
            Set the maximum number of members allowed in each team (including the team leader).
            This limit will apply to all teams in the system.
          </p>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Team Size
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Minimum: 2 members, Maximum: 20 members (including team leader)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changing the team size will update all existing teams' maximum size limit.
                Team leaders will only be able to invite members up to this limit.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Team Size'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamSettings;
