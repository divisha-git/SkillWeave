import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Alumni = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [searchCompany, setSearchCompany] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [messageForm, setMessageForm] = useState({ subject: '', content: '' });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const query = searchCompany ? `?company=${searchCompany}` : '';
      const res = await api.get(`/student/alumni/search${query}`);
      setAlumni(res.data);
    } catch (error) {
      toast.error('Failed to load alumni');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchAlumni();
  };

  const handleSendMessage = async (alumniId) => {
    try {
      await api.post(`/student/alumni/${alumniId}/message`, messageForm);
      toast.success('Message sent successfully');
      setSelectedAlumni(null);
      setMessageForm({ subject: '', content: '' });
    } catch (error) {
      toast.error('Failed to send message');
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
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Alumni Network</h2>

        <div className="mb-6 flex space-x-4">
          <input
            type="text"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
            placeholder="Search by company name..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((alum) => (
            <div key={alum._id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">{alum.name}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Company:</span> {alum.company}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Role:</span> {alum.roleAtCompany}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Year:</span> {alum.yearOfPassing}
              </p>
              <button
                onClick={() => setSelectedAlumni(alum)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Send Message
              </button>
            </div>
          ))}
        </div>

        {selectedAlumni && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Send Message to {selectedAlumni.name}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(selectedAlumni._id);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlumni(null);
                      setMessageForm({ subject: '', content: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alumni;
