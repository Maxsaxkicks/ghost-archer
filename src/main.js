import { loadAssets } from './sprites.js';
import { Game } from './runtime.js';

const canvas = document.getElementById('game');
const ui = {
  score: document.getElementById('score'),
  wave: document.getElementById('wave'),
  overlay: document.getElementById('overlay'),
  title: document.getElementById('title'),
  desc: document.getElementById('desc'),
  btnStart: document.getElementById('btnStart'),
  btnRestart: document.getElementById('btnRestart'),
  btnPause: document.getElementById('btnPause'),
};

ui.overlay.style.display = 'flex';
ui.btnRestart.style.display = 'none';

const assets = await loadAssets();
const game = new Game({ canvas, assets, ui });

ui.btnStart.addEventListener('click', () => {
  ui.overlay.style.display = 'none';
  game.startNew();
});

ui.btnRestart.addEventListener('click', () => {
  ui.overlay.style.display = 'none';
  game.startNew();
});

ui.btnPause.addEventListener('click', () => {
  if (!game.running) return;
  game.togglePause();
  ui.btnPause.textContent = game.paused ? 'Resume' : 'Pause';
});

window.addEventListener('resize', () => game.resize());
