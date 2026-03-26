import express from 'express';
import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import dotenv from "dotenv";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from "./lib/db.js";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5001"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://localhost:5001"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://*.getstream.io https://*.stream-io-api.com https://*.dicebear.com https://avatar.iran.liara.run; " +
    "connect-src 'self' https://*.getstream.io https://*.stream-io-api.com wss://*.getstream.io wss://*.stream-io-api.com ws://localhost:* http://localhost:* https://api.cloudinary.com; " +
    "img-src 'self' data: https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com;"
  );
  next();
});

// Socket.io Logic
const users = new Map();

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("register", (userId) => {
    users.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("call-user", ({ to, offer, from, name, profilePic }) => {
    const targetSocketId = users.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", { from, offer, name, profilePic });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const targetSocketId = users.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answered", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = users.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const targetSocketId = users.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        break;
      }
    }
    console.log("User disconnected", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Serve static assets
const distPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log("Serving static files from:", distPath);

  app.get("*", (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });
}

// Connect to DB and Start Server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });