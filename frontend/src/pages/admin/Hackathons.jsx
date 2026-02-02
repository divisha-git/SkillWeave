import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const emptyPS = { title: '', description: '', teamLimit: 1 };

const Hackathons = () => {
  const [saving, setSaving] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    problemStatements: [ { ...emptyPS } ],
  });

  const updatePS = (index, key, value) => {
    const next = form.problemStatements.map((ps, i) => (
      i === index ? { ...ps, [key]: key === 'teamLimit' ? Math.max(1, Number(value) || 1) : value } : ps
    ));
    setForm({ ...form, problemStatements: next });
  };

  const addPS = () => {
    setForm({ ...form, problemStatements: [...form.problemStatements, { ...emptyPS }] });
  };

  const removePS = (index) => {
    const next = form.problemStatements.filter((_, i) => i !== index);
    setForm({ ...form, problemStatements: next.length ? next : [{ ...emptyPS }] });
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data || []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startTime || !form.endTime) {
      toast.error('Please fill hackathon name and time range');
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      toast.error('End time must be after start time');
      return;
    }
    const validPS = form.problemStatements.filter(ps => ps.title.trim() && ps.description.trim());
    if (!validPS.length) {
      toast.error('Please add at least one problem statement with title and description');
      return;
    }

    setSaving(true);
    try {
      // 1) Create Event
      const eventRes = await api.post('/admin/events', {
        name: form.name.trim(),
        startDate: new Date(form.startTime).toISOString(),
        endDate: new Date(form.endTime).toISOString()
      });

      const eventId = eventRes.data?.event?._id;
      if (!eventId) {
        throw new Error('Event creation failed');
      }

      // 2) Create Problem Statements for this event
      for (const ps of validPS) {
        await api.post('/admin/problem-statements', {
          title: ps.title.trim(),
          description: ps.description.trim(),
          eventId,
          maxTeams: Number(ps.teamLimit) || 1,
        });
      }

      toast.success('Hackathon and problem statements created successfully');
      setForm({ name: '', startTime: '', endTime: '', problemStatements: [{ ...emptyPS }] });
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create hackathon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Hackathon</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hackathon Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Problem Statements</h3>
              <button
                type="button"
                onClick={addPS}
                className="px-3 py-1.5 bg-[#1a365d] text-white rounded-md hover:bg-[#2d3748] text-sm"
              >
                + Add Problem Statement
              </button>
            </div>

            <div className="space-y-4">
              {form.problemStatements.map((ps, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border border-gray-200 rounded-lg p-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={ps.title}
                      onChange={(e) => updatePS(idx, 'title', e.target.value)}
                      placeholder={`Problem Statement #${idx + 1}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={ps.description}
                      onChange={(e) => updatePS(idx, 'description', e.target.value)}
                      placeholder="Brief description"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={ps.teamLimit}
                      onChange={(e) => updatePS(idx, 'teamLimit', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={() => removePS(idx)}
                      className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 border border-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#1a365d] text-white rounded-lg hover:bg-[#2d3748] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Hackathon'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Existing Hackathons</h3>
          <button
            onClick={fetchEvents}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loadingEvents ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-600">Loading...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">No hackathons yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((ev) => (
              <div key={ev._id} className="bg-white rounded-lg shadow border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{ev.name}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(ev.startDate).toLocaleString()} — {new Date(ev.endDate).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Status: {ev.status}</p>
                    <p className="text-sm text-gray-700 mt-2">Teams registered: <span className="font-semibold">{ev.teamCount || 0}</span></p>
                  </div>
                  <Link
                    to={`/admin/hackathons/${ev._id}`}
                    className="px-3 py-1.5 bg-[#1a365d] text-white rounded-md hover:bg-[#2d3748] text-sm whitespace-nowrap"
                  >
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

export default Hackathons;
