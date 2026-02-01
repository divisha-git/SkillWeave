import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProblemStatements = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [problemStatements, setProblemStatements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchProblemStatements();
  }, []);

  const fetchProblemStatements = async () => {
    try {
      const res = await api.get('/student/problem-statements');
      setProblemStatements(res.data);
    } catch (error) {
      toast.error('Failed to load problem statements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/student/problem-statements', formData);
      if (res.data.warning) {
        toast.error(res.data.warning);
      } else {
        toast.success('Problem statement posted successfully');
      }
      setShowForm(false);
      setFormData({ title: '', description: '' });
      fetchProblemStatements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post problem statement');
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
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {showForm ? 'Cancel' : 'Post Problem Statement'}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Problem Statements</h2>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Post New Problem Statement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Post
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {problemStatements.map((ps) => (
            <div key={ps._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{ps.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(ps.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{ps.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span>Team: {ps.team?.name}</span>
                <span className="ml-4">Posted by: {ps.postedBy?.name}</span>
              </div>
              {ps.similarPS && ps.similarPS.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Similar problem statements exist. Please modify.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProblemStatements;
