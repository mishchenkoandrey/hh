import makePin from './makePin.js';

class Player {
  constructor(id, name, pos, color) {
    this.id = id;
    this.name = name;
    this.pos = pos;
    this.color = color;
  }

  draw(playersQuant) {
    const pin = makePin(this.color, playersQuant);
    document.querySelector(`[data-index= '${this.pos}']`).append(pin);
  }

  updatePos(num) {
    this.pos = num;
  }
}

export default Player;
