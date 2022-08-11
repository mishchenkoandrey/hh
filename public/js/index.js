// Making Connection
const socket = io.connect();
socket.emit("joined");
socket.emit("generated");

const state = {
  fieldValues: [],
  players: [],
};

const redPieceImg = "../images/red_piece.png";
const bluePieceImg = "../images/blue_piece.png";
const yellowPieceImg = "../images/yellow_piece.png";
const greenPieceImg = "../images/green_piece.png";

const images = [redPieceImg, bluePieceImg, yellowPieceImg, greenPieceImg];

const fields = document.querySelectorAll('.board td');

function rollDice(maxValue = 6) {
  const number = Math.ceil(Math.random() * maxValue);
  return number;
}

const generateBoard = () => Array(100).fill(0).map((v) => rollDice(5));

class Player {
  constructor(id, name, pos, img) {
    this.id = id;
    this.name = name;
    this.pos = pos;
    this.img = img;
  }

  draw() {
    let image = new Image();
    image.src = this.img;
    image.width = 30;
    image.height = 40;
    image.setAttribute('alt', `Player ${this.id}`);
    image.classList.add('pin');
    const xPosTable =
    Math.floor(this.pos / 10) % 2 == 0
      ? (this.pos % 10 + 1)
      : 10 - ((this.pos % 10));
    const yPosTable = 10 - (Math.floor(this.pos / 10));
    const currentField = document.querySelector(`.board tr:nth-child(${yPosTable}) td:nth-child(${xPosTable})`);
    currentField.append(image);
  }

  updatePos(num) {
    if (this.pos + num <= 99) {
      this.pos += num;
    } else {
      this.pos = 99;
    }
  }
}

const drawBoard = (values) => {
  fields.forEach((field, i) => {
    const image = field.querySelector('.field-img') ?? new Image();
    if (!field.querySelector('.field-img')) {
      image.classList.add('field-img');
      field.append(image);
    }
    image.src = `../images/dice-board/dice-${values[i]}.svg`;
    image.setAttribute('alt', values[i]);
  });
};

document.getElementById("generate-button").addEventListener("click", () => {
  state.fieldValues = generateBoard();
  socket.emit("generate", state.fieldValues);
});

document.getElementById("start-btn").addEventListener("click", () => {
  const name = document.getElementById("name").value;
  document.getElementById("name").disabled = true;
  document.getElementById("start-btn").hidden = true;
  state.currentPlayer = new Player(state.players.length, name, 0, images[state.players.length]);
  if (document.querySelector('.field-img')) {
    document.getElementById("roll-button").hidden = false;
    document.getElementById("current-player").innerHTML = 'Anyone can roll';
  }
  socket.emit("join", state.currentPlayer);
  document.getElementById("restart-btn").hidden = false;
});

document.getElementById("roll-button").addEventListener("click", () => {
  const num = rollDice();
  state.currentPlayer.updatePos(num);
  socket.emit("rollDice", {
    num: num,
    id: state.currentPlayer.id,
    pos: state.currentPlayer.pos,
  });
  document.querySelector('.generate').hidden = true;
});

function drawPins() {
  fields.forEach((field) => {
    if (field.querySelector('.pin')) {
      field.querySelectorAll('.pin').forEach((pin => pin.remove()));
    }
  });

  state.players.forEach((player) => {
    player.draw();
  });
}

// Listen for events
socket.on("generate", (data) => {
  drawBoard(data);
  if (state.currentPlayer) {
    document.getElementById("roll-button").hidden = false;
    document.getElementById("current-player").innerHTML = 'Anyone can roll';
  }
});

socket.on("generated", (data) => {
  state.fieldValues = data;
  if (state.fieldValues.length) {
    drawBoard(data);
  }
});

socket.on("join", (data) => {
  state.players.push(new Player(state.players.length, data.name, data.pos, data.img));
  drawPins();
  document.getElementById(
    "players-table"
  ).innerHTML += `<tr><td>${data.name}</td><td><img src=${data.img} height=50 width=40></td></tr>`;
});

socket.on("joined", (data) => {
  data.forEach((player, index) => {
    state.players.push(new Player(index, player.name, player.pos, player.img));
    console.log(player);
    document.getElementById(
      "players-table"
    ).innerHTML += `<tr><td>${player.name}</td><td><img src=${player.img}></td></tr>`;
  });
  drawPins();
});

socket.on("rollDice", (data, turn) => {
  state.players[data.id].updatePos(data.num);
  document.getElementById("dice").src = `./images/dice/dice${data.num}.png`;
  drawPins();

  if (turn != state.currentPlayer.id) {
    document.getElementById("roll-button").hidden = true;
    document.getElementById(
      "current-player"
    ).innerHTML = `<p>It's ${state.players[turn].name}'s turn</p>`;
  } else {
    document.getElementById("roll-button").hidden = false;
    document.getElementById(
      "current-player"
    ).innerHTML = `<p>It's your turn</p>`;
  }

  let winner;
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].pos == 99) {
      winner = state.players[i];
      break;
    }
  }

  if (winner) {
    document.getElementById(
      "current-player"
    ).innerHTML = `<p>${winner.name} has won!</p>`;
    document.getElementById("roll-button").hidden = true;
    document.getElementById("dice").hidden = true;
  }
});

// Logic to restart the game
document.getElementById("restart-btn").addEventListener("click", () => {
  socket.emit("restart");
});

socket.on("restart", () => {
  window.location.reload();
});
