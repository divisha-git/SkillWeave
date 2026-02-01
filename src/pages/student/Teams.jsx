import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Teams = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchTeams();
    fetchStudents();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/student/teams');
      setTeams(res.data);
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/student/students');
      setStudents(res.data);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/student/teams', { name: teamName });
      toast.success('Team created successfully');
      setShowCreateForm(false);
      setTeamName('');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleInvite = async (teamId, studentId) => {
    try {
      await api.post(`/student/teams/${teamId}/invite`, { studentId });
      toast.success('Invite sent successfully');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invite');
    }
  };

  const handleInviteAction = async (teamId, inviteId, action) => {
    try {
      await api.post(`/student/teams/${teamId}/invite/${inviteId}`, { action });
      toast.success(`Invite ${action}ed successfully`);
      fetchTeams();
    } catch (error) {
      toast.error('Failed to process invite');
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
            <Link to="/student/profile" className="text-primary-700 font-bold">
              ← Back to Profile
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {showCreateForm ? 'Cancel' : 'Create Team'}
              </button>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Management</h2>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="flex space-x-4">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                placeholder="Team name"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create
              </button>
            </form>
          </div>
        )}

        {teams.length === 0 && !showCreateForm && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">No teams yet. Create your first team to get started!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create Team
            </button>
          </div>
        )}

        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{team.name}</h3>
                  <p className="text-sm text-gray-500">Leader: {team.leader?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  team.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {team.status}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">
                  Members ({team.members?.length || 0} / {team.maxSize || 5}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {team.members?.map((member) => (
                    <span key={member._id} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                      {member.name}
                    </span>
                  ))}
                </div>
                {team.members && team.members.length >= (team.maxSize || 5) - 1 && (
                  <p className="text-xs text-red-600 mt-2">Team is full</p>
                )}
              </div>

              {(team.leader?._id === user?._id || team.leader?._id === user?.id) && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">
                    Invite Students: 
                    <span className="text-sm text-gray-500 ml-2">
                      ({team.members?.length || 0} / {team.maxSize || 5} members)
                    </span>
                  </h4>
                  {team.members && team.members.length + 1 >= (team.maxSize || 5) ? (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Team is full. Maximum size: {team.maxSize || 5} members (including leader)
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {students
                        .filter(s => {
                          // Filter out students already in team
                          const isMember = team.members?.some(m => m._id === s._id);
                          // Filter out students already invited
                          const isInvited = team.pendingInvites?.some(
                            inv => inv.student?._id === s._id && inv.status === 'pending'
                          );
                          return !isMember && !isInvited;
                        })
                        .map((student) => (
                          <button
                            key={student._id}
                            onClick={() => handleInvite(team._id, student._id)}
                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200"
                          >
                            + {student.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {team.pendingInvites && team.pendingInvites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Pending Invites:</h4>
                  <div className="space-y-2">
                    {team.pendingInvites
                      .filter(inv => inv.status === 'pending')
                      .map((invite) => (
                        <div key={invite._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                          <span>{invite.student?.name}</span>
                          {(invite.student?._id === user?._id || invite.student?._id === user?.id) && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleInviteAction(team._id, invite._id, 'accept')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleInviteAction(team._id, invite._id, 'reject')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;
