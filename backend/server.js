require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const Attendee = require('./models/Attendee');
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventhub';
const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026';

// ----------------------------------------------------
// Global Middleware
// ----------------------------------------------------
app.use(cors());
app.use(express.json());

// Custom requestLogger middleware: [METHOD] [PATH] [TIMESTAMP]
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${req.method}] [${req.originalUrl || req.url}] [${timestamp}]`);
  next();
};
app.use(requestLogger);

// ----------------------------------------------------
// Custom Authentication Guard Middleware
// ----------------------------------------------------
const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Missing or malformed authorization token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authorization token.',
    });
  }
};

// Optional role-checking helper middleware
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
};

// ----------------------------------------------------
// REST API Endpoints (/api/v1/...)
// ----------------------------------------------------

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate attendee, issue token
 * @access  Public
 */
app.post('/api/v1/auth/login', async (req, res, next) => {
  try {
    const { email, name, role, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required for authentication.',
      });
    }

    // Find existing attendee or create new one
    let attendee = await Attendee.findOne({ email: email.toLowerCase().trim() });

    if (!attendee) {
      attendee = await Attendee.create({
        name: name ? name.trim() : email.split('@')[0],
        email: email.toLowerCase().trim(),
        phone: phone || '',
        role: role || 'attendee',
      });
    } else if (role && attendee.role !== role) {
      // If user switches role on the login screen for testing/demo
      attendee.role = role;
      await attendee.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: attendee._id,
        email: attendee.email,
        name: attendee.name,
        role: attendee.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      attendee: {
        id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone,
        role: attendee.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/events
 * @desc    Return all events (public)
 * @access  Public
 */
app.get('/api/v1/events', async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/events
 * @desc    Create a new event (organizer/admin)
 * @access  Protected
 */
app.post('/api/v1/events', authGuard, roleGuard('organizer', 'admin'), async (req, res, next) => {
  try {
    const { title, category, date, venue, ticketsAvailable, description, price } = req.body;

    const event = await Event.create({
      title,
      category: category || 'General',
      date,
      venue,
      ticketsAvailable: Number(ticketsAvailable),
      description,
      price: price ? Number(price) : 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/tickets
 * @desc    Book tickets for an event (protected)
 *          Validates ticketsAvailable >= quantity, decrements ticketsAvailable
 * @access  Protected (authGuard)
 */
app.post('/api/v1/tickets', authGuard, async (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required to book a ticket.',
      });
    }

    if (!requestedQuantity || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1.',
      });
    }

    // Step 1: Check availability with findById
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found with provided ID.',
      });
    }

    // Step 2: Validate ticketsAvailable >= quantity (return 400 if not)
    if (event.ticketsAvailable < requestedQuantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient tickets available. Requested: ${requestedQuantity}, Available: ${event.ticketsAvailable}`,
      });
    }

    // Step 3: Decrement event ticketsAvailable
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { ticketsAvailable: -requestedQuantity } },
      { returnDocument: 'after', runValidators: true }
    );

    // Step 4: Create Ticket
    const ticket = await Ticket.create({
      attendeeId: req.user.id,
      eventId: event._id,
      quantity: requestedQuantity,
      bookingDate: new Date(),
      status: 'booked',
    });

    // Populate for complete response
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('attendeeId', 'name email')
      .populate('eventId', 'title date venue');

    return res.status(201).json({
      success: true,
      message: 'Ticket booked successfully',
      data: populatedTicket,
      remainingTickets: updatedEvent.ticketsAvailable,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/tickets/my
 * @desc    Return the attendee's own tickets (protected)
 *          Uses .populate('attendeeId', 'name email') and .populate('eventId', 'title date venue')
 * @access  Protected (authGuard)
 */
app.get('/api/v1/tickets/my', authGuard, async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ attendeeId: req.user.id })
      .populate('attendeeId', 'name email')
      .populate('eventId', 'title date venue')
      .sort({ bookingDate: -1 });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/v1/tickets/:id/status
 * @desc    Update ticket status (protected)
 * @access  Protected (authGuard)
 */
app.patch('/api/v1/tickets/:id/status', authGuard, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['booked', 'cancelled', 'used'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found.',
      });
    }

    // Ensure attendee owns the ticket or is organizer/admin
    if (ticket.attendeeId.toString() !== req.user.id && req.user.role === 'attendee') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You can only update your own tickets.',
      });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    // If ticket was booked and is now cancelled, replenish ticketsAvailable on the Event
    if (oldStatus === 'booked' && status === 'cancelled') {
      await Event.findByIdAndUpdate(ticket.eventId, {
        $inc: { ticketsAvailable: ticket.quantity },
      });
    }

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('attendeeId', 'name email')
      .populate('eventId', 'title date venue');

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/seed
 * @desc    Seed sample attendees and events for quick demonstration
 * @access  Public
 */
app.post('/api/v1/seed', async (req, res, next) => {
  try {
    // Upsert demo attendees
    const demoAttendee = await Attendee.findOneAndUpdate(
      { email: 'attendee@charusat.edu.in' },
      {
        name: 'Hetvi Patel',
        email: 'attendee@charusat.edu.in',
        phone: '+91 9876543210',
        role: 'attendee',
      },
      { upsert: true, returnDocument: 'after' }
    );

    const demoOrganizer = await Attendee.findOneAndUpdate(
      { email: 'organizer@charusat.edu.in' },
      {
        name: 'Prof. Sharma (CSPIT)',
        email: 'organizer@charusat.edu.in',
        phone: '+91 9123456780',
        role: 'organizer',
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Initial events sample
    const sampleEvents = [
      {
        title: 'Cognizance 2026: Annual Tech Symposium',
        category: 'Technology',
        date: new Date('2026-09-15T09:30:00Z'),
        venue: 'CSPIT Auditorium, CHARUSAT',
        ticketsAvailable: 120,
        description: 'Flagship national-level technical symposium with hackathons and workshops.',
        price: 150,
      },
      {
        title: 'AI & Deep Learning Hands-on Bootcamp',
        category: 'Workshop',
        date: new Date('2026-09-22T10:00:00Z'),
        venue: 'Lab 401, IT Department, CSPIT',
        ticketsAvailable: 35,
        description: 'Intensive 2-day hands-on workshop covering PyTorch, Transformers, and GenAI.',
        price: 250,
      },
      {
        title: 'Spoural: Inter-College Cultural Fest',
        category: 'Cultural',
        date: new Date('2026-10-05T18:00:00Z'),
        venue: 'CHARUSAT Central Ground',
        ticketsAvailable: 300,
        description: 'Music, dance, fashion show, and celebrity performances.',
        price: 200,
      },
      {
        title: 'Full-Stack Web Dev Masterclass (MERN)',
        category: 'Academic',
        date: new Date('2026-10-12T11:00:00Z'),
        venue: 'Seminar Hall 2, CE Department',
        ticketsAvailable: 0, // Demonstrates SOLD OUT badge in EventCard
        description: 'Advanced patterns in React 19, Express, Mongoose, and microservices.',
        price: 100,
      },
      {
        title: 'CHARUSAT Startup Pitch & Investor Gala',
        category: 'Business',
        date: new Date('2026-11-01T14:00:00Z'),
        venue: 'Innovation & Incubation Center',
        ticketsAvailable: 15,
        description: 'Present your startup idea to angel investors and seed venture capitals.',
        price: 0,
      },
    ];

    await Event.deleteMany({});
    const createdEvents = await Event.insertMany(sampleEvents);

    return res.status(201).json({
      success: true,
      message: 'Sample data seeded successfully',
      attendees: [demoAttendee, demoOrganizer],
      eventsCount: createdEvents.length,
      events: createdEvents,
    });
  } catch (error) {
    next(error);
  }
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    project: 'EventHub Ticket Booking System API',
    version: '1.0.0',
    documentation: '/api/v1/',
    status: 'online',
  });
});

// ----------------------------------------------------
// Global Error-Handling Middleware
// ----------------------------------------------------
// Must be registered as the LAST middleware, returning structured JSON
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]:', err);

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
      type: 'ValidationError',
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource identifier: ${err.value}`,
      type: 'CastError',
    });
  }

  // Handle Mongo Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      error: `Duplicate value entered for ${field}. Please use another value.`,
      type: 'DuplicateKeyError',
    });
  }

  // Fallback to generic 500 error
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ----------------------------------------------------
// Database Connection & Server Initialization
// ----------------------------------------------------
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`[DATABASE] Connected to MongoDB successfully at ${MONGO_URI}`);

    // Auto-seed sample events if database is empty
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('[DATABASE] No events found. Auto-seeding initial events...');
      await Event.insertMany([
        {
          title: 'Cognizance 2026: Annual Tech Symposium',
          category: 'Technology',
          date: new Date('2026-09-15T09:30:00Z'),
          venue: 'CSPIT Auditorium, CHARUSAT',
          ticketsAvailable: 120,
          description: 'Flagship national-level technical symposium with hackathons and workshops.',
          price: 150,
        },
        {
          title: 'AI & Deep Learning Hands-on Bootcamp',
          category: 'Workshop',
          date: new Date('2026-09-22T10:00:00Z'),
          venue: 'Lab 401, IT Department, CSPIT',
          ticketsAvailable: 35,
          description: 'Intensive 2-day hands-on workshop covering PyTorch, Transformers, and GenAI.',
          price: 250,
        },
        {
          title: 'Spoural: Inter-College Cultural Fest',
          category: 'Cultural',
          date: new Date('2026-10-05T18:00:00Z'),
          venue: 'CHARUSAT Central Ground',
          ticketsAvailable: 300,
          description: 'Music, dance, fashion show, and celebrity performances.',
          price: 200,
        },
        {
          title: 'Full-Stack Web Dev Masterclass (MERN)',
          category: 'Academic',
          date: new Date('2026-10-12T11:00:00Z'),
          venue: 'Seminar Hall 2, CE Department',
          ticketsAvailable: 0, // Demonstrates SOLD OUT badge
          description: 'Advanced patterns in React 19, Express, Mongoose, and microservices.',
          price: 100,
        },
        {
          title: 'CHARUSAT Startup Pitch & Investor Gala',
          category: 'Business',
          date: new Date('2026-11-01T14:00:00Z'),
          venue: 'Innovation & Incubation Center',
          ticketsAvailable: 15,
          description: 'Present your startup idea to angel investors and seed venture capitals.',
          price: 0,
        },
      ]);
      console.log('[DATABASE] Seeded 5 initial events successfully.');
    }

    app.listen(PORT, () => {
      console.log(`[SERVER] EventHub backend running on http://localhost:${PORT}`);
      console.log(`[SERVER] API Endpoints available at http://localhost:${PORT}/api/v1/`);
    });
  })
  .catch((err) => {
    console.error('[DATABASE] MongoDB connection error:', err.message);
  });
