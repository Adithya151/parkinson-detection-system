import React, { useState, useEffect } from 'react';
import { LogOut, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function PatientDashboard({ user, onLogout }) {
  const [handImage, setHandImage] = useState(null);
  const [voiceAudio, setVoiceAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Real data states
  const [profile, setProfile] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch patient profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/patient/${user.id}`);
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch patient profile:', err);
      }
    };
    fetchProfile();
  }, [user.id]);

  // Fetch test history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/tests/${user.id}`);
      setTestHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch test history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.id]);

  // Derive health status from latest test
  const latestTest = testHistory.length > 0 ? testHistory[testHistory.length - 1] : null;
  const healthStatus = latestTest ? latestTest.result : 'No Tests Yet';
  const statusColors = {
    'Parkinson': { bg: '#fee2e2', color: '#991b1b' },
    'Healthy':   { bg: '#dcfce7', color: '#166534' },
    'No Tests Yet': { bg: '#f1f5f9', color: '#475569' },
  };
  const statusStyle = statusColors[healthStatus] || statusColors['No Tests Yet'];

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!handImage || !voiceAudio) return alert("Please upload both image and audio files");

    setLoading(true);
    const formData = new FormData();
    formData.append('image', handImage);
    formData.append('audio', voiceAudio);
    formData.append('patient_id', user.id);

    try {
      const res = await axios.post('/predict', formData);
      setResult(res.data);
      // Refresh history to include new test
      await fetchHistory();
    } catch (err) {
      console.error(err);
      alert('Prediction failed. Make sure the backend Server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h2 className="title" style={{ marginBottom: 0, textAlign: 'left' }}>Patient Portal</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name} (ID: {user.id})</p>
        </div>
        <button onClick={onLogout} className="btn btn-secondary">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)' }}>
        {/* Profile Card */}
        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ background: '#e0f2fe', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Activity color="#0284c7" size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Health Status</h3>
            <span style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.25rem 1rem',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              background: statusStyle.bg,
              color: statusStyle.color
            }}>
              {healthStatus}
            </span>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Personal Info</h4>
            {profile ? (
              <>
                <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  Age: {profile.age ?? '—'}
                </p>
                <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  Gender: {profile.gender ?? '—'}
                </p>
                <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  Email: {profile.email ?? '—'}
                </p>
                <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                  Total Tests: {testHistory.length}
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading profile...</p>
            )}
          </div>
        </div>

        {/* Run New Test Card */}
        <div className="glass-card flex flex-col">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Run New Test</h3>
          <form onSubmit={handlePredict}>
            <div className="mb-4" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Handwriting Sample (Image)</label>
              <input type="file" accept="image/*" onChange={e => setHandImage(e.target.files[0])} className="input-field hover:border-blue-500" />
            </div>

            <div className="mb-4" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Voice Feature Sample (WAV)</label>
              <input type="file" accept="audio/*" onChange={e => setVoiceAudio(e.target.files[0])} className="input-field" />
            </div>

            <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Analyzing...' : 'Run Diagnostics'}
            </button>
          </form>

          {result && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #cbd5e1' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Results</h4>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: result.result === 'Parkinson' ? '#ef4444' : '#22c55e' }}>
                {result.result}
              </div>
              <p>Overall Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong></p>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>Handwriting</span><br />
                  <strong>{(result.handwriting_score * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'gray' }}>Voice</span><br />
                  <strong>{(result.voice_score * 100).toFixed(1)}%</strong>
                </div>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'gray' }}>
                ✅ Result saved to your history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Test History Progression */}
      <div className="glass-card flex flex-col" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Test History Progression</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          This chart visualizes your AI diagnostic scores over time. Lower scores indicate lower risk.
        </p>

        {historyLoading && (
          <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
        )}

        {!historyLoading && testHistory.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>
            No test history yet. Run your first diagnostic above.
          </p>
        )}

        {!historyLoading && testHistory.length > 0 && (
          <>
            <div className="chart-container" style={{ flexGrow: 1, minHeight: '300px', marginTop: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={testHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(val) => `${(val * 100).toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} name="Parkinson's Probability" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* History Table */}
            <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Result</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Confidence</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Handwriting</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Voice</th>
                  </tr>
                </thead>
                <tbody>
                  {testHistory.map((test, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem' }}>{test.date}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600, color: test.result === 'Parkinson' ? '#ef4444' : '#22c55e' }}>
                        {test.result}
                      </td>
                      <td style={{ padding: '0.5rem' }}>{(test.confidence * 100).toFixed(1)}%</td>
                      <td style={{ padding: '0.5rem' }}>{(test.handwriting_score * 100).toFixed(1)}%</td>
                      <td style={{ padding: '0.5rem' }}>{(test.voice_score * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
