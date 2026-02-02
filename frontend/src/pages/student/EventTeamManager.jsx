import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EventTeamManager = ({ event }) => {
    const [myTeam, setMyTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [psList, setPsList] = useState([]);
    const [invitations, setInvitations] = useState([]); // Added state for invitations
    const [teamName, setTeamName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (event) {
            fetchMyTeam();
            fetchInvitations();
            if (event.eventType === 'hackathon') {
                fetchProblemStatements();
            }
        }
    }, [event]);

    const fetchMyTeam = async () => {
        try {
            // Check if user has a team for this event. 
            // We might need a specific endpoint or filter the generic one.
            // Using the available-students endpoint might be wrong.
            // Let's use the events endpoint that returns "myTeam" or a direct team lookup.
            // The /student/events endpoint returned "myTeam". 
            // Here, "event" prop might already have it if it came from that list, 
            // but for fresh data let's fetch.
            // Actually, let's fetch the list of my teams and filter.
            const res = await api.get('/student/my-teams');
            const team = res.data.find(t => t.event === event._id || t.event?._id === event._id);
            setMyTeam(team);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const res = await api.get('/student/profile');
            if (res.data?.pendingInvitations) {
                // Filter invites for this specific event
                const eventInvites = res.data.pendingInvitations.filter(
                    inv => inv.event && (inv.event._id === event._id || inv.event === event._id)
                );
                setInvitations(eventInvites);
            }
        } catch (error) {
            console.error("Failed to fetch invitations", error);
        }
    };

    const handleInviteResponse = async (invite, action) => {
        try {
            const teamId = invite.teamId;
            const inviteId = invite.inviteId;
            
            await api.post(`/student/events/${event._id}/teams/${teamId}/invite/${inviteId}`, { action });
            
            toast.success(`Invitation ${action}ed successfully`);
            
            if (action === 'accept') {
                // Refresh to show the team
                fetchMyTeam();
                setInvitations([]);
            } else {
                // Refresh invites list
                fetchInvitations();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} invitation`);
        }
    };

    const fetchProblemStatements = async () => {
        try {
            const res = await api.get(`/student/events/${event._id}/problem-statements`);
            setPsList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const createTeam = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/student/events/${event._id}/teams`, { name: teamName });
            setMyTeam(res.data.team);
            toast.success('Team created successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create team');
        }
    };

    const searchStudents = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await api.get(`/student/events/${event._id}/available-students?search=${query}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const sendInvite = async (studentId) => {
        try {
            await api.post(`/student/events/${event._id}/teams/${myTeam._id}/invite`, { studentId });
            toast.success('Invite sent!');
            fetchMyTeam(); // Refresh to show pending invites
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send invite');
        }
    };

    const selectProblemStatement = async (psId) => {
        if (!window.confirm('Are you sure you want to select this problem statement? Once selected, it cannot be changed.')) {
            return;
        }
        try {
            await api.post(`/student/events/${event._id}/problem-statements/${psId}/select`);
            toast.success('Problem Statement selected!');
            fetchMyTeam();
            fetchProblemStatements(); // Update global counts
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to select problem statement');
        }
    };
    
    // Add logic to handle accepting invites if the user is not in a team but has invites?
    // The "My Invites" section is usually global, but we can show it here if relevant.
    // For now, let's focus on the team leader view and team member view.

    if (loading) return <div>Loading team details...</div>;

    if (!myTeam) {
        return (
            <div>
                <h3 className="text-lg font-bold text-[#1a365d] mb-4">Join or Create a Team</h3>

                {invitations.length > 0 && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <span className="text-xl">📩</span>
                            Pending Invitations
                        </h4>
                        <div className="space-y-3">
                            {invitations.map(invite => (
                                <div key={invite.inviteId} className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{invite.teamName}</p>
                                        <p className="text-xs text-gray-600">Leader: {invite.leader?.name}</p>
                                        <p className="text-xs text-gray-400">Sent: {new Date(invite.invitedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleInviteResponse(invite, 'accept')}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={() => handleInviteResponse(invite, 'reject')}
                                            className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-600 mb-4">You are not part of any team for this event yet.</p>
                    
                    <form onSubmit={createTeam} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Create a new team</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter Team Name" 
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    required
                                />
                                <button type="submit" className="bg-[#1a365d] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#2d4a7c]">
                                    Create
                                </button>
                            </div>
                        </div>
                    </form>
                    
                    <div className="mt-6 pt-4 border-t">
                         <p className="text-xs text-gray-500">To join an existing team, ask the team leader to send you an invite.</p>
                         {/* We could list pending invites here if we fetched them */}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#1a365d]">Your Team: {myTeam.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {myTeam.members.length} / {event.teamSize} Members
                </span>
            </div>

            {/* Team Members List */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Members</h4>
                <div className="space-y-2">
                    {myTeam.members.map(member => (
                        <div key={member._id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {member.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                            {member._id === myTeam.leader._id ? (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Leader</span>
                            ) : (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Member</span>
                            )}
                        </div>
                    ))}
                    
                    {/* Pending Invites - Filter out those who are already members */}
                    {myTeam.pendingInvites?.filter(invite => 
                        invite.status === 'pending' &&
                        !myTeam.members.some(member => member._id === invite.student._id)
                    ).map(invite => (
                         <div key={invite.student._id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg opacity-70 border border-dashed border-gray-300">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                ?
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">{invite.student.name} (Invited)</p>
                                <p className="text-xs text-gray-500">{invite.student.email}</p>
                            </div>
                            <span className="text-xs text-gray-400">Pending</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Section (Leader Only) */}
             <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Invite Members</h4>
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Search students by name or email..."
                        value={searchQuery}
                        onChange={(e) => searchStudents(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                            {searchResults.map(student => (
                                <div key={student._id} className="p-2 hover:bg-gray-50 flex justify-between items-center cursor-pointer">
                                    <div className="text-sm">
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-xs text-gray-500">{student.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => sendInvite(student._id)}
                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                                    >
                                        Invite
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Problem Statements (Hackathon Only) */}
            {event.eventType === 'hackathon' && (
                <div className="border-t pt-4">
                    <h4 className="text-lg font-bold text-[#1a365d] mb-3">Problem Statements</h4>
                    
                    {myTeam.problemStatement ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Selected Problem</p>
                                    { /* We need to find the full PS details. If just ID is stored, we look it up in psList */ }
                                    {(() => {
                                        const selected = psList.find(p => p._id === myTeam.problemStatement || p._id === myTeam.problemStatement?._id);
                                        return selected ? (
                                            <>
                                                <h5 className="font-bold text-gray-900 mt-1">{selected.title}</h5>
                                                <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
                                            </>
                                        ) : <p>Loading problem details...</p>
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 mb-2">Select a problem statement for your team.</p>
                            {psList.map(ps => (
                                <div key={ps._id} className={`p-4 rounded-xl border transition-all ${
                                    ps.isFull ? 'bg-gray-100 border-gray-200 opacity-60 hidden' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-bold text-gray-900">{ps.title}</h5>
                                         <span className={`text-xs px-2 py-1 rounded font-medium ${
                                             ps.isFull ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                         }`}>
                                            {ps.isFull ? 'Full' : `${ps.slotsRemaining} slots left`}
                                         </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{ps.description}</p>
                                    {!ps.isFull && (
                                        <button 
                                            onClick={() => selectProblemStatement(ps._id)}
                                            className="w-full py-2 bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg hover:bg-[#1a365d] hover:text-white transition-colors"
                                        >
                                            Select This Problem
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventTeamManager;
