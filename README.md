# CampusRent — Final v12 (MongoDB)

This is the cumulative final v12 project. It keeps the earlier work, includes
US-13, and stores application data in MongoDB through Mongoose.

## Included user stories

- US-03
- US-22
- US-04
- US-05
- US-06
- US-07
- US-08
- US-09
- US-10
- US-11
- US-12
- US-13

## Technology

- Frontend: React, TypeScript, and Vite
- Backend: Node.js, Express, and TypeScript
- Database: MongoDB
- MongoDB object modelling: Mongoose
- Authentication: JSON Web Tokens and bcrypt

MongoDB is the database that stores the records. Mongoose is the backend
library that connects the application to MongoDB and defines the User, Listing,
and RentalRequest schemas.

## Structure

- `backend/src/models` — Mongoose models and validation rules
- `backend/src/db.ts` — MongoDB connection
- `backend/src/routes/auth.ts` — registration and authentication
- `backend/src/routes/admin.ts` — student verification
- `backend/src/routes/listings.ts` — listing operations
- `backend/src/routes/requests.ts` — rental-request operations
- `frontend/src/pages` — page-level React screens
- `frontend/src/components` — shared display components

## Configure MongoDB

1. Make sure MongoDB is running locally, or create a MongoDB Atlas database.

2. Copy `backend/.env.example` to `backend/.env`.

3. Set the connection string in `backend/.env`:

   ```env
   PORT=3001
   JWT_SECRET=replace-with-a-long-random-secret
   MONGODB_URI=mongodb://127.0.0.1:27017/campusrent
   ```

   For MongoDB Atlas, replace `MONGODB_URI` with the connection string supplied
   by Atlas. Keep `.env` private and do not commit it.

## Install and run

From the project root:

1. Install the root helper and both applications:

   ```bash
   npm install
   npm run install:all
   ```

2. Create the demo accounts in MongoDB:

   ```bash
   npm run seed
   ```

   - Admin: `admin@mycentennialcollege.ca` / `admin123`
   - Verified student: `student@mycentennialcollege.ca` / `student123`

3. Start the frontend and backend:

   ```bash
   npm run dev
   ```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

The health check reports `"database": "connected"` when Mongoose is connected
to MongoDB.

## Production build

```bash
npm run build
```

Runtime files such as `node_modules`, `dist`, `backend/.env`, and uploaded
images are intentionally excluded.
