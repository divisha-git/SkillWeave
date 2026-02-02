import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Alumni = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [alumniMessages, setAlumniMessages] = useState({});
  const [expandedAlumni, setExpandedAlumni] = useState(null);
  const [profile, setProfile] = useState(null);
  const chatEndRef = useRef(null);

  // Format name
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
    fetchAlumni();
    fetchAlumniMessages();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      setProfile(res.data);
    } catch (error) {
      console.error('Failed to load profile');
    }
  };

  const fetchAlumni = async () => {
    try {
      // If search query exists, use search endpoint, otherwise get all alumni
      const endpoint = searchQuery 
        ? `/student/alumni/search?company=${searchQuery}&name=${searchQuery}` 
        : '/student/alumni';
      const res = await api.get(endpoint);
      setAlumni(res.data);
    } catch (error) {
      console.error('Error fetching alumni:', error);
      toast.error('Failed to load alumni');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumniMessages = async () => {
    try {
      const res = await api.get('/student/alumni/unread-counts');
      setAlumniMessages(res.data);
    } catch (error) {
      console.log('Failed to load alumni messages');
    }
  };

  const fetchConversation = async (alumniId) => {
    setLoadingChat(true);
    try {
      const res = await api.get(`/student/alumni/${alumniId}/conversation`);
      setConversation(res.data.messages);
      // Refresh unread counts after viewing conversation
      fetchAlumniMessages();
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchAlumni();
  };

  const handleOpenChat = (alum) => {
    setSelectedAlumni(alum);
    setShowChatModal(true);
    setExpandedAlumni(null);
    fetchConversation(alum._id);
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    try {
      const res = await api.post(`/student/alumni/${selectedAlumni._id}/chat`, {
        content: chatMessage
      });
      setConversation(prev => [...prev, res.data]);
      setChatMessage('');
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (showChatModal && conversation.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, showChatModal]);

  // Filter alumni
  const filteredAlumni = alumni.filter(alum => {
    const query = searchQuery.toLowerCase();
    return (
      alum.name?.toLowerCase().includes(query) ||
      alum.company?.toLowerCase().includes(query) ||
      alum.roleAtCompany?.toLowerCase().includes(query) ||
      alum.domain?.toLowerCase().includes(query)
    );
  });

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/student/profile', icon: 'home' },
    { name: 'Attendance', path: '/student/attendance', icon: 'calendar' },
    { name: 'Resources', path: '/student/resources', icon: 'book' },
    { name: 'Alumni Network', path: '/student/alumni', icon: 'users', current: true },
    { name: 'Interview Feedback', path: '/student/feedback', icon: 'feedback' },
  ];

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'feedback':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FCF6] flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
              <img 
                src="/kec-2.png" 
                alt="KEC Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a365d]">BYTS KEC</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Student Portal</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Section in Sidebar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1a365d] flex items-center justify-center text-white font-bold overflow-hidden">
              {getInitial(profile?.student?.name || user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{formatName(profile?.student?.name || user?.name)}</p>
              <p className="text-xs text-gray-500">{profile?.student?.department} - Year {profile?.student?.year}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.student?.studentId}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                item.current 
                  ? 'bg-[#1a365d] text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {getIcon(item.icon)}
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-[#1a365d] shadow-lg sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg text-white hover:bg-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
                    <img 
                      src="/kec-2.png" 
                      alt="KEC Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white font-bold text-lg">BYTS KEC</span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#1a365d] font-bold text-lg hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {getInitial(user?.name)}
                </button>

                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{formatName(user?.name)}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/student/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg className="w-5 h-5 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
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
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Alumni Network</h1>
            <p className="text-gray-500">Connect with alumni for guidance and mentorship</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, company, role, or domain..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#1a365d] text-white font-medium rounded-xl hover:bg-[#2d3748] transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Alumni Grid - Small Circles that Expand */}
          <div className="flex flex-wrap gap-4 justify-center">
            {filteredAlumni.length > 0 ? (
              filteredAlumni.map((alum) => (
                <div key={alum._id} className="relative">
                  {/* Small Circle Avatar - Click to Expand */}
                  <button
                    onClick={() => setExpandedAlumni(expandedAlumni === alum._id ? null : alum._id)}
                    className={`w-16 h-16 rounded-full bg-[#1a365d] flex items-center justify-center text-white text-xl font-bold border-3 border-white shadow-lg hover:scale-110 transition-all duration-300 overflow-hidden ${expandedAlumni === alum._id ? 'ring-4 ring-[#91C04A] scale-110' : ''}`}
                  >
                    {alum.profilePic ? (
                      <img src={alum.profilePic} alt={alum.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitial(alum.name)
                    )}
                  </button>
                  
                  {/* Message Badge */}
                  {alumniMessages[alum._id] > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {alumniMessages[alum._id]}
                    </span>
                  )}

                  {/* Expanded Card */}
                  {expandedAlumni === alum._id && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
                      {/* Card Header */}
                      <div className="bg-[#1a365d] px-5 py-4 text-center relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAlumni(null);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-bold text-white">{formatName(alum.name)}</h3>
                        <p className="text-white/80 text-sm">{alum.roleAtCompany || alum.domain || 'Alumni'}</p>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#91C04A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-sm text-gray-600">{alum.company || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">{alum.experience || 'N/A'} exp</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Batch of {alum.yearOfPassing || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(alum);
                          }}
                          className="w-full py-2 bg-[#91C04A] text-white font-medium rounded-xl hover:bg-[#7CB342] transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Send Message
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16 w-full">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium text-lg">No alumni found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
              </div>
            )}
          </div>

          {/* Click outside to close expanded card */}
          {expandedAlumni && (
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setExpandedAlumni(null)}
            ></div>
          )}
        </main>
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1a365d] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold overflow-hidden">
                    {selectedAlumni.profilePic ? (
                      <img src={selectedAlumni.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitial(selectedAlumni.name)
                    )}
                  </div>
                  <div className="text-white">
                    <h3 className="font-semibold">{formatName(selectedAlumni.name)}</h3>
                    <p className="text-sm text-white/80">{selectedAlumni.company} • {selectedAlumni.roleAtCompany || 'Alumni'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChatModal(false);
                    setSelectedAlumni(null);
                    setConversation([]);
                    setChatMessage('');
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-400">Start a conversation with {formatName(selectedAlumni.name)}</p>
                </div>
              ) : (
                <>
                  {conversation.map((msg) => {
                    const isMyMessage = msg.from._id === user._id || msg.from === user._id;
                    return (
                      <div key={msg._id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isMyMessage 
                              ? 'bg-[#1a365d] text-white rounded-br-md' 
                              : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                          }`}>
                            {msg.subject && (
                              <p className={`text-xs font-medium mb-1 ${isMyMessage ? 'text-white/70' : 'text-gray-500'}`}>
                                {msg.subject}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          {/* Show reply if exists (for old-style messages) */}
                          {msg.reply && isMyMessage && (
                            <div className="mt-2 flex justify-start">
                              <div className="max-w-[100%] bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                                <p className="text-xs font-medium text-gray-500 mb-1">Reply from {formatName(selectedAlumni.name)}</p>
                                <p className="text-sm whitespace-pre-wrap">{msg.reply}</p>
                                {msg.repliedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(msg.repliedAt).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-gray-100 bg-white shrink-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2.5 bg-[#91C04A] text-white font-medium rounded-xl hover:bg-[#7CB342] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alumni;
