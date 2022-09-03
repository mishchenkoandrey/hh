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

const state = {
  fields: [],
  players: [],
};

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("generate", (data) => {
    state.fields = data;
    io.sockets.emit("generate", data);
  });

  socket.on("generated", () => {
    socket.emit("generated", state.fields);
  });

  socket.on("join", (data) => {
    state.players = [...state.players, data];
    io.sockets.emit("join", data);
  });

  socket.on("joined", () => {
    socket.emit("joined", state.players);
  });

  socket.on("rollDice", (data) => {
    state.players[data.id].pos = data.pos;
    const turn = !data.isStepCompleted
      ? data.id
      : (data.id + 1) % state.players.length;
    io.sockets.emit("rollDice", data, turn);
  });

  socket.on("restart", () => {
    state.fields = [];
    state.players = [];
    io.sockets.emit("restart");
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
