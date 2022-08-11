const express = require("express");
const socket = require("socket.io");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Set static folder
app.use(express.static("public"));

// Socket setup
const io = socket(server);

// Players array
let users = [];

// Board array
let fields = [];

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("generate", (data) => {
    fields = data;
    io.sockets.emit("generate", data);
  });

  socket.on("generated", () => {
    socket.emit("generated", fields);
  });

  socket.on("join", (data) => {
    users.push(data);
    io.sockets.emit("join", data);
  });

  socket.on("joined", () => {
    socket.emit("joined", users);
  });

  socket.on("rollDice", (data) => {
    console.log(data);
    users[data.id].pos = data.pos;
    const turn = (data.id + 1) % users.length;
    io.sockets.emit("rollDice", data, turn);
  });

  socket.on("restart", () => {
    users = [];
    fields = [];
    io.sockets.emit("restart");
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
