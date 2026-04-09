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
    for (let j = 0; j < 4; j++) deck.push(i);
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getWinner(c1, c2) {
  return c1 > c2 ? 1 : 2;
}

io.on("connection", (socket) => {

  socket.on("create", (cb) => {
    const code = Math.random().toString(36).substring(2, 6);

    rooms[code] = {
      deck: createDeck(),
      players: [],
      table: [],
      round: 1,
      scores: [0, 0],
      trickValue: 1,
      trucActive: false,
      lastWinner: null
    };

    cb(code);
  });

  socket.on("join", ({ code, name }) => {
    const room = rooms[code];
    if (!room) return;

    const player = {
      id: socket.id,
      name,
      hand: room.deck.splice(0, 3),
      team: room.players.length % 2
    };

   room.players.push(player);

// 🤖 afegir bot si només hi ha 1 jugador
if (room.players.length === 1) {
  const bot = {
    id: "bot",
    name: "🤖 IA",
    hand: room.deck.splice(0, 3),
    team: 1
  };

  room.players.push(bot);
}
    socket.join(code);

    io.to(code).emit("state", room);
  });

 socket.on("play", ({ code, card }) => {
  const room = rooms[code];
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (player) {
    player.hand = player.hand.filter(c => c !== card);
  }

  room.table.push({ player: socket.id, card });

  io.to(code).emit("state", room);

  // 🤖 IA juga DESPRÉS del jugador
  setTimeout(() => {
    const bot = room.players.find(p => p.id === "bot");
    if (!bot) return;

    if (bot.hand.length === 0) return;

    const index = Math.floor(Math.random() * bot.hand.length);
    const botCard = bot.hand.splice(index, 1)[0];

    room.table.push({ player: "bot", card: botCard });

    io.to(code).emit("state", room);

  }, 1500);

});

    room.table.push({ player: socket.id, card });

    if (room.table.length === 2) {
      const [p1, p2] = room.table;

      const winner = getWinner(p1.card, p2.card);
      room.lastWinner = winner - 1;

      room.scores[winner - 1] += room.trickValue;

      room.table = [];
      room.round++;

      // VOLGUÉ 🔥
      if (room.scores[0] === 11 || room.scores[1] === 11) {
        room.volgue = true;
      }

      // FINAL PARTIDA
      if (room.scores[0] >= 12 || room.scores[1] >= 12) {
        room.gameOver = true;
      }
    }

    io.to(code).emit("state", room);
 // 🤖 IA pot fer TRUC
if (Math.random() < 0.2) {
  room.trucActive = true;
  room.trickValue = 2;
  console.log("IA diu TRUC 😏");
}
  });

  socket.on("truc", ({ code }) => {
    const room = rooms[code];
    room.trucActive = true;
    room.trickValue = 2;
    io.to(code).emit("state", room);
  });

  socket.on("retruc", ({ code }) => {
    const room = rooms[code];
    room.trickValue = 3;
    io.to(code).emit("state", room);
  });

});

server.listen(3000, () => {
  console.log("Servidor amb TRUC real 🔥");
});
