import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      setProfile(res.data);
    } catch (error) {
      toast.error('Failed to load profile');
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
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-primary-700">BYTS Student Portal</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <Link
                to="/student/teams"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Teams
              </Link>
              <Link
                to="/student/companies"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Companies
              </Link>
              <Link
                to="/student/alumni"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Alumni
              </Link>
              <Link
                to="/student/problem-statements"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Problem Statements
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">{profile?.student?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{profile?.student?.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Student ID:</span>
                <p className="font-medium">{profile?.student?.studentId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Department:</span>
                <p className="font-medium">{profile?.student?.department}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Year:</span>
                <p className="font-medium">{profile?.student?.year}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Attendance</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Total Classes:</span>
                <p className="font-medium">{profile?.attendance?.total || 0}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Present:</span>
                <p className="font-medium text-green-600">{profile?.attendance?.present || 0}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Absent:</span>
                <p className="font-medium text-red-600">{profile?.attendance?.absent || 0}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Attendance Percentage:</span>
                <p className="font-medium text-2xl text-primary-600">
                  {profile?.attendance?.percentage || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">My Teams</h3>
            {profile?.teams && profile.teams.length > 0 ? (
              <div className="space-y-2">
                {profile.teams.map((team) => (
                  <div key={team._id} className="border rounded-lg p-3">
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-gray-500">Leader: {team.leader?.name}</p>
                    <p className="text-sm text-gray-500">
                      Members: {team.members?.map(m => m.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No teams yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Problem Statements</h3>
            {profile?.problemStatements && profile.problemStatements.length > 0 ? (
              <div className="space-y-2">
                {profile.problemStatements.map((ps) => (
                  <div key={ps._id} className="border rounded-lg p-3">
                    <p className="font-medium">{ps.title}</p>
                    <p className="text-sm text-gray-500">{ps.description.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No problem statements yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Companies Attended</h3>
            {profile?.companies && profile.companies.length > 0 ? (
              <div className="space-y-2">
                {profile.companies.map((company, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-500">Round: {company.round}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No companies attended yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Relevant Alumni</h3>
            {profile?.relevantAlumni && profile.relevantAlumni.length > 0 ? (
              <div className="space-y-2">
                {profile.relevantAlumni.map((alum) => (
                  <div key={alum._id} className="border rounded-lg p-3">
                    <p className="font-medium">{alum.name}</p>
                    <p className="text-sm text-gray-500">{alum.company} - {alum.roleAtCompany}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No relevant alumni found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
