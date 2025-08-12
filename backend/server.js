require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');
const {ProcessedMessage} = require("./models/ProcessedMessage.js");
const { processPayloadFiles } = require('./utils/processPayloadFiles');


const webhookRouter = require('./routes/webhook');
const convRouter = require('./routes/conversations');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 4000;

// connect mongo
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    await processPayloadFiles('./payloads');
    console.log("Payload processing done");
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// attach io to app locals so routes can emit
app.locals.io = io;

// mount routes
app.use('/api/webhook', webhookRouter);
app.use('/api/conversations', convRouter);

// simple health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Socket.IO handlers
io.on('connection', (socket) => {
  // client should send 'join' with wa_id (chat room)
  socket.on('join', (wa_id) => {
    if (!wa_id) return;
    socket.join(wa_id);
    console.log(`Socket ${socket.id} joined room ${wa_id}`);
  });

  socket.on('leave', (wa_id) => {
    if (!wa_id) return;
    socket.leave(wa_id);
  });

  socket.on('disconnect', () => {
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
