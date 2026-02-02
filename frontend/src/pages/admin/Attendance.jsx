import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Attendance = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchStudentsByDepartment();
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/students');
      const depts = [...new Set(res.data.map(s => s.department).filter(Boolean))];
      setDepartments(depts);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const fetchStudentsByDepartment = async () => {
    try {
      const res = await api.get(`/admin/students/department/${selectedDept}`);
      setStudents(res.data);
      // Initialize attendance data
      const initialData = {};
      res.data.forEach(student => {
        initialData[student._id] = 'present';
      });
      setAttendanceData(initialData);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData({ ...attendanceData, [studentId]: status });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDept || !selectedDate) {
      toast.error('Please select department and date');
      return;
    }

    setLoading(true);
    try {
      const data = Object.keys(attendanceData).map(studentId => ({
        studentId,
        status: attendanceData[studentId],
      }));

      await api.post('/admin/attendance', {
        department: selectedDept,
        date: selectedDate,
        attendanceData: data,
      });

      toast.success('Attendance marked successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1a365d] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/admin/dashboard" className="text-white font-bold">
              ← Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mark Attendance</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || students.length === 0}
                className="w-full px-4 py-2 bg-[#1a365d] text-white rounded-lg hover:bg-[#2d3748] disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Mark Attendance'}
              </button>
            </div>
          </form>

          {students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              value="present"
                              checked={attendanceData[student._id] === 'present'}
                              onChange={() => handleAttendanceChange(student._id, 'present')}
                              className="mr-2"
                            />
                            <span className="text-green-600">Present</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              value="absent"
                              checked={attendanceData[student._id] === 'absent'}
                              onChange={() => handleAttendanceChange(student._id, 'absent')}
                              className="mr-2"
                            />
                            <span className="text-red-600">Absent</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
