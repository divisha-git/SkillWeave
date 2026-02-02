import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const EventDetails = () => {
  const { eventId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/student/events/${eventId}`);
        setData(res.data);
        setError(null);
      } catch (e) {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1a365d] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F9FCF6] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
          <p className="text-gray-600 mb-4">{error || 'Event not found'}</p>
          <Link to="/student/events" className="px-4 py-2 bg-[#1a365d] text-white rounded-lg hover:bg-[#2d3748]">Back to Events</Link>
        </div>
      </div>
    );
  }

  const { event, myTeam, problemStatements, isRegistered } = data;

  return (
    <div className="min-h-screen bg-[#F9FCF6] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(event.startDate).toLocaleString()} — {new Date(event.endDate).toLocaleString()}
            </p>
          </div>
          <Link to="/student/events" className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Back</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Problem Statements</h2>
            {problemStatements && problemStatements.length > 0 ? (
              <div className="space-y-3">
                {problemStatements.map((ps) => (
                  <div key={ps._id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{ps.title}</p>
                        {ps.description && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{ps.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Team limit: {ps.maxTeams} | Selected: {ps.selectedTeams?.length || 0}</p>
                      </div>
                      <button
                        disabled
                        className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                        title="Team selection flow coming next"
                      >
                        Choose PS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No problem statements published yet.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Status</h2>
              <div className="text-sm">
                {isRegistered ? (
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md">Registered</span>
                ) : (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">Open</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">My Team</h2>
              {myTeam ? (
                <div className="text-sm text-gray-700">
                  <p className="font-medium">{myTeam.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Members: {myTeam.members?.length || 1} / Max {myTeam.maxSize}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">You are not in a team for this event.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
