import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={user ? <Navigate to={`/${user.role}Dashboard`} /> : <Login onLogin={setUser} />} />
          <Route path="/doctorDashboard/*" element={user && user.role === 'doctor' ? <DoctorDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/patientDashboard" element={user && user.role === 'patient' ? <PatientDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
