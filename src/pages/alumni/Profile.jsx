import { useState, useEffect, useRef } from 'react';
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    yearOfPassing: '',
    company: '',
    experience: '',
    domain: '',
    interviewExperience: '',
    linkedin: '',
    email: '',
    phone: '',
    profilePic: ''
  });

  // Format name: First letter caps, rest lowercase
  const formatName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get first letter for avatar
  const getInitial = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchProfile();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        yearOfPassing: profile.yearOfPassing || '',
        company: profile.company || '',
        experience: profile.experience || '',
        domain: profile.domain || '',
        interviewExperience: profile.interviewExperience || '',
        linkedin: profile.linkedin || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profilePic: profile.profilePic || ''
      });
      setProfilePic(profile.profilePic || null);
    }
  }, [profile]);

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
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/alumni/profile', profileForm);
      toast.success('Profile updated successfully');
      setShowProfileModal(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#009EDB] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FCF6]">
      {/* Header */}
      <header className="bg-[#009EDB] shadow-lg sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img 
                src="/kec-2.jpg" 
                alt="KEC Logo" 
                className="h-14 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">BYTSKEC</h1>
                <p className="text-xs text-white/80 -mt-1">Alumni Portal</p>
              </div>
            </div>

            {/* Profile Icon Only */}
            <div className="flex items-center">
              {/* Profile Icon Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-[#009EDB] font-semibold text-lg hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#009EDB] overflow-hidden border-2 border-white/50"
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#009EDB] font-bold">{getInitial(user?.name)}</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowProfileDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{formatName(user?.name)}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <svg className="w-5 h-5 text-[#009EDB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner - Full Width */}
        <div className="bg-[#009EDB] rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">
                Welcome, {formatName(profile?.name?.split(' ')[0]) || 'Alumni'}! 👋
              </h2>
              <p className="text-white/80">
                {unreadCount > 0 
                  ? `You have ${unreadCount} new message${unreadCount > 1 ? 's' : ''} from students`
                  : 'Welcome to your alumni dashboard'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 text-center min-w-[100px]">
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-xs text-white/80">Total Messages</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 text-center min-w-[100px]">
                <p className="text-2xl font-bold">{messages.filter(m => m.reply).length}</p>
                <p className="text-xs text-white/80">Replied</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Section - Takes more space */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#009EDB] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Student Messages</h3>
                      <p className="text-sm text-gray-500">Connect with students seeking guidance</p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-3 py-1 bg-[#009EDB] text-white text-sm font-medium rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      onClick={() => setSelectedMessage(message)}
                      className={`px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        !message.isRead ? 'bg-[#E0F7FA]' : ''
                      } ${selectedMessage?._id === message._id ? 'bg-[#B2EBF2]' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#009EDB] flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getInitial(message.from?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate">{formatName(message.from?.name)}</p>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{message.from?.department}</p>
                          <p className="font-medium text-gray-800 truncate">{message.subject}</p>
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">{message.content}</p>
                          {message.reply && (
                            <div className="mt-2 flex items-center gap-2 text-[#4CAF50]">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">Replied</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Students will reach out to you soon</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24 h-fit">
              <div className="bg-[#009EDB] px-6 py-8 text-center relative">
                {/* Profile Picture with upload option */}
                <div className="relative inline-block">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 overflow-hidden">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitial(profile?.name)
                    )}
                  </div>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="absolute bottom-3 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title="Change profile picture"
                  >
                    <svg className="w-4 h-4 text-[#009EDB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <h3 className="text-xl font-bold text-white">{formatName(profile?.name)}</h3>
                <p className="text-white/80 text-sm mt-1">{profile?.roleAtCompany || profile?.domain || 'Alumni'}</p>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E0F7FA] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#009EDB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-medium text-gray-900">{profile?.company || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium text-gray-900">{profile?.experience || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFF3E0] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#FF9800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Passed Out Year</p>
                    <p className="font-medium text-gray-900">{profile?.yearOfPassing || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E8EAF6] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#3F51B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Domain</p>
                    <p className="font-medium text-gray-900">{profile?.domain || 'Not specified'}</p>
                  </div>
                </div>

                {profile?.linkedin && (
                  <a 
                    href={profile.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#0077B5] hover:bg-blue-50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <span className="font-medium text-sm">LinkedIn Profile</span>
                  </a>
                )}

                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-full mt-4 py-2.5 px-4 bg-[#009EDB] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#009EDB]/25 transition-all duration-200"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#009EDB]">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="font-semibold text-lg">{selectedMessage.subject}</h3>
                  <p className="text-sm text-white/80">From: {selectedMessage.from?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#009EDB] flex items-center justify-center text-white font-bold text-lg">
                  {selectedMessage.from?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedMessage.from?.name}</p>
                  <p className="text-sm text-gray-500">{selectedMessage.from?.department} • {new Date(selectedMessage.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              {selectedMessage.reply ? (
                <div className="bg-[#E8F5E9] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#4CAF50]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Your Reply</span>
                  </div>
                  <p className="text-gray-700">{selectedMessage.reply}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all resize-none"
                    placeholder="Share your thoughts, advice, or experience..."
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => {
                        setSelectedMessage(null);
                        setReplyText('');
                      }}
                      className="px-5 py-2.5 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(selectedMessage._id)}
                      className="px-5 py-2.5 bg-[#91C04A] text-white font-medium rounded-xl hover:bg-[#7CB342] transition-all"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#009EDB]">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h3 className="font-semibold text-lg">Edit Profile</h3>
                  <p className="text-sm text-white/80">Update your professional information</p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Profile Picture Upload */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#009EDB] flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-gray-200">
                    {profileForm.profilePic ? (
                      <img src={profileForm.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitial(profileForm.name)
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm({ ...profileForm, profilePic: reader.result });
                          setProfilePic(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#009EDB] rounded-full shadow-lg flex items-center justify-center hover:bg-[#0077B5] transition-colors"
                    title="Change profile picture"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Passed Out Year *</label>
                  <input
                    type="text"
                    value={profileForm.yearOfPassing}
                    onChange={(e) => setProfileForm({ ...profileForm, yearOfPassing: e.target.value })}
                    placeholder="e.g., 2020"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company *</label>
                  <input
                    type="text"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                    placeholder="e.g., Google"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience *</label>
                  <input
                    type="text"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                    placeholder="e.g., 3 years"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Domain / Role *</label>
                  <input
                    type="text"
                    value={profileForm.domain}
                    onChange={(e) => setProfileForm({ ...profileForm, domain: e.target.value })}
                    placeholder="e.g., Full Stack Developer, Data Scientist"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Interview Experience</label>
                  <textarea
                    value={profileForm.interviewExperience}
                    onChange={(e) => setProfileForm({ ...profileForm, interviewExperience: e.target.value })}
                    rows={4}
                    placeholder="Share your interview experience, tips, and advice for students..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={profileForm.linkedin}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#009EDB] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-2.5 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#009EDB] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#009EDB]/25 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
