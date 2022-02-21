const express = require("express");
const app = express();
const http = require("http");
const dotenv = require("dotenv");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

dotenv.config({ path: "./config.env" });

const users = [];
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello world");
});

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }) => {
    const joinedUser = addUser(socket.id, username, room);
    console.log(`${joinedUser.username} joined`);
    socket.join(joinedUser.room);

    socket.emit("welcome", {
      id: joinedUser.id,
      username: joinedUser.username,
      msg: `Welcome ${joinedUser.username}`,
    });

    socket.broadcast.to(joinedUser.room).emit("message", {
      id: joinedUser.id,
      username: joinedUser.username,
      msg: `${joinedUser.username} has joined the chat`,
    });
  });

  socket.on("chat", (text) => {
    const currentUser = getCurrentUser(socket.id);

    io.to(currentUser.room).emit("text", {
      id: currentUser.id,
      username: currentUser.username,
      text: text,
    });
  });

  socket.on("disconnect", () => {
    const removedUser = removeUser(socket.id);

    if (removedUser) {
      io.to(removedUser.room).emit("left", {
        id: removedUser.id,
        username: removedUser.username,
        text: `${removedUser.username} has left the room`,
      });

      console.log(`${removedUser.username} just left`);
    }
  });
});

const addUser = (id, username, room) => {
  const currentUser = { id, username, room };
  users.push(currentUser);
  return currentUser;
};

const getCurrentUser = (id) => {
  const currentUser = users.find((user) => user.id === id);

  return currentUser;
};

const removeUser = (id) => {
  const removedUser = users.find((user) => user.id === id);

  return removedUser;
};

server.listen(PORT || 8000, () => {
  console.log("listening on *:3000");
});
