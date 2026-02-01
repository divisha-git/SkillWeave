import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Companies = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    round: '',
    questions: '',
    experience: '',
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/student/companies');
      setCompanies(res.data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const questions = formData.questions.split('\n').filter(q => q.trim());
      await api.post('/student/companies/attend', {
        companyName: formData.companyName,
        round: formData.round,
        questions,
        experience: formData.experience,
      });
      toast.success('Company attendance and questions posted successfully');
      setShowForm(false);
      setFormData({ companyName: '', round: '', questions: '', experience: '' });
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to post company information');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchCompanies();
      return;
    }
    try {
      const res = await api.get(`/student/companies/search?query=${searchQuery}`);
      setCompanies(res.data);
    } catch (error) {
      toast.error('Search failed');
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
                {showForm ? 'Cancel' : 'Post Company Attendance'}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Companies</h2>

        <div className="mb-6 flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies..."
            className="flex-1 px-4 py-2 border rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Search
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Post Company Attendance</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                <input
                  type="text"
                  required
                  value={formData.round}
                  onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Technical Round, HR Round"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Questions (one per line)</label>
                <textarea
                  value={formData.questions}
                  onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter questions asked..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Summary</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Share your experience..."
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit
              </button>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {companies.map((company) => (
            <div key={company._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{company.name}</h3>
                  <p className="text-sm text-gray-500">Round: {company.round}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {company.attendedBy?.length || 0} students attended
                </span>
              </div>

              {company.questions && company.questions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Questions Asked:</h4>
                  <div className="space-y-2">
                    {company.questions.map((q, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm">{q.question}</p>
                        <p className="text-xs text-gray-500 mt-1">Posted by: {q.postedBy?.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {company.experiences && company.experiences.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Experiences:</h4>
                  <div className="space-y-2">
                    {company.experiences.map((exp, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded">
                        <p className="text-sm">{exp.summary}</p>
                        <p className="text-xs text-gray-500 mt-1">Posted by: {exp.postedBy?.name}</p>
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

export default Companies;
