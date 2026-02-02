import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [unreadAlumniMessages, setUnreadAlumniMessages] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    studentId: '',
    department: '',
    year: '',
    skills: '',
    cgpa: '',
    achievements: '',
    resume: '',
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
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchProfile();
    fetchHackathons();
    fetchUnreadMessages();
  }, []);

  useEffect(() => {
    if (profile?.student) {
      setProfilePic(profile.student.profilePic || null);
      setProfileForm({
        name: profile.student.name || '',
        studentId: profile.student.studentId || '',
        department: profile.student.department || '',
        year: profile.student.year || '',
        skills: profile.student.skills || '',
        cgpa: profile.student.cgpa || '',
        achievements: profile.student.achievements || '',
        resume: profile.student.resume || '',
        profilePic: profile.student.profilePic || ''
      });
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      setProfile(res.data);
      setError(false);
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchHackathons = async () => {
    try {
      // Fetch hackathons from admin API
      const res = await api.get('/student/hackathons');
      setHackathons(res.data || []);
    } catch (error) {
      // No hackathons available
      setHackathons([]);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const res = await api.get('/student/messages/unread-count');
      setUnreadAlumniMessages(res.data?.count || 0);
    } catch (error) {
      setUnreadAlumniMessages(0);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/student/profile', profileForm);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, profilePic: reader.result });
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Navigation items for sidebar
  const navItems = [
    { name: 'Dashboard', path: '/student/profile', icon: 'home', current: true },
    { name: 'Attendance', path: '/student/attendance', icon: 'calendar' },
    { name: 'Resources', path: '/student/resources', icon: 'book' },
    { name: 'Alumni Network', path: '/student/alumni', icon: 'users', badge: unreadAlumniMessages > 0 ? unreadAlumniMessages : null },
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

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">Unable to load your profile</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(false);
              fetchProfile();
            }}
            className="px-6 py-2 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d3748] transition-colors"
          >
            Try Again
          </button>
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

      {/* Sidebar - Only visible when hamburger is clicked */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img 
              src="/kec-2.png" 
              alt="KEC Logo" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-[#1a365d]">BYTSKEC</h1>
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
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitial(profile?.student?.name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{formatName(profile?.student?.name)}</p>
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
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  item.current ? 'bg-white text-[#1a365d]' : 'bg-[#1a365d] text-white'
                }`}>
                  {item.badge}
                </span>
              )}
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
              {/* Left side - Hamburger + Logo */}
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
                  <img 
                    src="/kec-2.png" 
                    alt="KEC Logo" 
                    className="h-8 w-auto object-contain"
                  />
                  <span className="text-white font-bold text-lg">BYTSKEC</span>
                </div>
              </div>

              {/* Profile Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#1a365d] font-bold text-lg hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitial(user?.name)
                  )}
                </button>

                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)}></div>
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
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <svg className="w-5 h-5 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </button>
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
          {/* Welcome Banner */}
          <div className="bg-[#1a365d] rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">
                Welcome, {formatName(profile?.student?.name?.split(' ')[0]) || 'Student'}! 👋
              </h2>
              <p className="text-white/80">Welcome to your student dashboard</p>
            </div>
          </div>

          {/* Main Grid - 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a365d] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Attendance</h3>
                  <p className="text-xs text-gray-500">Your statistics</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                      <circle
                        cx="64" cy="64" r="56"
                        stroke={profile?.attendance?.percentage >= 75 ? '#91C04A' : profile?.attendance?.percentage >= 50 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="10"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(profile?.attendance?.percentage || 0) * 3.52} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-gray-900">{profile?.attendance?.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="font-bold text-gray-900">{profile?.attendance?.total || 0}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="font-bold text-[#91C04A]">{profile?.attendance?.present || 0}</p>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="font-bold text-red-500">{profile?.attendance?.absent || 0}</p>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#91C04A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                  <p className="text-xs text-gray-500">Hackathons & Competitions</p>
                </div>
              </div>
              <div className="p-5">
                {hackathons.length > 0 ? (
                  <div className="space-y-3">
                    {hackathons.slice(0, 3).map((hackathon) => (
                      <div key={hackathon._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        {hackathon.isNew && (
                          <span className="px-2 py-0.5 bg-[#1a365d] text-white text-xs font-medium rounded-full shrink-0">NEW</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{hackathon.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">Recent updates</p>
                </div>
              </div>
              <div className="p-5">
                {(unreadAlumniMessages > 0 || hackathons.some(h => h.isNew)) ? (
                  <div className="space-y-3">
                    {unreadAlumniMessages > 0 && (
                      <Link to="/student/alumni" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#1a365d] flex items-center justify-center text-white shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{unreadAlumniMessages} new message(s)</p>
                          <p className="text-xs text-gray-500">From alumni</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#1a365d] text-white text-xs font-bold rounded-full">{unreadAlumniMessages}</span>
                      </Link>
                    )}
                    {hackathons.filter(h => h.isNew).map((hackathon) => (
                      <div key={hackathon._id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-[#91C04A] flex items-center justify-center text-white shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">New: {hackathon.name}</p>
                          <p className="text-xs text-gray-500">Hackathon announced</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>


        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1a365d] flex items-center justify-between shrink-0">
              <div className="text-white">
                <h3 className="font-semibold text-lg">{isEditing ? 'Edit Profile' : 'My Profile'}</h3>
                <p className="text-sm text-white/80">Student Information</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => { setShowProfileModal(false); setIsEditing(false); }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-[#1a365d] flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-4 border-white shadow-lg">
                    {profileForm.profilePic ? (
                      <img src={profileForm.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitial(profileForm.name || profile?.student?.name)
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2F855A] flex items-center justify-center text-white shadow-lg hover:bg-[#276749]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                /* Editable Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Roll Number *</label>
                      <input
                        type="text"
                        value={profileForm.studentId}
                        onChange={(e) => setProfileForm({...profileForm, studentId: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                        placeholder="e.g., 21CS001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Year *</label>
                      <select
                        value={profileForm.year}
                        onChange={(e) => setProfileForm({...profileForm, year: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                      >
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Department *</label>
                    <select
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      <option value="CSE">Computer Science & Engineering</option>
                      <option value="ECE">Electronics & Communication</option>
                      <option value="EEE">Electrical & Electronics</option>
                      <option value="MECH">Mechanical Engineering</option>
                      <option value="CIVIL">Civil Engineering</option>
                      <option value="IT">Information Technology</option>
                      <option value="AIDS">AI & Data Science</option>
                      <option value="AIML">AI & Machine Learning</option>
                      <option value="CSC">Cyber Security</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={profileForm.cgpa}
                        onChange={(e) => setProfileForm({...profileForm, cgpa: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                        placeholder="e.g., 8.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Skills (Optional)</label>
                      <input
                        type="text"
                        value={profileForm.skills}
                        onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                        placeholder="e.g., React, Python"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Achievements</label>
                    <textarea
                      value={profileForm.achievements}
                      onChange={(e) => setProfileForm({...profileForm, achievements: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent resize-none"
                      placeholder="List your achievements, certifications, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Resume Link (Optional)</label>
                    <input
                      type="url"
                      value={profileForm.resume}
                      onChange={(e) => setProfileForm({...profileForm, resume: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileUpdate}
                      className="flex-1 py-2.5 bg-[#2F855A] text-white font-medium rounded-xl hover:bg-[#276749]"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-3">
                  {[
                    { label: 'Full Name', value: formatName(profile?.student?.name) },
                    { label: 'Roll Number', value: profile?.student?.studentId },
                    { label: 'Email', value: profile?.student?.email },
                    { label: 'Department', value: profile?.student?.department },
                    { label: 'Year', value: profile?.student?.year },
                    { label: 'CGPA', value: profile?.student?.cgpa },
                    { label: 'Skills', value: profile?.student?.skills },
                    { label: 'Achievements', value: profile?.student?.achievements },
                  ].filter(item => item.value).map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-900">{item.value}</p>
                    </div>
                  ))}
                  {profile?.student?.resume && (
                    <a
                      href={profile.student.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-50 rounded-xl p-4 hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[#1a365d] font-medium">View Resume</span>
                    </a>
                  )}
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="w-full mt-4 py-2.5 bg-[#1a365d] text-white font-medium rounded-xl hover:bg-[#2d3748]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
