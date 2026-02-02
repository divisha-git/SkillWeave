import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const TeamSettings = () => {
  const [teamSize, setTeamSize] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings ⚙️">
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#1a365d] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Size Configuration</h3>
              <p className="text-sm text-gray-500">Configure team member limits</p>
            </div>
          </div>

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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                Minimum: 2 members, Maximum: 20 members (including team leader)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Changing the team size will update all existing teams' maximum size limit.
                  Team leaders will only be able to invite members up to this limit.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d4a7c] disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Team Size'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamSettings;
