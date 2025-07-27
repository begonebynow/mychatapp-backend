import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "chitchat-40aj4kw5p-begonebynows-projects.vercel.app", // Update this with frontend URL when deploying
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();
const registeredUsers = new Set();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (username) => {
    if (!username) return;
    registeredUsers.add(username);
    onlineUsers.set(username, socket.id);
    io.emit("update-online-users", Array.from(onlineUsers.keys()));
    io.emit("registered-users", Array.from(registeredUsers));
  });

  socket.on("disconnect", () => {
    for (const [username, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(username);
        break;
      }
    }
    io.emit("update-online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("private_message", ({ to, from, message }) => {
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("private_message", { from, message });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Chat server is running.");
});

server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
