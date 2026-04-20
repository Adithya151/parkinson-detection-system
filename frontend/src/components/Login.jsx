import React, { useState } from 'react';
import { Activity, UserRound, Stethoscope } from 'lucide-react';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('patient');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testPassword = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Password must contain one uppercase letter.";
    if (!/[\W_]/.test(pass)) return "Password must contain one special character.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering && role === 'patient') {
      const passError = testPassword(password);
      if (passError) return setError(passError);
      if (!name || !age || !gender || !email || !password) return setError("Please fill all fields.");
      
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, age: parseInt(age), gender, password })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Registered successfully! You can now login.');
          setIsRegistering(false);
          setPassword('');
        } else {
          setError(data.detail || "Registration failed");
        }
      } catch (err) {
        setError("Network error. Is the backend running?");
      }
      setLoading(false);
      
    } else {
      if (!email || !password) return setError("Please enter email and password.");
      
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role })
        });
        const data = await response.json();
        
        if (response.ok) {
          onLogin({
            id: data.id,
            role: data.role,
            name: data.name
          });
        } else {
          setError(data.detail || "Login failed");
        }
      } catch (err) {
        setError("Network error. Is the backend running?");
      }
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-card fade-in" style={{ maxWidth: '450px', width: '100%', padding: '2rem' }}>
        <div className="flex flex-col items-center mb-6">
          <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.2)' }}>
            <Activity color="#0284c7" size={36} />
          </div>
          <h1 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem', textAlign: 'center' }}>Parkinson's AI System</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            {isRegistering ? 'Create a patient account' : 'Welcome back! Please login.'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex gap-4 mb-2">
            <button 
              type="button"
              className={`btn ${role === 'patient' ? '' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => { setRole('patient'); setError(''); }}
            >
              <UserRound size={18} /> Patient
            </button>
            <button 
              type="button"
              className={`btn ${role === 'doctor' ? '' : 'btn-secondary'}`}
              style={{ flex: 1, opacity: isRegistering ? 0.5 : 1 }}
              onClick={() => { setRole('doctor'); setIsRegistering(false); setError(''); }}
            >
              <Stethoscope size={18} /> Doctor
            </button>
          </div>

          {isRegistering && role === 'patient' && (
            <>
              <div>
                <label className="label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label className="label">Age</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="65"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Gender</label>
                  <select 
                    className="input-field" 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ backgroundColor: 'white' }}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder={`Enter your ${role} email`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {isRegistering && (
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                Min 8 characters, 1 uppercase, 1 special character.
              </small>
            )}
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isRegistering ? 'Register Account' : 'Login Securely')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          {role === 'patient' && (
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              {isRegistering ? 'Already have an account? Login here' : "Don't have an account? Register here"}
            </button>
          )}
          {role === 'doctor' && (
             <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Doctors are provided accounts by administration.
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
