import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const InterviewFeedback = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [groupedSubmissions, setGroupedSubmissions] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [taskForm, setTaskForm] = useState({
    companyName: '',
    description: '',
    departments: [],
    driveDate: '',
    deadline: ''
  });

  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD'];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/admin/feedback-tasks');
      setTasks(res.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (taskId) => {
    try {
      const res = await api.get(`/admin/feedback-submissions?taskId=${taskId}`);
      setSubmissions(res.data.submissions || []);
      setGroupedSubmissions(res.data.grouped || {});
    } catch (error) {
      toast.error('Failed to fetch submissions');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/admin/feedback-tasks/${editingTask._id}`, taskForm);
        toast.success('Task updated successfully');
      } else {
        await api.post('/admin/feedback-tasks', taskForm);
        toast.success('Task created successfully');
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ companyName: '', description: '', departments: [], driveDate: '', deadline: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure? This will delete all related feedback submissions.')) return;
    try {
      await api.delete(`/admin/feedback-tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleToggleActive = async (task) => {
    try {
      await api.put(`/admin/feedback-tasks/${task._id}`, { ...task, isActive: !task.isActive });
      toast.success(`Task ${task.isActive ? 'deactivated' : 'activated'}`);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleViewSubmissions = async (task) => {
    setSelectedTask(task);
    await fetchSubmissions(task._id);
    setShowSubmissionsModal(true);
  };

  const handleExportExcel = async () => {
    try {
      const dept = selectedDepartment !== 'all' ? `?department=${selectedDepartment}` : '';
      const response = await api.get(`/admin/feedback-export/${selectedTask._id}${dept}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTask.companyName}_feedback.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported successfully');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      companyName: task.companyName,
      description: task.description || '',
      departments: task.departments || [],
      driveDate: task.driveDate ? task.driveDate.split('T')[0] : '',
      deadline: task.deadline ? task.deadline.split('T')[0] : ''
    });
    setShowTaskModal(true);
  };

  const handleDepartmentToggle = (dept) => {
    setTaskForm(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const filteredSubmissions = selectedDepartment === 'all'
    ? submissions
    : submissions.filter(s => s.student?.department === selectedDepartment);

  if (loading) {
    return (
      <AdminLayout title="Interview Experience">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a365d] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Interview Experience">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Feedback Tasks</h2>
            <p className="text-gray-500 text-sm mt-1">Manage interview experience collection from students</p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setTaskForm({ companyName: '', description: '', departments: [], driveDate: '', deadline: '' });
              setShowTaskModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d3748] transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </div>

        {/* Tasks Grid */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Tasks</h3>
            <p className="text-gray-500">Create your first feedback task to start collecting interview experience</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task._id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${!task.isActive ? 'opacity-60' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#1a365d]/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#1a365d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.companyName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${task.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {task.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1.5 text-gray-400 hover:text-[#1a365d] hover:bg-gray-100 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
                        Drive: {new Date(task.driveDate).toLocaleDateString()}
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
                  <div className="flex flex-wrap gap-1 mb-4">
                    {task.departments.slice(0, 4).map((dept) => (
                      <span key={dept} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{dept}</span>
                    ))}
                    {task.departments.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">+{task.departments.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleActive(task)}
                      className={`text-sm font-medium ${task.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                      {task.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleViewSubmissions(task)}
                      className="flex items-center gap-1 text-sm font-medium text-[#1a365d] hover:text-[#2d3748]"
                    >
                      View Submissions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1a365d] flex items-center justify-between shrink-0">
              <div className="text-white">
                <h3 className="font-semibold text-lg">{editingTask ? 'Edit Task' : 'Create Feedback Task'}</h3>
                <p className="text-sm text-white/80">Request interview experience from students</p>
              </div>
              <button
                onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
                <input
                  type="text"
                  value={taskForm.companyName}
                  onChange={(e) => setTaskForm({ ...taskForm, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                  placeholder="Add instructions or details for students"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Departments *</label>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleDepartmentToggle(dept)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        taskForm.departments.includes(dept)
                          ? 'bg-[#1a365d] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTaskForm({ ...taskForm, departments: taskForm.departments.length === departments.length ? [] : [...departments] })}
                  className="mt-2 text-sm text-[#1a365d] hover:underline"
                >
                  {taskForm.departments.length === departments.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Drive Date</label>
                  <input
                    type="date"
                    value={taskForm.driveDate}
                    onChange={(e) => setTaskForm({ ...taskForm, driveDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Submission Deadline</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!taskForm.companyName || taskForm.departments.length === 0}
                  className="flex-1 px-4 py-2.5 bg-[#2F855A] text-white rounded-xl hover:bg-[#276749] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {showSubmissionsModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1a365d] flex items-center justify-between shrink-0">
              <div className="text-white">
                <h3 className="font-semibold text-lg">{selectedTask.companyName} - Submissions</h3>
                <p className="text-sm text-white/80">{filteredSubmissions.length} feedback received</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  disabled={filteredSubmissions.length === 0}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
                <button
                  onClick={() => { setShowSubmissionsModal(false); setSelectedTask(null); setExpandedSubmission(null); }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1a365d]"
                >
                  <option value="all">All Departments</option>
                  {Object.keys(groupedSubmissions).map((dept) => (
                    <option key={dept} value={dept}>{dept} ({groupedSubmissions[dept]?.length || 0})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((sub) => (
                    <div key={sub._id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                        onClick={() => setExpandedSubmission(expandedSubmission === sub._id ? null : sub._id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#1a365d] flex items-center justify-center text-white font-bold">
                            {sub.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{sub.student?.name}</h4>
                            <p className="text-sm text-gray-500">{sub.student?.studentId} • {sub.student?.department} • {sub.student?.year}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            sub.overallExperience === 'Excellent' ? 'bg-green-100 text-green-700' :
                            sub.overallExperience === 'Good' ? 'bg-blue-100 text-blue-700' :
                            sub.overallExperience === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sub.overallExperience}
                          </span>
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedSubmission === sub._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {expandedSubmission === sub._id && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {sub.rounds && sub.rounds.length > 0 ? (
                            <div className="mt-4 space-y-4">
                              {sub.rounds.map((round, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#1a365d] text-white text-xs flex items-center justify-center">{round.roundNumber}</span>
                                    {round.roundName}
                                  </h5>
                                  {round.fields && round.fields.length > 0 ? (
                                    <div className="space-y-2">
                                      {round.fields.map((field, fIdx) => (
                                        <div key={fIdx} className="flex gap-2">
                                          <span className="font-medium text-gray-700 text-sm min-w-[120px]">{field.fieldName}:</span>
                                          <span className="text-gray-600 text-sm">{field.fieldValue || '-'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-400">No fields added</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-gray-400">No rounds added</p>
                          )}
                          {sub.additionalComments && (
                            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-1">Additional Comments:</p>
                              <p className="text-sm text-gray-600">{sub.additionalComments}</p>
                            </div>
                          )}
                          <p className="mt-3 text-xs text-gray-400">
                            Submitted: {new Date(sub.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default InterviewFeedback;
