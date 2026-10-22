import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { attendee, token, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink to={token ? '/events' : '/'} className="navbar-brand">
          <span className="brand-icon">🎫</span>
          <span className="brand-name">EventHub</span>
        </NavLink>

        <nav className="navbar-links" aria-label="Main Navigation">
          {!token && (
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              end
            >
              Login
            </NavLink>
          )}

          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Events
          </NavLink>

          <NavLink
            to="/my-tickets"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            My Tickets
          </NavLink>

          <NavLink
            to="/organizer"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-special active' : 'nav-link nav-link-special'
            }
          >
            Organizer Panel
          </NavLink>
        </nav>

        <div className="navbar-user-actions">
          {token && attendee ? (
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{attendee.name || attendee.email}</span>
                <span className={`user-role-badge role-${role}`}>{role}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/" className="btn btn-primary btn-sm">
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

