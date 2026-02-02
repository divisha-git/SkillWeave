import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const CreateEventModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    eventType: 'event', // 'event' or 'hackathon'
    teamSize: 5,
    // hackathon specific
    problemStatements: []
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addProblemStatement = () => {
    setFormData(prev => ({
      ...prev,
      problemStatements: [...prev.problemStatements, { title: '', description: '', maxTeams: '' }]
    }));
  };

  const updateProblemStatement = (index, field, value) => {
    const updated = [...formData.problemStatements];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, problemStatements: updated }));
  };

  const removeProblemStatement = (index) => {
    const updated = [...formData.problemStatements];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, problemStatements: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await api.post('/admin/events', formData);
        toast.success('Event created successfully');
        onSuccess();
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto px-4 py-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#1a365d] mb-4">Create New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select name="eventType" value={formData.eventType} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg">
                        <option value="event">General Event</option>
                        <option value="hackathon">Hackathon</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="datetime-local" name="startDate" required value={formData.startDate} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="datetime-local" name="endDate" required value={formData.endDate} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Venue (Optional)</label>
                 <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg"></textarea>
            </div>

            {formData.eventType === 'hackathon' && (
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Problem Statements</h3>
                        <button type="button" onClick={addProblemStatement} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200">
                            + Add Problem
                        </button>
                    </div>
                    
                    {formData.problemStatements.map((ps, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl mb-3 border relative">
                            <button type="button" onClick={() => removeProblemStatement(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">✕</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <input 
                                    placeholder="Problem Title" 
                                    value={ps.title} 
                                    onChange={(e) => updateProblemStatement(index, 'title', e.target.value)} 
                                    className="px-3 py-2 border rounded-lg" 
                                    required
                                />
                                <input 
                                    type="number" 
                                    placeholder="Team Limit (Max teams allowed)" 
                                    value={ps.maxTeams} 
                                    onChange={(e) => updateProblemStatement(index, 'maxTeams', e.target.value)} 
                                    className="px-3 py-2 border rounded-lg" 
                                />
                            </div>
                            <textarea 
                                placeholder="Problem Description" 
                                value={ps.description} 
                                onChange={(e) => updateProblemStatement(index, 'description', e.target.value)} 
                                className="w-full px-3 py-2 border rounded-lg" 
                                rows="2"
                                required
                            ></textarea>
                        </div>
                    ))}
                    {formData.problemStatements.length === 0 && (
                        <p className="text-gray-500 text-sm italic">No problem statements added. Add at least one for a hackathon.</p>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#1a365d] text-white rounded-lg hover:bg-[#2d3748] disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/admin/events');
            setEvents(res.data);
        } catch (error) {
            toast.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Events Management">
            <div className="flex justify-end mb-6">
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-[#1a365d] text-white px-5 py-2.5 rounded-xl hover:bg-[#2d3748] transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Event
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                     <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a365d] border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    event.eventType === 'hackathon' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    {event.eventType === 'hackathon' ? 'Hackathon' : 'Event'}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    {event.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{event.description}</p>

                            <div className="space-y-2 text-sm text-gray-500 mb-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                                </div>
                                {event.venue && (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{event.venue}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => navigate(`/admin/events/${event._id}`)}
                                className="w-full mt-auto py-2 bg-gray-50 text-[#1a365d] font-semibold rounded-lg hover:bg-[#1a365d] hover:text-white transition-all duration-200 text-sm"
                            >
                                View Details & Teams
                            </button>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            No events found. Click "Add New Event" to create one.
                        </div>
                    )}
                </div>
            )}

            {showCreateModal && (
                <CreateEventModal 
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchEvents();
                    }}
                />
            )}
        </AdminLayout>
    );
};

export default Events;