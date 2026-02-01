import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchProfile();
    fetchMessages();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/alumni/profile');
      setProfile(res.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/alumni/messages');
      setMessages(res.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleReply = async (messageId) => {
    try {
      await api.post(`/alumni/messages/${messageId}/reply`, { reply: replyText });
      toast.success('Reply sent successfully');
      setSelectedMessage(null);
      setReplyText('');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send reply');
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
            <h1 className="text-xl font-bold text-primary-700">BYTS Alumni Portal</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">{profile?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Company:</span>
                <p className="font-medium">{profile?.company}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role:</span>
                <p className="font-medium">{profile?.roleAtCompany}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Year of Passing:</span>
                <p className="font-medium">{profile?.yearOfPassing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages from Students</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`border rounded-lg p-4 cursor-pointer ${
                      !message.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{message.from?.name}</p>
                        <p className="text-sm text-gray-600">{message.from?.department}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-semibold mt-2">{message.subject}</p>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{message.content}</p>
                    {message.reply && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-xs font-medium text-green-800">Your Reply:</p>
                        <p className="text-sm text-green-700">{message.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No messages yet</p>
              )}
            </div>
          </div>
        </div>

        {selectedMessage && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedMessage.subject}</h3>
                <p className="text-sm text-gray-500">
                  From: {selectedMessage.from?.name} ({selectedMessage.from?.department})
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-gray-700">{selectedMessage.content}</p>
            </div>

            {selectedMessage.reply ? (
              <div className="p-4 bg-green-50 rounded">
                <p className="font-medium text-green-800 mb-2">Your Reply:</p>
                <p className="text-green-700">{selectedMessage.reply}</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  placeholder="Type your reply here..."
                />
                <button
                  onClick={() => handleReply(selectedMessage._id)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Send Reply
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
