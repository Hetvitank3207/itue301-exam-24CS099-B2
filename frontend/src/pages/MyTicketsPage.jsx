import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MyTicketsPage = () => {
  const { token, attendee } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/tickets/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      setTickets(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyTickets();
    }
  }, [token]);

  // Cancel a ticket using PATCH /api/v1/tickets/:id/status
  const handleCancelTicket = async (ticketId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this ticket booking? Your reserved seats will be released.'
    );
    if (!confirmCancel) return;

    try {
      setActionMessage(null);
      const response = await fetch(`/api/v1/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel ticket');
      }

      setActionMessage('Ticket has been successfully cancelled.');
      // Update ticket status in state
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: 'cancelled' } : t))
      );
    } catch (err) {
      alert(`Error cancelling ticket: ${err.message}`);
    }
  };

  return (
    <div className="page-container">
      <section className="page-header">
        <div className="header-content">
          <h2>My Booked Tickets</h2>
          <p>
            Review all event reservations booked under <strong>{attendee?.email}</strong>.
          </p>
        </div>
        <Link to="/events" className="btn btn-secondary">
          ← Browse More Events
        </Link>
      </section>

      {actionMessage && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon">ℹ️</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {loading && (
        <div className="center-loader">
          <div className="spinner" role="status" aria-label="Loading your tickets"></div>
          <p>Loading your event reservations...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="error-content">
            <p>
              <strong>Error fetching tickets:</strong> {error}
            </p>
            <button
              type="button"
              onClick={fetchMyTickets}
              className="btn btn-secondary btn-sm mt-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🎟️</span>
          <h3>No Tickets Booked Yet</h3>
          <p>You have not made any event reservations yet.</p>
          <Link to="/events" className="btn btn-primary mt-3">
            Explore Events & Book Now
          </Link>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="tickets-list">
          {tickets.map((ticket) => {
            const event = ticket.eventId || {};
            const isCancelled = ticket.status === 'cancelled';
            const isUsed = ticket.status === 'used';

            return (
              <div
                key={ticket._id}
                className={`ticket-card status-${ticket.status}`}
              >
                <div className="ticket-card-badge-row">
                  <span className={`status-badge badge-${ticket.status}`}>
                    {ticket.status.toUpperCase()}
                  </span>
                  <span className="ticket-id">Ticket ID: {ticket._id}</span>
                </div>

                <div className="ticket-body">
                  <h3 className="ticket-event-title">
                    {event.title || 'Event Details Unavailable'}
                  </h3>

                  <div className="ticket-info-grid">
                    <div className="ticket-info-col">
                      <span className="label">📅 Event Date:</span>
                      <span className="value">
                        {event.date
                          ? new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'TBA'}
                      </span>
                    </div>

                    <div className="ticket-info-col">
                      <span className="label">📍 Venue:</span>
                      <span className="value">{event.venue || 'TBA'}</span>
                    </div>

                    <div className="ticket-info-col">
                      <span className="label">🎟️ Quantity:</span>
                      <span className="value highlight">
                        {ticket.quantity} Pass{ticket.quantity > 1 ? 'es' : ''}
                      </span>
                    </div>

                    <div className="ticket-info-col">
                      <span className="label">🕒 Booked On:</span>
                      <span className="value">
                        {ticket.bookingDate
                          ? new Date(ticket.bookingDate).toLocaleString()
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="ticket-info-col">
                      <span className="label">👤 Attendee:</span>
                      <span className="value">
                        {ticket.attendeeId?.name || attendee?.name} ({ticket.attendeeId?.email || attendee?.email})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ticket-actions">
                  {ticket.status === 'booked' && (
                    <button
                      type="button"
                      onClick={() => handleCancelTicket(ticket._id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Cancel Reservation
                    </button>
                  )}
                  {isCancelled && (
                    <span className="text-muted text-sm">
                      Reservation was cancelled
                    </span>
                  )}
                  {isUsed && (
                    <span className="text-success text-sm">
                      Ticket verified & admitted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
