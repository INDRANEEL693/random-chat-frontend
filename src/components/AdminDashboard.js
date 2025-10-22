import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/sessions?limit=100`)
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const res = await axios.get(`${API}/session/${sessionId}`);
      setSelectedSession(res.data);
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedSession(null)}
            variant="outline"
            className="mb-6"
            data-testid="back-to-sessions-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Session Details</h2>
                <p className="text-sm text-gray-500 mt-1">Session ID: {selectedSession.session_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-b">
              <div>
                <p className="text-sm text-gray-500">User 1</p>
                <p className="font-semibold text-lg">{selectedSession.user1_username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User 2</p>
                <p className="font-semibold text-lg">{selectedSession.user2_username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">{new Date(selectedSession.started_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ended</p>
                <p className="font-medium">
                  {selectedSession.ended_at ? new Date(selectedSession.ended_at).toLocaleString() : "Active"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">
                Messages ({selectedSession.messages?.length || 0})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedSession.messages && selectedSession.messages.length > 0 ? (
                  selectedSession.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      data-testid="admin-message"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-blue-600">{msg.sender_username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-800">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No messages in this session</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="outline" data-testid="back-to-app-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-6" data-testid="stats-card-online">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Online Users</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.online_users}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6" data-testid="stats-card-active">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.active_sessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6" data-testid="stats-card-total">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total_sessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6" data-testid="stats-card-waiting">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waiting Queue</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.waiting_queue}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Recent Chat Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <tr key={session.session_id} className="hover:bg-gray-50" data-testid="session-row">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {session.user1_username} ↔ {session.user2_username}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                          {session.message_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(session.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            session.ended_at
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {session.ended_at ? "Ended" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => fetchSessionDetails(session.session_id)}
                          size="sm"
                          variant="outline"
                          data-testid="view-session-button"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No sessions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
