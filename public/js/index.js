// Making Connection
const socket = io.connect();
socket.emit("joined");
socket.emit("generated");

const state = {
  fieldValues: [],
  players: [],
  isStopThrow: true,
  isStepCompleted: false,
};

const redPieceImg = "../images/red_piece.png";
const bluePieceImg = "../images/blue_piece.png";
const yellowPieceImg = "../images/yellow_piece.png";
const greenPieceImg = "../images/green_piece.png";

const images = [redPieceImg, bluePieceImg, yellowPieceImg, greenPieceImg];

const fields = document.querySelectorAll('.board td');

const orderedFieldsNumbers = Array(100).fill(0)
  .map((field, i, fields) => Math.ceil((fields.length - i) / 10) % 2 !== 0
    ? Math.floor((fields.length - 1 - i) / 10) * 10 + (9 - (fields.length - 1 - i) % 10)
    : fields.length - 1 - i);

fields
  .forEach((field, i) => field.setAttribute('data-index', orderedFieldsNumbers[i]));

function rollDice(maxValue = 6) {
  const number = Math.ceil(Math.random() * maxValue);
  return number;
}

const generateBoard = () => Array(100).fill(0).map((v) => rollDice(5));
const pNextPlayer = document.createElement('p');
pNextPlayer.textContent = 'Anyone can roll';
const pChooseField = document.createElement('p');
pChooseField.textContent = 'Choose one of the bright fields';

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
    this.pos = num;
  }
}

const drawBoard = (values) => {
  fields.forEach((field, i) => {
    const image = field.querySelector('.field-img') ?? new Image();
    if (!field.querySelector('.field-img')) {
      image.classList.add('field-img');
      field.append(image);
    }

    image.src = `../images/dice-board/dice-${values[field.dataset.index]}.svg`;
    image.setAttribute('alt', values[field.dataset.index]);
  });
};

document.getElementById("generate-button").addEventListener("click", () => {
  state.fieldValues = generateBoard();
  socket.emit("generate", state.fieldValues);
});

document.getElementById("name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  document.getElementById("name").disabled = true;
  document.getElementById("start-btn").hidden = true;
  state.currentPlayer = new Player(state.players.length, name, 0, images[state.players.length]);
  if (document.querySelector('.field-img')) {
    document.getElementById("roll-button").hidden = false;
    document.getElementById("current-player").append(pNextPlayer);
  }
  socket.emit("join", state.currentPlayer);
  document.getElementById("info-box").hidden = true;
});

document.getElementById("roll-button").addEventListener("click", () => {
  if (document.getElementById("current-player").children.length > 1) {
    document.getElementById("current-player").children[0].remove();
  }

  const num = rollDice();
  
  if (!state.isStopThrow) {
    const availableFieldsNumbers = orderedFieldsNumbers
      .filter((v) => v >= state.currentPlayer.pos && (v <= state.currentPlayer.pos + num));

    const availableFields = availableFieldsNumbers
      .map((v) => fields[orderedFieldsNumbers.indexOf(v)]);

    const listen = (e) => {
      state.currentPlayer.updatePos(Number(e.target.dataset.index));
      pChooseField.remove();
      document.getElementById("current-player").append(pNextPlayer);

      fields
        .forEach((field) => {
          field.removeEventListener('click', listen);
        });

      state.isStopThrow = true;
      state.isStepCompleted = true;

      socket.emit("rollDice", {
        num,
        id: state.currentPlayer.id,
        pos: state.currentPlayer.pos,
        isStopThrow: state.isStopThrow,
        isStepCompleted: state.isStepCompleted,
      });
    };

    availableFields.forEach((field) => {
      field.addEventListener('click', listen);
    });

    pNextPlayer.remove();
    document.getElementById("current-player").prepend(pChooseField);

    socket.emit("rollDice", {
      availableFieldsNumbers,
      num,
      id: state.currentPlayer.id,
      pos: state.currentPlayer.pos,
      isStopThrow: state.isStopThrow,
      isStepCompleted: state.isStepCompleted,
    });
  } else if (num <= state.fieldValues[state.currentPlayer.pos]) {
    state.isStopThrow = false;
    state.isStepCompleted = false;
    
    socket.emit("rollDice", {
      num,
      id: state.currentPlayer.id,
      pos: state.currentPlayer.pos,
      isStopThrow: state.isStopThrow,
      isStepCompleted: state.isStepCompleted,
    });
  } else {
    const pShouldThrow = document.createElement('p');
    console.log(state.fieldValues, state.currentPlayer.pos);
    pShouldThrow.textContent = `You should throw <= then field value (${state.fieldValues[state.currentPlayer.pos]})`;
    document.getElementById("current-player").prepend(pShouldThrow);
    state.isStepCompleted = true;
    
    socket.emit("rollDice", {
      num,
      id: state.currentPlayer.id,
      pos: state.currentPlayer.pos,
      isStopThrow: state.isStopThrow,
      isStepCompleted: state.isStepCompleted,
    });
  }
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
  state.fieldValues = data;
  drawBoard(data);
  if (state.currentPlayer) {
    document.getElementById("roll-button").hidden = false;
    document.getElementById("current-player").append(pNextPlayer);
  }
});

socket.on("generated", (data) => {
  state.fieldValues = data;
  if (state.fieldValues.length) {
    drawBoard(data);
  }
});

socket.on("join", (data) => {
  document.getElementById("players-box").hidden = false;
  document.getElementById("current-player").hidden = false;
  state.players.push(new Player(state.players.length, data.name, data.pos, data.img));
  drawPins();
  document.querySelector("#players-table tbody").innerHTML += `<tr class='flex gap-02'><td class='players-name'>${data.name}</td><td><img src=${data.img} class='table-pin'></td></tr>`;
});

socket.on("joined", (data) => {
  if (data.length) {
    document.getElementById("players-box").hidden = false;
    document.getElementById("current-player").hidden = false;
    data.forEach((player, index) => {
      state.players.push(new Player(index, player.name, player.pos, player.img));
      document.querySelector("#players-table tbody").innerHTML += `<tr class='flex gap-02'><td class='players-name'>${player.name}</td><td><img src=${player.img} class='table-pin'></td></tr>`;
    });
    drawPins();
  }
});

socket.on("rollDice", (data, turn) => {
  state.players[data.id].pos = data.pos;
  state.isStopThrow = data.isStopThrow;
  state.isStepCompleted = data.isStepCompleted;

  if (document.getElementById('dice-wrap')) {
    document.getElementById('dice-wrap').remove();
  }

  const diceWrap = document.createElement('td');
  diceWrap.id = 'dice-wrap';
  const dice = document.createElement('img');
  dice.src = `./images/dice/dice${data.num}.png`;
  dice.alt = data.num;
  dice.id = 'dice';
  dice.classList.add('dice');
  diceWrap.append(dice);
  const currentPlayerTr = document.querySelector(`#players-table tr:nth-child(${data.id + 1})`);
  currentPlayerTr.append(diceWrap);
  drawPins();
  document.getElementById('generate').hidden = true;

  fields
    .forEach((field) => {
      field.classList.remove('bright');
    });

  if (data.availableFieldsNumbers) {
    const availableFields = data.availableFieldsNumbers
      .map((v) => fields[orderedFieldsNumbers.indexOf(v)]);

    availableFields.forEach((field) => {
      field.classList.add('bright');
    });
  }

  if (!state.currentPlayer || turn != state.currentPlayer.id || data.availableFieldsNumbers) {
    document.getElementById("roll-button").hidden = true;
    state.isStepCompleted = false;
  } else {
    document.getElementById("roll-button").hidden = false;
  }

  pNextPlayer.textContent = (!state.currentPlayer || turn != state.currentPlayer.id)
    ? `It's ${state.players[turn].name}'s turn`
    : "It's your turn";

  let winner;
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].pos == 99) {
      winner = state.players[i];
      break;
    }
  }

  if (winner) {
    document.getElementById("current-player").innerHTML = `<p>${winner.name} has won!</p>`;
    document.getElementById("roll-button").hidden = true;
    document.getElementById("restart-btn").hidden = false;
  }
});

// Logic to restart the game
document.getElementById("restart-btn").addEventListener("click", () => {
  socket.emit("restart");
});

socket.on("restart", () => {
  window.location.reload();
});
