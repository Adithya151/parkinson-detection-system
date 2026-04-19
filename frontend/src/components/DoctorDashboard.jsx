import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Activity, LogOut, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function DoctorDashboard({ user, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Predict States
  const [handImage, setHandImage] = useState(null);
  const [voiceAudio, setVoiceAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch all patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('/api/patients');
        // Filter out doctors stored in the same patients collection (if any)
        const patientList = res.data.filter(p => !p.role || p.role === 'patient');
        setPatients(patientList);
      } catch (err) {
        console.error(err);
        setPatientsError('Failed to load patients. Please check the backend.');
      } finally {
        setPatientsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch test history when a patient is selected
  useEffect(() => {
    if (!selectedPatient) return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setPatientHistory([]);
      try {
        const res = await axios.get(`/api/tests/${selectedPatient.id}`);
        setPatientHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedPatient]);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!handImage || !voiceAudio) return alert("Please upload both image and audio files");

    setLoading(true);
    const formData = new FormData();
    formData.append('image', handImage);
    formData.append('audio', voiceAudio);
    if (selectedPatient) {
      formData.append('patient_id', selectedPatient.id);
    }

    try {
      const res = await axios.post('/predict', formData);
      setResult(res.data);
      // Refresh test history after new prediction is saved
      if (selectedPatient) {
        const histRes = await axios.get(`/api/tests/${selectedPatient.id}`);
        setPatientHistory(histRes.data);
      }
    } catch (err) {
      console.error(err);
      alert('Prediction failed. Make sure the backend Server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Determine status badge color based on most recent test
  const getPatientStatus = (patient) => {
    // We don't have per-patient status from DB directly, so show "—"
    return patient.status || '—';
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h2 className="title" style={{ marginBottom: 0, textAlign: 'left' }}>Doctor Portal</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}</p>
        </div>
        <button onClick={onLogout} className="btn btn-secondary">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {!selectedPatient ? (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Your Patients</h3>

          {patientsLoading && (
            <p style={{ color: 'var(--text-secondary)' }}>Loading patients...</p>
          )}

          {patientsError && (
            <p style={{ color: '#ef4444' }}>{patientsError}</p>
          )}

          {!patientsLoading && !patientsError && patients.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No registered patients found.</p>
          )}

          {!patientsLoading && patients.length > 0 && (
            <ul className="patient-list">
              {patients.map(p => (
                <li key={p.id || p.email} className="patient-item" onClick={() => setSelectedPatient(p)}>
                  <div>
                    <h4 style={{ fontWeight: 600 }}>{p.name}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Age: {p.age} | Gender: {p.gender} | Email: {p.email}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: '#dbeafe',
                      color: '#1e40af'
                    }}>
                      Patient
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex gap-6 flex-col">
          <button onClick={() => { setSelectedPatient(null); setResult(null); }} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
            <ArrowLeft size={18} /> Back to Patient List
          </button>

          <div className="grid grid-cols-2 gap-6" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Patient Profile: {selectedPatient.name}</h3>
              <p><strong>ID:</strong> {selectedPatient.id}</p>
              <p><strong>Email:</strong> {selectedPatient.email}</p>
              <p><strong>Age:</strong> {selectedPatient.age}</p>
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>

              <div className="chart-container" style={{ height: '300px' }}>
                <h4 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 600 }}>
                  Longitudinal Progression ({patientHistory.length} test{patientHistory.length !== 1 ? 's' : ''})
                </h4>

                {historyLoading && <p style={{ color: 'var(--text-secondary)' }}>Loading test history...</p>}

                {!historyLoading && patientHistory.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)' }}>No test history yet. Run the first diagnostic below.</p>
                )}

                {!historyLoading && patientHistory.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip formatter={(val) => `${(val * 100).toFixed(1)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="confidence" stroke="#3b82f6" activeDot={{ r: 8 }} name="Parkinson's Probability" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Test History Table */}
              {!historyLoading && patientHistory.length > 0 && (
                <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
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
                      {patientHistory.map((test, idx) => (
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
              )}
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Run New Test</h3>
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
                    ✅ Result saved to patient's history.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
