import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('attendee');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectPath = location.state?.from?.pathname || '/events';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, role, phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.attendee);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick helper buttons for viva/evaluation demonstrations
  const handleQuickLogin = (demoEmail, demoName, demoRole) => {
    setEmail(demoEmail);
    setName(demoName);
    setRole(demoRole);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">🎟️</div>
          <h2>Welcome to EventHub</h2>
          <p className="subtitle">
            CSPIT CHARUSAT · ITUE301 Advanced Web Development Frameworks
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. attendee@charusat.edu.in"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hetvi Patel"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Select Role *</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="form-control"
            >
              <option value="attendee">Attendee (Browse & Book Tickets)</option>
              <option value="organizer">Organizer (Manage & Create Events)</option>
              <option value="admin">Admin (Oversee Platform)</option>
            </select>
            <small className="help-text">
              Choose 'Organizer' to test the lazy-loaded Organizer Panel route.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In / Register'}
          </button>
        </form>

        <div className="demo-credentials">
          <p className="demo-title">⚡ Quick Viva Demo Presets:</p>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleQuickLogin(
                  'attendee@charusat.edu.in',
                  'Hetvi Patel',
                  'attendee'
                )
              }
            >
              Attendee Preset
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                handleQuickLogin(
                  'organizer@charusat.edu.in',
                  'Prof. Sharma (CSPIT)',
                  'organizer'
                )
              }
            >
              Organizer Preset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
