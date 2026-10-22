import React from 'react';

/**
 * Task 1: Reusable EventCard component
 * Props: title, category, date, venue, ticketsAvailable, onBook
 */
const EventCard = ({ title, category, date, venue, ticketsAvailable, onBook }) => {
  // Sold-out check as a simple conditional
  const isSoldOut = ticketsAvailable === 0;

  // Format date nicely
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date TBA';

  return (
    <div className={`event-card ${isSoldOut ? 'event-card-sold-out' : ''}`}>
      <div className="event-card-header">
        <span className="event-category-badge">{category || 'General'}</span>
        {isSoldOut ? (
          <span className="badge badge-sold-out">Sold Out</span>
        ) : (
          <span className="badge badge-available">
            {ticketsAvailable} ticket{ticketsAvailable > 1 ? 's' : ''} left
          </span>
        )}
      </div>

      <h3 className="event-title">{title}</h3>

      <div className="event-details">
        <div className="event-detail-item">
          <span className="detail-icon" aria-hidden="true">📅</span>
          <span className="detail-text">{formattedDate}</span>
        </div>

        <div className="event-detail-item">
          <span className="detail-icon" aria-hidden="true">📍</span>
          <span className="detail-text">{venue}</span>
        </div>

        <div className="event-detail-item">
          <span className="detail-icon" aria-hidden="true">🎟️</span>
          <span className="detail-text">
            <strong>Availability:</strong> {ticketsAvailable} tickets
          </span>
        </div>
      </div>

      <div className="event-card-footer">
        {isSoldOut ? (
          <button className="btn btn-sold-out" disabled aria-disabled="true">
            Sold Out
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-book"
            onClick={() => onBook && onBook()}
          >
            Book Tickets
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;

