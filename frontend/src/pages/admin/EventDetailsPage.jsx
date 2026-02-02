import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/admin/events/${id}`);
      setEvent(res.data.event);
      setTeams(res.data.teams);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async () => {
      if(window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        try {
            await api.delete(`/admin/events/${id}`);
            toast.success('Event deleted successfully');
            navigate('/admin/events');
        } catch (error) {
            toast.error('Failed to delete event');
        }
      }
  }

  if (loading) {
    return (
        <AdminLayout title="Event Details">
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a365d] border-t-transparent"></div>
            </div>
        </AdminLayout>
    );
  }

  if (!event) return null;

  return (
    <AdminLayout title={event.name}>
      <div className="mb-6">
        <Link to="/admin/events" className="text-[#1a365d] hover:underline flex items-center gap-1 mb-4">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
             Back to Events
        </Link>
        
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
                <button 
                    onClick={deleteEvent}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-semibold transition-colors"
                >
                    Delete Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Start Date</span>
                            <span className="font-medium">{new Date(event.startDate).toLocaleDateString()} {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-500 text-xs uppercase font-bold mb-1">End Date</span>
                             <span className="font-medium">{new Date(event.endDate).toLocaleDateString()} {new Date(event.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Venue</span>
                            <span className="font-medium">{event.venue || 'N/A'}</span>
                        </div>
                         <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-500 text-xs uppercase font-bold mb-1">Max Team Size</span>
                            <span className="font-medium">{event.teamSize || 5}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Teams Section */}
        <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1a365d] mb-4 flex items-center gap-2">
                Registered Teams 
                <span className="bg-blue-100 text-blue-800 text-sm py-0.5 px-2 rounded-full">{teams.length}</span>
            </h2>
            
            {teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => (
                        <div key={team._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">{team.name}</h3>
                                <span className="text-xs font-mono text-gray-500">{team.members.length}/{team.maxSize} Members</span>
                            </div>
                            <div className="p-4">
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Leader</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-xs font-bold text-yellow-700">
                                            {team.leader.name.charAt(0)}
                                        </div>
                                        <span className="text-sm text-gray-700">{team.leader.name}</span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Members</p>
                                    <div className="space-y-1">
                                        {team.members.filter(m => m._id !== team.leader._id).map(member => (
                                            <div key={member._id} className="flex items-center gap-2 text-sm text-gray-600">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <span>{member.name}</span>
                                            </div>
                                        ))}
                                        {team.members.length === 1 && <span className="text-xs text-gray-400 italic">No other members</span>}
                                    </div>
                                </div>
                                {team.problemStatement && (
                                    <div className="pt-3 border-t border-gray-50">
                                         <p className="text-xs text-gray-500 uppercase font-bold mb-1">Selected Problem</p>
                                         <p className="text-sm text-gray-800 font-medium truncate">{team.problemStatement.title}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <p className="text-gray-500">No teams registered yet.</p>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EventDetailsPage;
