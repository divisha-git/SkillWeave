import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(true);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [downloadCreds, setDownloadCreds] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', studentId: '', department: '', year: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    year: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!downloadCreds) return;
    const header = ['Name','Email','StudentId','Password','Type'];
    const rows = downloadCreds.map(c => [c.name, c.email, c.studentId || '', c.password, c.type || 'student']);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_credentials.csv';
    a.click();
    URL.revokeObjectURL(url);
    setDownloadCreds(null);
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setEditData({
      name: s.name || '',
      email: s.email || '',
      studentId: s.studentId || '',
      department: s.department || '',
      year: s.year || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', email: '', studentId: '', department: '', year: '' });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/students/${id}`, editData);
      toast.success('Student updated');
      cancelEdit();
      fetchStudents();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update student');
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', formData);
      toast.success('Student added successfully');
      setShowForm(false);
      setFormData({ name: '', email: '', studentId: '', department: '', year: '' });
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please choose a CSV or XLSX file');
      return;
    }
    const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowed.includes(importFile.type) && !importFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('File must be .csv or .xlsx');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', importFile);
      const res = await api.post('/admin/students/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data?.summary || null);
      toast.success('Import processed');
      setImportFile(null);
      setShowImport(false);
      if (res.data?.credentials && res.data.credentials.length) {
        setDownloadCreds(res.data.credentials.map(c => ({ ...c, type: 'student' })));
      } else {
        setDownloadCreds(null);
      }
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import students');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Students">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
            {downloadCreds && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <span>Credentials generated for new/updated students. Download once and share securely.</span>
            <button onClick={downloadCSV} className="px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700">Download CSV</button>
          </div>
        )}
      </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Students 👥">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Students 🎓</h1>
      </div>

      {/* Import Section (visible by default) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Upload Students CSV/XLSX</h3>
          <button
            onClick={() => setShowImport(!showImport)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            {showImport ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 mb-4">
          <p className="font-medium">Required columns: Name, RollNo, Email</p>
          <p className="text-blue-700">Optional: Dept, Year, S.No. Headers can be case-insensitive. First row must be headers.</p>
        </div>
        {showImport && (
          <form onSubmit={handleImport} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full sm:w-auto text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <button
              type="submit"
              disabled={importing || !importFile}
              className="px-4 py-2 rounded-xl font-medium transition-colors bg-[#1a365d] text-white hover:bg-[#2d4a7c] disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Upload & Import'}
            </button>
            {importResult && (
              <span className="text-sm text-gray-600">Created: {importResult.created} • Updated: {importResult.updated} • Errors: {importResult.errors}</span>
            )}
          </form>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mb-6">
        <button
          onClick={() => { setShowImport(false); setShowForm(!showForm); }}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            showForm 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-[#1a365d] text-white hover:bg-[#2d4a7c]'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Student'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="text"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d4a7c] transition-colors"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

      

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">All Students ({students.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No student records yet</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === s._id ? (
                        <input className="w-full border rounded-md px-2 py-1 text-sm" value={editData.name} onChange={(e)=>setEditData({...editData,name:e.target.value})} />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1a365d] flex items-center justify-center text-white text-sm font-medium">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{s.name}</span>
                        </div>
                      )}
                    </td>
                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === s._id ? (
                        <input className="w-full border rounded-md px-2 py-1 text-sm" value={editData.email} onChange={(e)=>setEditData({...editData,email:e.target.value})} />
                      ) : (s.email || '-')}
                    </td>
                    {/* Student ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === s._id ? (
                        <input className="w-full border rounded-md px-2 py-1 text-sm" value={editData.studentId} onChange={(e)=>setEditData({...editData,studentId:e.target.value})} />
                      ) : (s.studentId || '-')}
                    </td>
                    {/* Department */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === s._id ? (
                        <input className="w-full border rounded-md px-2 py-1 text-sm" value={editData.department} onChange={(e)=>setEditData({...editData,department:e.target.value})} />
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{s.department || '-'}</span>
                      )}
                    </td>
                    {/* Year */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === s._id ? (
                        <input className="w-full border rounded-md px-2 py-1 text-sm" value={editData.year} onChange={(e)=>setEditData({...editData,year:e.target.value})} />
                      ) : (s.year || '-')}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {editingId === s._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={()=>saveEdit(s._id)} className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
                          <button onClick={cancelEdit} className="px-3 py-1 rounded-md border">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={()=>startEdit(s)} className="px-3 py-1 rounded-md border hover:bg-gray-50">Edit</button>
                          <button onClick={()=>deleteStudent(s._id)} className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Students;
