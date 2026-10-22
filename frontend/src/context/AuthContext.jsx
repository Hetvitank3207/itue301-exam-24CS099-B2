import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [attendee, setAttendee] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state from localStorage on initial load
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('eventhub_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setAttendee(parsed.attendee || null);
        setToken(parsed.token || null);
        setRole(parsed.role || (parsed.attendee && parsed.attendee.role) || 'attendee');
      }
    } catch (err) {
      console.error('Failed to parse saved auth state:', err);
      localStorage.removeItem('eventhub_auth');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken, attendeeData) => {
    const userRole = attendeeData.role || 'attendee';
    setToken(newToken);
    setAttendee(attendeeData);
    setRole(userRole);

    localStorage.setItem(
      'eventhub_auth',
      JSON.stringify({
        token: newToken,
        attendee: attendeeData,
        role: userRole,
      })
    );
  };

  const logout = () => {
    setToken(null);
    setAttendee(null);
    setRole(null);
    localStorage.removeItem('eventhub_auth');
  };

  return (
    <AuthContext.Provider value={{ attendee, token, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

