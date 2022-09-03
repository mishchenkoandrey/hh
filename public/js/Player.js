class Player {
  constructor(id, name, pos, img) {
    this.id = id;
    this.name = name;
    this.pos = pos;
    this.img = img;
  }

  draw() {
    const image = new Image();
    image.src = this.img;
    image.width = 30;
    image.height = 40;
    image.setAttribute('alt', `Player ${this.id}`);
    image.classList.add('pin');

    const xPosTable = Math.floor(this.pos / 10) % 2 === 0
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

export default Player;
