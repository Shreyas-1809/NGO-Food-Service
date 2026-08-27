require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Database Readiness Middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database connection is not ready. Please try again in a few seconds.' });
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const foodRoutes = require('./routes/food');
const notificationRoutes = require('./routes/notifications');
const claimRoutes = require('./routes/claims');
const needRoutes = require('./routes/needs');
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/needs', needRoutes);

// ---------------------------------------------------------------------------
// Socket.io — User rooms for targeted (private) notifications
// ---------------------------------------------------------------------------
// Each client joins their own room ("room:<userId>") after connecting.
// All server-side emits use io.to('room:<userId>').emit(...) instead of
// io.emit(...) so notifications are strictly private per-user.
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Client emits 'join_room' with their userId immediately after login.
  socket.on('join_room', (userId) => {
    if (userId) {
      socket.join(`room:${userId}`);
      console.log(`Socket ${socket.id} joined room:${userId}`);
    }
  });

  // Client emits 'leave_room' on logout (optional — disconnect also cleans rooms).
  socket.on('leave_room', (userId) => {
    if (userId) {
      socket.leave(`room:${userId}`);
      console.log(`Socket ${socket.id} left room:${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io); // Make io accessible in routes

// ---------------------------------------------------------------------------
// Shared helper: emit a socket event to a specific user's room only.
// Usage in routes: const { emitToUser } = require('./socketHelper');
// ---------------------------------------------------------------------------
// We attach it to app so routes can access it via req.app.get('emitToUser')
const emitToUser = (userId, event, data) => {
  if (userId) {
    io.to(`room:${userId.toString()}`).emit(event, data);
  }
};
app.set('emitToUser', emitToUser);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_bridge';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 to prevent IPv6 DNS timeout delays
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Start background auto-delete job (runs every 5 minutes)
    const { startAutoDeleteJob } = require('./services/autoDeleteService');
    startAutoDeleteJob(5 * 60 * 1000);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Stop server immediately on failure so errors aren't masked
  }
};

connectDB();
