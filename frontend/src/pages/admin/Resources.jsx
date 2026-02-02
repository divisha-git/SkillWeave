import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Notes',
    url: '',
    department: 'All',
    year: 'All'
  });

  const categories = ['Notes', 'Videos', 'Books', 'Links', 'Assignments', 'Other'];
  const departments = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const years = ['All', '1', '2', '3', '4'];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await api.get('/admin/resources');
      setResources(res.data || []);
    } catch (error) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('category', formData.category);
      submitData.append('url', formData.url);
      submitData.append('department', formData.department);
      submitData.append('year', formData.year);
      
      if (selectedFile) {
        submitData.append('file', selectedFile);
      }

      if (editingResource) {
        await api.put(`/admin/resources/${editingResource._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Resource updated successfully');
      } else {
        await api.post('/admin/resources', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Resource added successfully');
      }
      
      setShowForm(false);
      setEditingResource(null);
      setSelectedFile(null);
      setFormData({
        title: '',
        category: 'Notes',
        url: '',
        department: 'All',
        year: 'All'
      });
      fetchResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save resource');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setSelectedFile(null);
    setFormData({
      title: resource.title,
      category: resource.category,
      url: resource.url || '',
      department: resource.department || 'All',
      year: resource.year || 'All'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await api.delete(`/admin/resources/${id}`);
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      toast.error('Failed to delete resource');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Notes':
        return '📝';
      case 'Videos':
        return '🎥';
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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Notes':
        return 'bg-blue-100 text-blue-800';
      case 'Videos':
        return 'bg-red-100 text-red-800';
      case 'Books':
        return 'bg-green-100 text-green-800';
      case 'Links':
        return 'bg-purple-100 text-purple-800';
      case 'Assignments':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Resources">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Resources 📚">
      {/* Action Bar */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setEditingResource(null);
            setSelectedFile(null);
            setFormData({
              title: '',
              category: 'Notes',
              url: '',
              department: 'All',
              year: 'All'
            });
            setShowForm(!showForm);
          }}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            showForm 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-[#1a365d] text-white hover:bg-[#2d4a7c]'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Resource'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                  placeholder="Enter resource title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload File
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#1a365d] hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                  />
                  <span className="text-gray-600">
                    📁 {selectedFile ? selectedFile.name : 'Choose a file'}
                  </span>
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
              {editingResource?.fileName && !selectedFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Current file: <span className="font-medium">{editingResource.fileName}</span>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL / Link
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                placeholder="https://example.com/resource"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                >
                  {years.map(yr => (
                    <option key={yr} value={yr}>{yr === 'All' ? 'All Years' : `Year ${yr}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingResource(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d4a7c]"
              >
                {editingResource ? 'Update Resource' : 'Add Resource'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">All Resources ({resources.length})</h3>
        </div>
        {resources.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg">No resources added yet</p>
            <p className="text-sm mt-2">Click "Add Resource" to add your first resource</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map((resource) => (
                  <tr key={resource._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCategoryIcon(resource.category)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{resource.title}</div>
                          {resource.fileName && (
                            <a 
                              href={`http://localhost:5000${resource.fileUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              📎 {resource.fileName}
                            </a>
                          )}
                          {resource.url && (
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              🔗 View Link →
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(resource.category)}`}>
                        {resource.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{resource.department === 'All' ? 'All Depts' : resource.department}</div>
                      <div className="text-xs">{resource.year === 'All' ? 'All Years' : `Year ${resource.year}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="text-[#1a365d] hover:text-[#2d4a7c] mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resource._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Resources;
