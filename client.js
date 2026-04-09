const socket = io();

let room = "";
let name = "";
let state = null;

socket.on("state", (s) => {
  state = s;
  render();
});

function create() {
  name = document.getElementById("name").value;

  socket.emit("create", (code) => {
    room = code;
    socket.emit("join", { code, name });
    alert("Sala creada: " + code);
  });
}

function join() {
  name = document.getElementById("name").value;
  room = document.getElementById("room").value;

  socket.emit("join", { code: room, name });
}

function play(card) {
  socket.emit("play", { code: room, card });
}

function render() {
  if (!state) return;

  document.getElementById("table").innerHTML =
    state.table.map(c => "🃏" + c.card).join(" ");

  const me = state.players.find(p => p.name === name);

  document.getElementById("hand").innerHTML = "";

  if (me) {
    me.hand.forEach(c => {
      const b = document.createElement("button");
      b.innerText = c;
      b.onclick = () => play(c);
      document.getElementById("hand").appendChild(b);
    });
  }
}
function truc() {
  socket.emit("truc", { code: room });
}

function retruc() {
  socket.emit("retruc", { code: room });
}
