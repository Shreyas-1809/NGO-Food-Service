require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Food = require('./models/Food');
const { verifyConfirmationToken } = require('./utils/confirmationTokens');

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
const recurringNeedsRoutes = require('./routes/recurringNeeds');
const historyRoutes = require('./routes/history');
const confirmationRoutes = require('./routes/confirmation');
const translateRoutes = require('./routes/translate');
const mapsRoutes = require('./routes/maps'); // Google Maps proxy (key stays server-side)
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/needs', needRoutes);
app.use('/api/recurring-needs', recurringNeedsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/confirm', confirmationRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/maps', mapsRoutes);

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
  socket.on('join_room', (roomIdOrUserId) => {
    if (roomIdOrUserId) {
      const room = String(roomIdOrUserId).startsWith('room:')
        ? String(roomIdOrUserId)
        : `room:${roomIdOrUserId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    }
  });

  // Client emits 'leave_room' on logout (optional — disconnect also cleans rooms).
  socket.on('leave_room', (roomIdOrUserId) => {
    if (roomIdOrUserId) {
      const room = String(roomIdOrUserId).startsWith('room:')
        ? String(roomIdOrUserId)
        : `room:${roomIdOrUserId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // REAL volunteer GPS updates only.
  // - The volunteer task page sends { taskId, token, lat, lng, accuracy, timestamp }.
  // - The token must be the task's VOLUNTEER token (only the assigned volunteer's
  //   link holder can produce it), so updates from anyone else are ignored.
  // - The real position is persisted on the donation and re-emitted ONLY to the
  //   NGO and the donor of that donation (their user rooms).
  socket.on('VOLUNTEER_LOCATION', async (payload) => {
    try {
      const { taskId, token, lat, lng, accuracy, timestamp } = payload || {};
      if (!taskId || !token) return;

      const latN = Number(lat);
      const lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return;
      if (Math.abs(latN) > 90 || Math.abs(lngN) > 180) return;
      if (Math.abs(latN) < 1e-6 && Math.abs(lngN) < 1e-6) return; // ignore null island / zero coordinates

      const verification = verifyConfirmationToken(token, 'VOLUNTEER');
      if (!verification.valid || verification.decoded.taskId !== String(taskId)) return;

      const food = await Food.findById(taskId);
      if (!food) return;

      // Ignore if token does not match recorded volunteerToken (when set)
      if (food.confirmationTokens?.volunteerToken && food.confirmationTokens.volunteerToken !== token) {
        return;
      }

      // Ignore if this task has no assigned volunteer (or was declined / already completed)
      const hasAssignedVolunteer = (Array.isArray(food.volunteerAssignments) && food.volunteerAssignments.length > 0) ||
        Boolean(food.volunteerAssignment && food.volunteerAssignment.name);
      if (!hasAssignedVolunteer || food.volunteerStatus === 'declined' || food.volunteerStatus === 'delivered' || food.status === 'COMPLETED') {
        return;
      }

      const updatedAt = new Date();
      food.volunteerLiveLocation = {
        lat: latN,
        lng: lngN,
        accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : undefined,
        updatedAt
      };
      await food.save();

      const update = {
        taskId: food._id.toString(),
        donationId: food._id.toString(),
        lat: latN,
        lng: lngN,
        accuracy: food.volunteerLiveLocation.accuracy,
        timestamp: Number.isFinite(Number(timestamp)) ? Number(timestamp) : updatedAt.getTime(),
        updatedAt: updatedAt.toISOString()
      };

      // Emit only to the parties of this donation: the donor and the assigned NGO
      let ngoUserId = food.claimantId ? food.claimantId.toString() : null;
      if (!ngoUserId) {
        const Claim = require('./models/Claim');
        const acceptedClaim = await Claim.findOne({
          foodId: food._id,
          status: { $in: ['ACCEPTED', 'IN_TRANSIT'] }
        });
        if (acceptedClaim?.ngoId) {
          ngoUserId = acceptedClaim.ngoId.toString();
        }
      }

      if (food.donorId) io.to(`room:${food.donorId.toString()}`).emit('VOLUNTEER_LOCATION', update);
      if (ngoUserId) io.to(`room:${ngoUserId}`).emit('VOLUNTEER_LOCATION', update);
      io.to(`room:${food._id.toString()}`).emit('VOLUNTEER_LOCATION', update);
    } catch (err) {
      console.error('VOLUNTEER_LOCATION handling failed:', err.message);
    }
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

    // Start recurring needs job
    const startRecurringJob = require('./jobs/recurringJob');
    startRecurringJob(app.get('io'));

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Stop server immediately on failure so errors aren't masked
  }
};

connectDB();
