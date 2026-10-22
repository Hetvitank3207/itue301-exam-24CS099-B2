import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import MyTicketsPage from './pages/MyTicketsPage';

// Task 2: Lazy-loaded route for Organizer Panel using React.lazy + Suspense
const OrganizerPanel = lazy(() => import('./pages/OrganizerPanel'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-shell">
          {/* Navigation Component */}
          <Navbar />

          <main className="main-content">
            <Routes>
              {/* Public Route: Login */}
              <Route path="/" element={<LoginPage />} />

              {/* Protected Route: Events Page */}
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Route: My Tickets */}
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <MyTicketsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected & Lazy-Loaded Route: Organizer Panel (requires role 'organizer') */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute requiredRole="organizer">
                    <Suspense
                      fallback={
                        <div className="center-loader">
                          <div className="spinner" role="status" aria-label="Loading Organizer Panel"></div>
                          <p>Lazy-loading Organizer Control Center...</p>
                        </div>
                      }
                    >
                      <OrganizerPanel />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="footer">
            <div className="footer-content">
              <p>
                <strong>EventHub Ticket Booking System</strong> · CSPIT, CHARUSAT · ITUE301 Advanced Web Development Frameworks
              </p>
              <p className="footer-meta">
                MERN Stack Implementation: React 19 + Express.js 5 + MongoDB Mongoose
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

