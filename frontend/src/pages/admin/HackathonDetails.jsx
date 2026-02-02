import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const HackathonDetails = () => {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/admin/events/${eventId}`);
        setData(res.data);
        setError(null);
      } catch (e) {
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="p-8">Loading...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">{error || 'Event not found'}</p>
          <Link to="/admin/hackathons" className="px-4 py-2 bg-[#1a365d] text-white rounded-md hover:bg-[#2d3748]">Back to Hackathons</Link>
        </div>
      </div>
    );
  }

  const { event, teams } = data;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(event.startDate).toLocaleString()} — {new Date(event.endDate).toLocaleString()}
          </p>
        </div>
        <Link to="/admin/hackathons" className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50">Back</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-lg shadow p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Registered Teams ({teams?.length || 0})</h2>
          {teams && teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{team.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Members: {team.members?.length || 1} / Max {team.maxSize}</p>
                      {team.problemStatement && (
                        <p className="text-xs text-gray-600 mt-1">PS: {team.problemStatement.title}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No teams registered yet.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Details</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Status: <span className="font-medium capitalize">{event.status}</span></p>
              {event.venue && <p>Venue: <span className="font-medium">{event.venue}</span></p>}
              {event.registrationDeadline && (
                <p>Registration Deadline: <span className="font-medium">{new Date(event.registrationDeadline).toLocaleString()}</span></p>
              )}
              <p>Team Size: <span className="font-medium">{event.teamSize}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonDetails;
