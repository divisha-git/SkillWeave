import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import EventTeamManager from './EventTeamManager';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  
  // Format name
  const formatName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
    fetchEventDetails();
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
        const res = await api.get('/student/profile');
        if (res.data?.student?.profilePic) {
            setProfilePic(res.data.student.profilePic);
        }
    } catch (error) {
        console.error(error);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/student/events/${id}`);
      setEventData(res.data);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/student/events');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/profile', icon: 'home' },
    { name: 'Events', path: '/student/events', icon: 'flag', current: true }, // Keeping Events active specifically
    { name: 'Attendance', path: '/student/attendance', icon: 'calendar' },
    { name: 'Resources', path: '/student/resources', icon: 'book' },
    { name: 'Alumni Network', path: '/student/alumni', icon: 'users' },
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
      case 'flag':
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 13V4a2 2 0 012-2h4l2 3h6a2 2 0 012 2v1l-2 3h-4l-2-3H5a2 2 0 00-2 2v9" />
            </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a365d] border-t-transparent"></div>
        </div>
    );
  }

  const { event } = eventData;

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
              <img src="/kec-2.png" alt="KEC Logo" className="w-full h-full object-cover" />
            </div>
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

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1a365d] flex items-center justify-center text-white font-bold overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitial(user?.name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{formatName(user?.name)}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
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
      <div className="flex-1 lg:ml-0">
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
                <div className="flex items-center text-white">
                    <Link to="/student/events" className="hover:text-gray-200 mr-2">Events</Link>
                    <span className="text-gray-300">/</span>
                    <span className="font-bold text-lg ml-2 truncate max-w-[200px]">{event.name}</span>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-10 h-10 rounded-full bg-white text-[#1a365d] font-bold overflow-hidden"
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
                      <Link
                         to="/student/profile"
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                         <svg className="w-5 h-5 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
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

        <main className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex justify-between items-start mb-6 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1a365d] mb-3">{event.name}</h1>
                        <div className="flex gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                            event.eventType === 'hackathon' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {event.eventType === 'hackathon' ? 'Hackathon' : 'Event'}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-3 text-lg">Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Start Date</p>
                                <p className="text-base font-bold text-[#1a365d]">
                                    {new Date(event.startDate).toLocaleDateString()}
                                    <span className="block text-xs font-normal text-gray-500 mt-1">
                                    {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">End Date</p>
                                <p className="text-base font-bold text-[#1a365d]">
                                    {new Date(event.endDate).toLocaleDateString()}
                                    <span className="block text-xs font-normal text-gray-500 mt-1">
                                    {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Venue</p>
                                <p className="text-base font-bold text-[#1a365d]">{event.venue || 'TBD'}</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Team Size</p>
                                <p className="text-base font-bold text-[#1a365d]">{event.teamSize} Members</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-l border-gray-100 pl-0 md:pl-8 pt-8 md:pt-0">
                       {/* We pass the full eventData object if EventTeamManager expects problemStatements etc, 
                           or just event if it fetches its own.
                           Earlier check showed it fetches "myTeam" itself, but expects "event" prop 
                           as the event object.
                           Also the API /student/events/:id returns { event, myTeam, problemStatements }
                           Let's check EventTeamManager again to be sure what it expects.
                           It used api.get(`/student/events/${event._id}/problem-statements`) internally.
                           So passing 'event' is sufficient.
                       */}
                       <EventTeamManager event={event} />
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default EventDetailsPage;
