import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const Attendance = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

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
    <AdminLayout title="Mark Attendance 📅">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || students.length === 0}
              className="w-full px-4 py-2 bg-[#1a365d] text-white rounded-xl hover:bg-[#2d4a7c] disabled:opacity-50 transition-colors"
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
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a365d] flex items-center justify-center text-white text-sm font-medium">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${student._id}`}
                            value="present"
                            checked={attendanceData[student._id] === 'present'}
                            onChange={() => handleAttendanceChange(student._id, 'present')}
                            className="sr-only"
                          />
                          <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            attendanceData[student._id] === 'present'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                          }`}>
                            ✓ Present
                          </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${student._id}`}
                            value="absent"
                            checked={attendanceData[student._id] === 'absent'}
                            onChange={() => handleAttendanceChange(student._id, 'absent')}
                            className="sr-only"
                          />
                          <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            attendanceData[student._id] === 'absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                          }`}>
                            ✗ Absent
                          </span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {students.length === 0 && selectedDept && (
          <div className="text-center py-8 text-gray-500">
            <p>No students found in {selectedDept} department</p>
          </div>
        )}

        {!selectedDept && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Select a department to mark attendance</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Attendance;
