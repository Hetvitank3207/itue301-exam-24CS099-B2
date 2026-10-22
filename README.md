# EventHub - Modern Event Ticket Booking System

**Course:** ITUE301: Advanced Web Development Frameworks  
**Examination:** Open-Book Practical Examination | B.Tech. Semester 5 | AY 2026–27  
**Department:** Information Technology / Computer Engineering  
**Institute:** Chandubhai S. Patel Institute of Technology (CSPIT), CHARUSAT  
**Assigned Set:** SET F (EventHub Ticket Booking System)

---

## 📌 Project Overview
**EventHub** replaces paper-based event ticketing and spreadsheets with an end-to-end, full-stack digital ticketing platform.
- **Attendees** can browse live events, check remaining ticket availability, search events in real-time, and make instant ticket reservations.
- **Organizers** can access a dedicated, lazy-loaded control center to publish upcoming events and monitor venue capacity.
- **Role-Based Protection & Schema Constraints** guarantee that tickets cannot be oversold, ensuring strict database-level integrity.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, React Router v7, HTML5, CSS3 Modern Flexbox/Grid
- **Backend:** Express.js 5, Node.js (v24), CORS, JSON Web Tokens (`jsonwebtoken`)
- **Database & ODM:** MongoDB with Mongoose ODM (v9)
- **Tooling:** Vite, Nodemon, dotenv

---

## 📁 Repository Structure
```text
EventHub/
├── backend/
│   ├── models/
│   │   ├── Attendee.js       # Attendee Mongoose Schema (name, email, role, phone)
│   │   ├── Event.js          # Event Mongoose Schema (title, category, date, venue, ticketsAvailable min 0)
│   │   └── Ticket.js         # Ticket Mongoose Schema (attendeeId ref, eventId ref, quantity min 1, status enum)
│   ├── .env                  # Local Environment secrets (ignored in Git)
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Express dependencies & scripts (npm start / npm run dev)
│   └── server.js             # Express REST API, custom requestLogger, authGuard, and Error Handler
├── frontend/
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.jsx       # Task 1: Reusable event card with sold-out conditional badge
│   │   │   ├── Navbar.jsx          # Task 2: SPA navigation links without page reloads
│   │   │   └── ProtectedRoute.jsx  # Task 2: Token check & role-based route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Task 2: Global auth state holding { attendee, token, role }
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Task 1 & 2: Authentication page with quick demo presets
│   │   │   ├── EventsPage.jsx      # Task 1, 2 & 4: Live event directory, client-side search & booking desk
│   │   │   ├── MyTicketsPage.jsx   # Task 1 & 3: Attendee reservations with populated event data
│   │   │   └── OrganizerPanel.jsx  # Task 2: Lazy-loaded panel (React.lazy + Suspense) for organizers
│   │   ├── App.jsx                 # Task 2: Client-side routing configuration
│   │   ├── index.css               # Clean, accessible styling & animations
│   │   └── main.jsx                # Application root entry
│   ├── index.html
│   ├── package.json
│   └── vite.config.js              # Vite server & API proxy config
├── .gitignore                      # Git ignore rule ensuring node_modules and .env are excluded
└── README.md                       # Comprehensive project documentation
```

---

## 🚀 Setup & Execution Instructions

### Prerequisites
1. **Node.js** (v18 or higher recommended; developed on Node.js v24)
2. **MongoDB** (Local instance running at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)

### 1. Backend Setup
1. Navigate into the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Default `.env` configuration:*
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/eventhub
   JWT_SECRET=eventhub_super_secret_jwt_key_2026
   ```
4. Start the Express server:
   ```bash
   npm start
   # or
   node server.js
   ```
   *The backend will automatically connect to MongoDB, seed default sample events (including a sold-out event for demonstration), and listen at `http://localhost:5000`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if needed):
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the browser at the URL shown (e.g. `http://localhost:5173` or `http://localhost:5174`).

---

## 🎯 Task Implementation Breakdown

### Task 1: React Component Architecture (4 Marks)
- **Pages & Components Created:**
  - `LoginPage.jsx`: Interactive sign-in page with pre-filled demo shortcuts for rapid viva demonstration.
  - `EventsPage.jsx`: Displays upcoming events fetched dynamically via REST API.
  - `MyTicketsPage.jsx`: Displays attendee's booked reservations with cancellation capability.
  - `EventCard.jsx`: Reusable card placed in `src/components/EventCard.jsx`.
- **Props Accepted by `EventCard`:**
  - `title`: Event title (e.g. "Cognizance 2026: Annual Tech Symposium")
  - `category`: Category tag (e.g. "Technology", "Workshop", "Cultural")
  - `date`: Formatted event date/time
  - `venue`: Physical venue location
  - `ticketsAvailable`: Remaining capacity count
- **Sold Out Handling:**
  - Evaluated with a simple conditional at the top of `EventCard`:
    ```javascript
    const isSoldOut = ticketsAvailable === 0;
    ```
  - When `ticketsAvailable === 0`, renders a `<span className="badge badge-sold-out">Sold Out</span>` and disables the booking trigger; otherwise renders an active `"Book Tickets"` button.

### Task 2: React Routing and State Management (4 Marks)
- **Configured Routes (`App.jsx`):**
  | Route | Component | Access |
  |---|---|---|
  | `/` | `LoginPage` | Public |
  | `/events` | `EventsPage` | Protected (Token required) |
  | `/my-tickets` | `MyTicketsPage` | Protected (Token required) |
  | `/organizer` | `OrganizerPanel` | Protected (Role `'organizer'` required) + Lazy Loaded |
- **Navigation Component (`Navbar.jsx`):**
  - Uses React Router `NavLink` elements without full-page reloads.
  - Highlights the active route and shows current user role badge.
- **Global Auth State (`AuthContext.jsx`):**
  - Manages `{ attendee, token, role }` state and persists session to `localStorage`.
- **Role Guard in `ProtectedRoute.jsx`:**
  - If `token` is missing: redirects to `/` (LoginPage).
  - If user role does not match required role (e.g. an `attendee` attempts to access `/organizer`): redirects to `/events` with a descriptive message rather than logging out the user.

### Task 3: Express REST API + Middleware (4 Marks)
- **REST Endpoints Exposed at `/api/v1/`:**
  1. `POST /api/v1/auth/login` (Public): Issues JWT token with payload `{ id, email, role, name }`.
  2. `GET /api/v1/events` (Public): Retrieves all events sorted by date.
  3. `POST /api/v1/tickets` (Protected): Validates ticket availability, creates a reservation, and atomically decrements `ticketsAvailable` on the event.
  4. `GET /api/v1/tickets/my` (Protected): Retrieves tickets belonging to the logged-in attendee, populated with attendee and event details.
  5. `PATCH /api/v1/tickets/:id/status` (Protected): Updates reservation status (`booked`, `cancelled`, `used`). Restores event tickets if a booking is cancelled.
  6. `POST /api/v1/events` (Protected, Organizer/Admin): Publishes a new event.
  7. `POST /api/v1/seed` (Utility): Resets and seeds sample test data.
- **Custom `requestLogger` Middleware:**
  - Globally logs each request in exact format: `[METHOD] [PATH] [TIMESTAMP]`
  - Example: `[POST] [/api/v1/tickets] [2026-10-22T04:38:28.027Z]`
- **Custom `authGuard` Middleware:**
  - Extracts `Bearer <token>` from the `Authorization` header.
  - Returns `401 Unauthorized` structured JSON if the token is absent or invalid.
- **Global Error Handler:**
  - Registered as the last Express middleware.
  - Intercepts Mongoose `ValidationError`, `CastError`, and duplicate keys, returning clean JSON (`{ success: false, error: "..." }`) rather than leaking server stack traces.

### Task 4: REST API Consumption in React (4 Marks)
- In `EventsPage.jsx`:
  - Retrieves live event data from `GET /api/v1/events` via `fetch()`.
  - Triggered on mount inside `useEffect()`.
  - Maintains three discrete states:
    - `events`: Array of event objects from the backend.
    - `loading`: Boolean state displaying an interactive loading spinner during network transit.
    - `error`: Stores API failure details with a 1-click retry mechanism.
  - Renders events using the `EventCard` component.
- **Client-Side Real-Time Search Box:**
  - Allows searching by title without dispatching subsequent network requests.
  - Uses `events.filter(...)` derived dynamically on render:
    ```javascript
    const filteredEvents = events.filter((ev) =>
      ev.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
    ```

### Task 5: MongoDB + Mongoose Schema Design and Validation (4 Marks)
- **Schemas Implemented:**
  1. `Attendee`:
     - `name`: String, required, trimmed
     - `email`: String, required, unique, regex validated
     - `phone`: String, trimmed
     - `role`: String, enum: `['attendee', 'organizer', 'admin']`, default: `'attendee'`
  2. `Event`:
     - `title`: String, required, trimmed
     - `category`: String, default: `'General'`
     - `date`: Date, required
     - `venue`: String, required, trimmed
     - `ticketsAvailable`: Number, required, `min: [0, 'Tickets available cannot be negative']`
  3. `Ticket`:
     - `attendeeId`: `ObjectId`, ref: `'Attendee'`, required
     - `eventId`: `ObjectId`, ref: `'Event'`, required
     - `quantity`: Number, required, `min: [1, 'Quantity must be at least 1']`
     - `bookingDate`: Date, default: `Date.now`
     - `status`: String, enum: `['booked', 'cancelled', 'used']`, default: `'booked'`
- **Population Requirement:**
  - `GET /api/v1/tickets/my` executes:
    ```javascript
    Ticket.find({ attendeeId: req.user.id })
      .populate('attendeeId', 'name email')
      .populate('eventId', 'title date venue')
      .sort({ bookingDate: -1 });
    ```
- **Overbooking & Validation Protection:**
  - `POST /api/v1/tickets` fetches the event with `findById`.
  - Checks if `event.ticketsAvailable < requestedQuantity`.
  - If insufficient, immediately returns HTTP `400 Bad Request` with message:
    `"Insufficient tickets available. Requested: X, Available: Y"`.
  - When valid, executes `findByIdAndUpdate` with `$inc: { ticketsAvailable: -quantity }` and creates the `Ticket`.

---

## 🧪 Postman & cURL Verification Guide

### 1. User Login / Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"attendee@charusat.edu.in","name":"Hetvi Patel","role":"attendee"}'
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "<JWT_BEARER_TOKEN>",
  "attendee": {
    "id": "6ad9932aa7da7ac432111a5c",
    "name": "Hetvi Patel",
    "email": "attendee@charusat.edu.in",
    "role": "attendee"
  }
}
```

### 2. Fetch Public Events
```bash
curl -X GET http://localhost:5000/api/v1/events
```

### 3. Book Tickets (Successful 201 Created)
```bash
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_BEARER_TOKEN>" \
  -d '{"eventId":"6ad9930da7da7ac432111a57","quantity":2}'
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Ticket booked successfully",
  "data": {
    "_id": "6ad99344a7da7ac432111a5d",
    "attendeeId": {
      "_id": "6ad9932aa7da7ac432111a5c",
      "name": "Hetvi Patel",
      "email": "attendee@charusat.edu.in"
    },
    "eventId": {
      "_id": "6ad9930da7da7ac432111a57",
      "title": "Cognizance 2026: Annual Tech Symposium",
      "date": "2026-09-15T09:30:00.000Z",
      "venue": "CSPIT Auditorium, CHARUSAT"
    },
    "quantity": 2,
    "status": "booked"
  },
  "remainingTickets": 118
}
```

### 4. Overbooking Validation Failure (400 Bad Request)
```bash
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_BEARER_TOKEN>" \
  -d '{"eventId":"<SOLD_OUT_EVENT_ID>","quantity":1}'
```
**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Insufficient tickets available. Requested: 1, Available: 0"
}
```

---

## 📋 Viva Discussion Points
- **Q: Why use `React.lazy()` and `Suspense` for the Organizer Panel?**  
  *A:* Lazy loading defers loading the JavaScript bundle for the organizer features until an authorized organizer navigates to `/organizer`. This reduces the initial bundle size for regular attendees and speeds up the Largest Contentful Paint (LCP).
- **Q: How does `ProtectedRoute` differentiate role mismatch from missing auth?**  
  *A:* If the user has no token, they are redirected to `/` (LoginPage). If they are logged in but lack the `'organizer'` role, they are redirected to `/events` with a state notice, keeping their session intact.
- **Q: How does the application prevent race conditions and negative inventory?**  
  *A:* The backend queries the current availability using `findById()`, validates that `ticketsAvailable >= quantity`, and updates the event inventory atomically using MongoDB's `$inc` operator (`{ $inc: { ticketsAvailable: -quantity } }`), backed by Mongoose schema min constraints (`min: [0]`).

