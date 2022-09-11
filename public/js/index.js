import Player from './Player.js';
import makePin from './makePin.js';

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
const chooseColor = () => {
  const red = Math.round(Math.random() * 255);
  const green = Math.round(Math.random() * 255);
  const blue = Math.round(Math.random() * 255);

  return `rgb(${red}, ${green}, ${blue})`;
};

const generateBoard = () => Array(100).fill(0).map((v) => rollDice(5));
const pNextPlayer = document.createElement('p');
pNextPlayer.textContent = 'Anyone can roll';
const pChooseField = document.createElement('p');
pChooseField.textContent = 'Choose one of the bright fields';

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

document.getElementById("generate-btn").addEventListener("click", () => {
  state.fieldValues = generateBoard();
  socket.emit("generate", state.fieldValues);
});

document.getElementById("name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  document.getElementById("name").disabled = true;
  document.getElementById("start-btn").hidden = true;
  state.currentPlayer = new Player(state.players.length, name, 0, chooseColor());
  
  if (document.querySelector('.field-img')) {
    document.getElementById("roll-btn").hidden = false;
    document.getElementById("current-player").append(pNextPlayer);
  }

  socket.emit("join", state.currentPlayer);
  document.getElementById("info-box").hidden = true;
});

document.getElementById("roll-btn").addEventListener("click", () => {
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
    const playersOnCurrentField = state.players
      .filter((p) => p.pos === player.pos).length;

    const fieldDenom = playersOnCurrentField < 2
      ? 2
      : playersOnCurrentField;

    player.draw(fieldDenom);
  });
}

const drawPlayersBoxPin = (player) => {
  const tr = document.createElement('tr');
  tr.classList.add('flex', 'gap-02');
  const nameTd = document.createElement('td');
  nameTd.classList.add('players-name');
  nameTd.innerHTML = player.name;
  tr.append(nameTd);
  const pinTd = document.createElement('td');
  pinTd.classList.add('pin-wrap');
  const pinSvg = makePin(player.color);
  pinTd.append(pinSvg);
  tr.append(pinTd);
  document.querySelector("#players-table tbody").append(tr);
};

// Listen for events
socket.on("generate", (data) => {
  state.fieldValues = data;
  drawBoard(data);

  if (state.currentPlayer) {
    document.getElementById("roll-btn").hidden = false;
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
  state.players = [...state.players, new Player(state.players.length, data.name, data.pos, data.color)];
  drawPins();
  drawPlayersBoxPin(data);
});

socket.on("joined", (data) => {
  if (data.length) {
    document.getElementById("players-box").hidden = false;
    document.getElementById("current-player").hidden = false;

    data.forEach((player, index) => {
      state.players = [...state.players, new Player(index, player.name, player.pos, player.color)];
      drawPlayersBoxPin(player);
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
    document.getElementById("roll-btn").hidden = true;
    state.isStepCompleted = false;
  } else {
    document.getElementById("roll-btn").hidden = false;
  }

  pNextPlayer.textContent = (!state.currentPlayer || turn != state.currentPlayer.id)
    ? `It's ${state.players[turn].name}'s turn`
    : "It's your turn";

  if (state.players[data.id].pos === 99) {
    document.getElementById("current-player").innerHTML = `<p>${state.players[data.id].name} has won!</p>`;
    document.getElementById("roll-btn").hidden = true;
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
