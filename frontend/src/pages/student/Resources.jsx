import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Resources = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [downloading, setDownloading] = useState(null);

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
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Handle file download
  const handleDownload = async (resource) => {
    try {
      setDownloading(resource._id);
      const response = await api.get(`/student/resources/${resource._id}/download`, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resource.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!');
    } catch (error) {
      toast.error('Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await api.get('/student/resources');
      const data = res.data || [];
      setResources(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(r => r.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      // Mock data if API doesn't exist yet
      setResources([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesSearch = !searchQuery || 
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group resources by category
  const groupedResources = filteredResources.reduce((acc, resource) => {
    const category = resource.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(resource);
    return acc;
  }, {});

  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Notes':
        return '📝';
      case 'Videos':
        return '🎬';
      case 'Books':
        return '📚';
      case 'Links':
        return '🔗';
      case 'Assignments':
        return '📋';
      default:
        return '📁';
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch(category) {
      case 'Notes':
        return 'from-blue-500 to-blue-600';
      case 'Videos':
        return 'from-red-500 to-red-600';
      case 'Books':
        return 'from-purple-500 to-purple-600';
      case 'Links':
        return 'from-green-500 to-green-600';
      case 'Assignments':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Get category badge color
  const getCategoryBadgeColor = (category) => {
    switch(category) {
      case 'Notes':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Videos':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Books':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Links':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Assignments':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get file icon based on extension
  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf':
        return '📕';
      case 'doc':
      case 'docx':
        return '📘';
      case 'ppt':
      case 'pptx':
        return '📙';
      case 'xls':
      case 'xlsx':
        return '📗';
      case 'zip':
      case 'rar':
        return '🗜️';
      case 'mp4':
      case 'avi':
      case 'mkv':
        return '🎥';
      default:
        return '📄';
    }
  };

  // Navigation items for sidebar
  const navItems = [
    { name: 'Dashboard', path: '/student/profile', icon: 'home' },
    { name: 'Events', path: '/student/events', icon: 'flag' },
    { name: 'Attendance', path: '/student/attendance', icon: 'calendar' },
    { name: 'Resources', path: '/student/resources', icon: 'book', current: true },
    { name: 'Alumni Network', path: '/student/alumni', icon: 'users' },
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
      case 'flag':
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 13V4a2 2 0 012-2h4l2 3h6a2 2 0 012 2v1l-2 3h-4l-2-3H5a2 2 0 00-2 2v9" />
            </svg>
        );
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
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            <p className="text-gray-500">Study materials and notes by domain</p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search courses, notes, or links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1a365d] focus:border-transparent outline-none"
                />
              </div>
              <div className="sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1a365d] focus:border-transparent outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory 
                    ? 'bg-[#1a365d] text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat 
                      ? 'bg-[#1a365d] text-white shadow-md' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{getCategoryIcon(cat)}</span>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Resources by Category */}
          {Object.keys(groupedResources).length > 0 ? (
            Object.entries(groupedResources).map(([category, categoryResources]) => (
              <div key={category} className="mb-8">
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center text-white text-2xl shadow-lg`}>
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                    <p className="text-sm text-gray-500">{categoryResources.length} resource{categoryResources.length > 1 ? 's' : ''} available</p>
                  </div>
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categoryResources.map((resource) => (
                    <div 
                      key={resource._id} 
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 group"
                    >
                      {/* Card Header with Gradient */}
                      <div className={`h-2 bg-gradient-to-r ${getCategoryColor(resource.category)}`}></div>
                      
                      <div className="p-5">
                        {/* Category Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeColor(resource.category)}`}>
                            {getCategoryIcon(resource.category)} {resource.category}
                          </span>
                          {resource.department && resource.department !== 'All' && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                              {resource.department}
                            </span>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-[#1a365d] transition-colors">
                          {resource.title}
                        </h3>
                        
                        {/* File Info */}
                        {resource.fileName && (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-3 border border-gray-100">
                            <span className="text-2xl">{getFileIcon(resource.fileName)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{resource.fileName}</p>
                              <p className="text-xs text-gray-500">Click to download</p>
                            </div>
                          </div>
                        )}

                        {/* External Link */}
                        {resource.url && !resource.fileUrl && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl mb-3 border border-blue-100">
                            <span className="text-2xl">🔗</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-800 truncate">{resource.url}</p>
                              <p className="text-xs text-blue-500">External link</p>
                            </div>
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          
                          {/* Download/Open Button */}
                          {(resource.fileUrl || resource.url) && (
                            resource.fileUrl ? (
                              <button
                                onClick={() => handleDownload(resource)}
                                disabled={downloading === resource._id}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-[#1a365d] text-white hover:bg-[#2d4a7c] shadow-md hover:shadow-lg disabled:opacity-50"
                              >
                                {downloading === resource._id ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"></circle>
                                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                  </>
                                )}
                              </button>
                            ) : (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Resources Available</h3>
                <p className="text-gray-500 max-w-md">
                  {searchQuery || selectedCategory 
                    ? 'No resources match your search criteria. Try adjusting your filters.'
                    : 'Resources will appear here once the admin uploads study materials and notes.'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Resources;
