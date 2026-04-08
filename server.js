const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = {};

function createDeck() {
  let deck = [];
  for (let i = 1; i <= 12; i++) {
    for (let j = 0; j < 4; j++) {
      deck.push(i);
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

io.on("connection", (socket) => {

  socket.on("create", (cb) => {
    const code = Math.random().toString(36).substring(2, 6);

    rooms[code] = {
      deck: createDeck(),
      players: [],
      table: []
    };

    cb(code);
  });

  socket.on("join", ({ code, name }) => {
    const room = rooms[code];
    if (!room) return;

    const player = {
      id: socket.id,
      name: name,
      hand: room.deck.splice(0, 3)
    };

    room.players.push(player);
    socket.join(code);

    io.to(code).emit("state", room);
  });

  socket.on("play", ({ code, card }) => {
    const room = rooms[code];
    if (!room) return;

    room.table.push(card);
    io.to(code).emit("state", room);
  });

});

server.listen(3000, () => {
  console.log("Servidor funcionant a http://localhost:3000");
});