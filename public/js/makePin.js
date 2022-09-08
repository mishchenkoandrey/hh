export default (color, playersQuant = 1) => {
  const pinSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pinSvg.setAttribute('viewBox', '0 0 28 28');
  pinSvg.setAttribute('style', `color: ${color}`);
  pinSvg.innerHTML = '<use href="../images/pin.svg#layer1"></use>';
  pinSvg.classList.add('pin');
  const width = Math.floor(100 / Math.ceil(Math.sqrt(playersQuant)));
  pinSvg.setAttribute('width', `${width}%`);
  return pinSvg;
};
