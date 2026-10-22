import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

const EventsPage = () => {
  const { token, attendee } = useAuth();
  const location = useLocation();

  // Task 4: Maintain three states: events, loading, and error
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Task 4: Client-side search box filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Task 2: Booking form state - at least two state values used meaningfully
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Notification if user was redirected due to role restriction
  const roleWarning = location.state?.roleError;

  // Task 4: Fetch events on mount using useEffect()
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/v1/events');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch events from server');
      }

      setEvents(data.data || []);
      // If no event selected yet, select the first available one by default
      if (data.data && data.data.length > 0 && !selectedEventId) {
        const firstAvailable = data.data.find((e) => e.ticketsAvailable > 0);
        if (firstAvailable) {
          setSelectedEventId(firstAvailable._id);
        } else {
          setSelectedEventId(data.data[0]._id);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Task 4: Client-side search filter by title without triggering new API request
  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Pre-select event from EventCard "Book" button click
  const handleSelectEventForBooking = (eventId) => {
    setSelectedEventId(eventId);
    setBookingMessage(null);
    setBookingError(null);
    // Smooth scroll to booking form
    const formElement = document.getElementById('booking-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Task 3 & 5: Handle ticket booking submission
  const handleBookTickets = async (e) => {
    e.preventDefault();
    setBookingMessage(null);
    setBookingError(null);

    if (!selectedEventId) {
      setBookingError('Please select an event to book tickets for.');
      return;
    }

    const quantityNum = Number(ticketQuantity);
    if (!quantityNum || quantityNum < 1) {
      setBookingError('Quantity must be at least 1.');
      return;
    }

    try {
      setBookingLoading(true);
      const response = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          quantity: quantityNum,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Task 5: Displays meaningful error returned by backend schema/validation
        throw new Error(result.error || 'Booking failed');
      }

      // Success
      const bookedEvent = events.find((ev) => ev._id === selectedEventId);
      const eventName = bookedEvent ? bookedEvent.title : 'Selected Event';
      setBookingMessage(
        `🎉 Successfully booked ${quantityNum} ticket(s) for "${eventName}"! Confirmation ID: ${result.data._id}`
      );

      // Decrement the event availability locally in state immediately
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === selectedEventId
            ? { ...ev, ticketsAvailable: Math.max(0, ev.ticketsAvailable - quantityNum) }
            : ev
        )
      );

      // Reset quantity to 1
      setTicketQuantity(1);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // Selected event object for form preview
  const currentlySelectedEvent = events.find((ev) => ev._id === selectedEventId);

  return (
    <div className="page-container">
      {/* Role Access Warning (from ProtectedRoute redirect) */}
      {roleWarning && (
        <div className="alert alert-warning" role="alert">
          <span className="alert-icon">🔒</span>
          <span>{roleWarning}</span>
        </div>
      )}

      {/* Page Header */}
      <section className="page-header">
        <div className="header-content">
          <h2>Upcoming Events & Ticketing</h2>
          <p>
            Welcome, <strong>{attendee?.name || attendee?.email}</strong>! Browse events,
            check live seat availability, and book tickets instantly.
          </p>
        </div>

        {/* Task 4: Search Box */}
        <div className="search-box-wrapper">
          <label htmlFor="search-events" className="sr-only">
            Search events by title
          </label>
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              id="search-events"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title..."
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Booking Form Section (Task 2 & Task 5) */}
      <section id="booking-section" className="booking-panel">
        <div className="booking-panel-header">
          <h3>🎟️ Ticket Booking Desk</h3>
          <span className="booking-tag">Direct Express API Reservation</span>
        </div>

        {bookingMessage && (
          <div className="alert alert-success" role="status">
            <span className="alert-icon">✅</span>
            <span>{bookingMessage}</span>
          </div>
        )}

        {bookingError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{bookingError}</span>
          </div>
        )}

        <form onSubmit={handleBookTickets} className="booking-form-grid">
          <div className="form-group">
            <label htmlFor="selectedEvent">Selected Event *</label>
            <select
              id="selectedEvent"
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setBookingMessage(null);
                setBookingError(null);
              }}
              className="form-control"
              required
            >
              <option value="" disabled>
                -- Choose an Event --
              </option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} ({ev.ticketsAvailable > 0 ? `${ev.ticketsAvailable} left` : 'SOLD OUT'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ticketQuantity">
              Ticket Quantity * {currentlySelectedEvent && `(Max: ${currentlySelectedEvent.ticketsAvailable})`}
            </label>
            <input
              id="ticketQuantity"
              type="number"
              min="1"
              max={currentlySelectedEvent?.ticketsAvailable || 100}
              value={ticketQuantity}
              onChange={(e) => setTicketQuantity(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group booking-action-group">
            <label className="desktop-spacer">&nbsp;</label>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={
                bookingLoading ||
                !selectedEventId ||
                (currentlySelectedEvent && currentlySelectedEvent.ticketsAvailable === 0)
              }
            >
              {bookingLoading ? (
                'Processing Reservation...'
              ) : currentlySelectedEvent?.ticketsAvailable === 0 ? (
                'Selected Event Sold Out'
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>

        {currentlySelectedEvent && (
          <div className="booking-preview-summary">
            <span>
              <strong>Venue:</strong> {currentlySelectedEvent.venue}
            </span>
            <span>
              <strong>Date:</strong> {new Date(currentlySelectedEvent.date).toLocaleDateString()}
            </span>
            <span>
              <strong>Seats Remaining:</strong> {currentlySelectedEvent.ticketsAvailable}
            </span>
          </div>
        )}
      </section>

      {/* Task 4: Loading State */}
      {loading && (
        <div className="center-loader">
          <div className="spinner" role="status" aria-label="Loading events"></div>
          <p>Fetching upcoming events from EventHub REST API...</p>
        </div>
      )}

      {/* Task 4: Error State */}
      {error && !loading && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="error-content">
            <p>
              <strong>Unable to load events:</strong> {error}
            </p>
            <button
              type="button"
              onClick={fetchEvents}
              className="btn btn-secondary btn-sm mt-2"
            >
              Retry Loading Events
            </button>
          </div>
        </div>
      )}

      {/* Task 1 & Task 4: Render Events using EventCard */}
      {!loading && !error && (
        <section className="events-grid-section">
          <div className="events-grid-header">
            <h3>
              Available Events ({filteredEvents.length} of {events.length})
            </h3>
            {searchQuery && (
              <span className="search-status">
                Filtered by "<em>{searchQuery}</em>"
              </span>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h4>No events matched your search criteria</h4>
              <p>Try searching with another keyword or clear the search query.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  title={event.title}
                  category={event.category}
                  date={event.date}
                  venue={event.venue}
                  ticketsAvailable={event.ticketsAvailable}
                  onBook={() => handleSelectEventForBooking(event._id)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default EventsPage;

