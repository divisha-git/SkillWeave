import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Feedback = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Feedback form state
  const [rounds, setRounds] = useState([]);
  const [overallExperience, setOverallExperience] = useState('Good');
  const [additionalComments, setAdditionalComments] = useState('');

  const navItems = [
    { name: 'Dashboard', path: '/student/profile', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Attendance', path: '/student/attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'Resources', path: '/student/resources', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Alumni Network', path: '/student/alumni', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Interview Experience', path: '/student/feedback', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', active: true }
  ];

  const formatName = (name) => {
    if (!name) return '';
    return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
    fetchTasks();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile');
      setProfilePic(res.data?.student?.profilePic);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/student/feedback-tasks');
      setTasks(res.data);
    } catch (error) {
      toast.error('Failed to fetch feedback tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedbackForm = async (task) => {
    setSelectedTask(task);
    try {
      const res = await api.get(`/student/feedback/${task._id}`);
      setFeedback(res.data);
      setRounds(res.data.rounds || []);
      setOverallExperience(res.data.overallExperience || 'Good');
      setAdditionalComments(res.data.additionalComments || '');
      setShowFeedbackModal(true);
    } catch (error) {
      toast.error('Failed to load feedback form');
    }
  };

  // Round CRUD operations
  const addRound = () => {
    setRounds([...rounds, {
      roundNumber: rounds.length + 1,
      roundName: '',
      fields: [{ fieldName: '', fieldValue: '' }]
    }]);
  };

  const removeRound = (roundIndex) => {
    const newRounds = rounds.filter((_, idx) => idx !== roundIndex);
    // Renumber rounds
    newRounds.forEach((r, idx) => r.roundNumber = idx + 1);
    setRounds(newRounds);
  };

  const updateRoundName = (roundIndex, name) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].roundName = name;
    setRounds(newRounds);
  };

  // Field CRUD operations
  const addField = (roundIndex) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].fields.push({ fieldName: '', fieldValue: '' });
    setRounds(newRounds);
  };

  const removeField = (roundIndex, fieldIndex) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].fields = newRounds[roundIndex].fields.filter((_, idx) => idx !== fieldIndex);
    setRounds(newRounds);
  };

  const updateField = (roundIndex, fieldIndex, key, value) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].fields[fieldIndex][key] = value;
    setRounds(newRounds);
  };

  const handleSaveFeedback = async (submit = false) => {
    // Validate if submitting
    if (submit) {
      if (rounds.length === 0) {
        toast.error('Please add at least one round');
        return;
      }
      for (const round of rounds) {
        if (!round.roundName.trim()) {
          toast.error('Please enter a name for all rounds');
          return;
        }
      }
    }

    setSavingFeedback(true);
    try {
      await api.put(`/student/feedback/${selectedTask._id}`, {
        rounds,
        overallExperience,
        additionalComments,
        isSubmitted: submit
      });
      toast.success(submit ? 'Feedback submitted successfully!' : 'Feedback saved as draft');
      setShowFeedbackModal(false);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a365d] border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FCF6]">
      {/* Mobile Sidebar Overlay */}
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
              <h1 className="text-lg font-bold text-[#1a365d]">BYTS KEC</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Student Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
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
                item.active ? 'bg-[#1a365d] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-[#1a365d] shadow-lg sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-white hover:bg-white/10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
                    <img src="/kec-2.png" alt="KEC Logo" className="w-full h-full object-cover" />
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
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Interview Experience</h1>
            <p className="text-gray-500 text-sm mt-1">Share your interview experience to help your juniors</p>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Requests</h3>
              <p className="text-gray-500">There are no active feedback tasks for your department</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <div key={task._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#1a365d]/10 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{task.companyName}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.feedbackStatus === 'submitted' ? 'bg-green-100 text-green-700' :
                          task.feedbackStatus === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {task.feedbackStatus === 'submitted' ? 'Submitted' :
                           task.feedbackStatus === 'draft' ? 'Draft Saved' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {task.driveDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Drive Date: {new Date(task.driveDate).toLocaleDateString()}
                        </div>
                      )}
                      {task.deadline && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenFeedbackForm(task)}
                      disabled={task.feedbackStatus === 'submitted'}
                      className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                        task.feedbackStatus === 'submitted'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-[#1a365d] text-white hover:bg-[#2d3748]'
                      }`}
                    >
                      {task.feedbackStatus === 'submitted' ? 'Already Submitted' :
                       task.feedbackStatus === 'draft' ? 'Continue Editing' : 'Create Feedback'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1a365d] flex items-center justify-between shrink-0">
              <div className="text-white">
                <h3 className="font-semibold text-lg">{selectedTask.companyName} - Feedback</h3>
                <p className="text-sm text-white/80">Add your interview rounds and experience</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Rounds */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Interview Rounds</h4>
                  <button
                    onClick={addRound}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1a365d] text-white rounded-lg text-sm hover:bg-[#2d3748]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Round
                  </button>
                </div>

                {rounds.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No rounds added yet. Click "Add Round" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rounds.map((round, roundIdx) => (
                      <div key={roundIdx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-8 h-8 rounded-full bg-[#1a365d] text-white text-sm font-bold flex items-center justify-center">
                            {round.roundNumber}
                          </span>
                          <input
                            type="text"
                            value={round.roundName}
                            onChange={(e) => updateRoundName(roundIdx, e.target.value)}
                            placeholder="Round name (e.g., Technical Round 1)"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                          />
                          <button
                            onClick={() => removeRound(roundIdx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Fields */}
                        <div className="space-y-3 ml-11">
                          {round.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx} className="flex items-start gap-2">
                              <input
                                type="text"
                                value={field.fieldName}
                                onChange={(e) => updateField(roundIdx, fieldIdx, 'fieldName', e.target.value)}
                                placeholder="Question/Topic"
                                className="w-1/3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1a365d]"
                              />
                              <textarea
                                value={field.fieldValue}
                                onChange={(e) => updateField(roundIdx, fieldIdx, 'fieldValue', e.target.value)}
                                placeholder="Your answer/experience"
                                rows={2}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1a365d] resize-none"
                              />
                              <button
                                onClick={() => removeField(roundIdx, fieldIdx)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addField(roundIdx)}
                            className="flex items-center gap-1 text-sm text-[#1a365d] hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Field
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overall Experience */}
              <div>
                <label className="block font-semibold text-gray-900 mb-3">Overall Experience</label>
                <div className="flex flex-wrap gap-2">
                  {['Excellent', 'Good', 'Average', 'Poor'].map((exp) => (
                    <button
                      key={exp}
                      onClick={() => setOverallExperience(exp)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        overallExperience === exp
                          ? exp === 'Excellent' ? 'bg-green-500 text-white' :
                            exp === 'Good' ? 'bg-blue-500 text-white' :
                            exp === 'Average' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Comments */}
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Additional Comments</label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  rows={3}
                  placeholder="Any additional tips or feedback for future candidates..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveFeedback(false)}
                disabled={savingFeedback}
                className="flex-1 px-4 py-2.5 border border-[#1a365d] text-[#1a365d] rounded-xl hover:bg-[#1a365d]/5 font-medium disabled:opacity-50"
              >
                {savingFeedback ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSaveFeedback(true)}
                disabled={savingFeedback}
                className="flex-1 px-4 py-2.5 bg-[#2F855A] text-white rounded-xl hover:bg-[#276749] font-medium disabled:opacity-50"
              >
                {savingFeedback ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
