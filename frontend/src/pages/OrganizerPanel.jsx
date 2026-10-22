import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const OrganizerPanel = () => {
  const { token, attendee } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for creating a new event
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [ticketsAvailable, setTicketsAvailable] = useState(50);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/events');
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch events');
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);

    if (!title || !date || !venue || ticketsAvailable === '') {
      setFormError('Please fill in all required fields (title, date, venue, tickets available).');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await fetch('/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category,
          date,
          venue,
          ticketsAvailable: Number(ticketsAvailable),
          description,
          price: Number(price),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create event');
      }

      setFormSuccess(`Event "${data.data.title}" successfully created!`);
      // Reset form
      setTitle('');
      setDate('');
      setVenue('');
      setTicketsAvailable(50);
      setDescription('');
      setPrice(0);
      // Refresh event list
      fetchEvents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <section className="page-header">
        <div className="header-content">
          <h2>Organizer Control Center</h2>
          <p>
            Logged in as Organizer: <strong>{attendee?.name || attendee?.email}</strong>.
            Manage event listings, configure venue allocations, and monitor live ticket capacity.
          </p>
        </div>
        <span className="badge badge-organizer">Role: Organizer</span>
      </section>

      <div className="organizer-grid">
        {/* Event Creation Form */}
        <section className="organizer-form-card">
          <div className="card-header">
            <h3>➕ Publish New Event</h3>
            <p className="card-subtitle">Broadcast a new event to the EventHub directory</p>
          </div>

          {formSuccess && (
            <div className="alert alert-success" role="status">
              <span className="alert-icon">✅</span>
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="organizer-form">
            <div className="form-group">
              <label htmlFor="event-title">Event Title *</label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Web Dev Hackathon 2026"
                required
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-category">Category</label>
                <select
                  id="event-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="Technology">Technology</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Academic">Academic</option>
                  <option value="Business">Business</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="event-date">Date & Time *</label>
                <input
                  id="event-date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-venue">Venue / Location *</label>
              <input
                id="event-venue"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Auditorium A, CSPIT Campus"
                required
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event-capacity">Total Ticket Capacity *</label>
                <input
                  id="event-capacity"
                  type="number"
                  min="0"
                  value={ticketsAvailable}
                  onChange={(e) => setTicketsAvailable(e.target.value)}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-price">Ticket Price (₹)</label>
                <input
                  id="event-price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="event-description">Event Description</label>
              <textarea
                id="event-description"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief summary of the event activities and targets..."
                className="form-control"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Publishing Event...' : 'Publish Event to Directory'}
            </button>
          </form>
        </section>

        {/* Existing Events Inventory Overview */}
        <section className="organizer-inventory-card">
          <div className="card-header">
            <h3>📊 Platform Inventory Overview</h3>
            <p className="card-subtitle">Real-time capacity tracking across all managed events</p>
          </div>

          {loading ? (
            <div className="center-loader">
              <div className="spinner" role="status"></div>
              <p>Loading inventory...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Seats Available</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev._id}>
                      <td className="font-semibold">{ev.title}</td>
                      <td>
                        <span className="category-pill">{ev.category}</span>
                      </td>
                      <td>{new Date(ev.date).toLocaleDateString()}</td>
                      <td>
                        <strong>{ev.ticketsAvailable}</strong>
                      </td>
                      <td>
                        {ev.ticketsAvailable === 0 ? (
                          <span className="badge badge-sold-out">Sold Out</span>
                        ) : (
                          <span className="badge badge-available">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrganizerPanel;
