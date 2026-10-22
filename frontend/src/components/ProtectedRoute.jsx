import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Task 2: ProtectedRoute Component
 * - If not authenticated (no token), redirect to '/' (LoginPage)
 * - If role does not match requiredRole, redirect to '/events' (without logging out)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { token, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="center-loader">
        <div className="spinner" role="status" aria-label="Loading authentication"></div>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  // Case 1: Missing authentication token -> redirect to LoginPage ('/')
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Case 2: Role check fails -> redirect to '/events' instead of logging out
  if (requiredRole && role !== requiredRole) {
    return (
      <Navigate
        to="/events"
        state={{ roleError: `Access denied. Requires '${requiredRole}' role, current role is '${role}'.` }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;

