import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/student/events', { params: { status: 'upcoming' } });
        setEvents(res.data || []);
      } catch (e) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FCF6] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Events & Hackathons</h1>
          <p className="text-gray-500">Upcoming opportunities</p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No upcoming events yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((ev) => (
              <div key={ev._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{ev.name}</h3>
                  {ev.isNew && (
                    <span className="px-2 py-0.5 bg-[#1a365d] text-white text-xs font-medium rounded-full">NEW</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {` - `}
                  {new Date(ev.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-gray-700 mt-2">Teams registered: <span className="font-semibold">{ev.teamCount || 0}</span></p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm">
                    {ev.isRegistered ? (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md">Registered</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">Open</span>
                    )}
                  </div>
                  <Link to={`/student/events/${ev._id}`} className="px-3 py-1.5 text-sm bg-[#1a365d] text-white rounded-md hover:bg-[#2d3748]">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
