import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const Alumni = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      const res = await api.get('/admin/alumni');
      setAlumni(res.data);
    } catch (error) {
      toast.error('Failed to load alumni');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/alumni/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (res.data.imported > 0) {
        toast.success(`Successfully imported ${res.data.imported} alumni record(s)`);
      } else {
        let errorMsg = 'No alumni records were imported. ';
        if (res.data.errors && res.data.errors.length > 0) {
          errorMsg += `Errors: ${res.data.errors.map(e => e.error).join(', ')}`;
        } else if (res.data.totalRows === 0) {
          errorMsg += 'The Excel file appears to be empty or has no data rows.';
        } else {
          errorMsg += 'Please check the Excel file format. Required columns: Name, Company';
        }
        toast.error(errorMsg, { duration: 5000 });
      }
      
      if (res.data.errors && res.data.errors.length > 0) {
        console.error('Import errors:', res.data.errors);
      }
      
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchAlumni();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Alumni">
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
    <AdminLayout title="Manage Alumni 🎓">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Upload Alumni Excel File</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Required columns:</strong> Name, Company
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Optional columns:</strong> Role, Year of passing, Email
          </p>
          <p className="text-xs text-gray-600">
            Column names are case-insensitive. First row must be headers. See ALUMNI_EXCEL_TEMPLATE.md for details.
          </p>
        </div>
        <form onSubmit={handleUpload} className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#1a365d] hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                required
                className="hidden"
              />
              <span className="text-gray-600">
                📊 {file ? file.name : 'Choose Excel file (.xlsx, .csv)'}
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-6 py-3 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d4a7c] disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Alumni List ({alumni.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year of Passing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alumni.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <p>No alumni records yet</p>
                    <p className="text-sm mt-1">Upload an Excel file to import alumni data</p>
                  </td>
                </tr>
              ) : (
                alumni.map((alum) => (
                  <tr key={alum._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-medium">
                          {alum.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{alum.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        {alum.company}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alum.roleAtCompany || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alum.yearOfPassing || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alum.email || '-'}</td>
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

export default Alumni;
