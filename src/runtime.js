const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function fitCanvasToCSS(canvas, maxDpr = 2) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}

class Arrow {
  constructor({ x, y, vx, vy }) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.r = 6;
    this.alive = true;
  }
  step(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

class Ghost {
  constructor({ x, y, sizeIdx, speed, drift }) {
    this.x = x; this.y = y;
    this.sizeIdx = sizeIdx;
    this.speed = speed;
    this.drift = drift;
    this.phase = Math.random() * Math.PI * 2;
    this.alive = true;
  }
  step(dt) {
    this.y += this.speed * dt;
    this.phase += dt * 1.6;
    this.x += Math.sin(this.phase) * this.drift * dt;
  }
}

export class Game {
  constructor({ canvas, assets, ui }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.ui = ui;

    this.running = false;
    this.paused = false;

    this.cooldown = 0;
    this.score = 0;
    this.wave = 1;

    this.arrows = [];
    this.ghosts = [];

    this.lastT = 0;
    this.world = { w: 1, h: 1, dpr: 1 };

    this.player = { x: 0, y: 0, r: 42 };

    this.resize();
    this.bindInput();
    this.loop = this.loop.bind(this);
  }

  resize() {
    this.world = fitCanvasToCSS(this.canvas);
    this.player.x = this.world.w * 0.5;
    this.player.y = this.world.h - 80 * this.world.dpr;
    this.player.r = 44 * this.world.dpr;
  }

  bindInput() {
    const fire = (clientX, clientY) => {
      if (!this.running || this.paused) return;
      if (this.cooldown > 0) return;

      const rect = this.canvas.getBoundingClientRect();
      const dpr = this.world.dpr;
      const x = (clientX - rect.left) * dpr;
      const y = (clientY - rect.top) * dpr;

      const dx = x - this.player.x;
      const dy = y - this.player.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 900 * dpr;
      const vx = (dx / len) * speed;
      const vy = (dy / len) * speed;

      this.arrows.push(new Arrow({ x: this.player.x, y: this.player.y, vx, vy }));
      this.cooldown = 0.28; // 5歳向け、連射は抑えめ
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      fire(e.clientX, e.clientY);
    }, { passive: false });
  }

  startNew() {
    this.running = true;
    this.paused = false;
    this.score = 0;
    this.wave = 1;
    this.arrows = [];
    this.ghosts = [];
    this.cooldown = 0;
    this.spawnWave();

    this.ui.score.textContent = String(this.score);
    this.ui.wave.textContent = String(this.wave);

    this.lastT = performance.now();
    requestAnimationFrame(this.loop);
  }

  togglePause() {
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastT = performance.now();
      requestAnimationFrame(this.loop);
    }
  }

  gameOver() {
    this.running = false;
    this.ui.title.textContent = 'Game Over';
    this.ui.desc.textContent = `Score: ${this.score}`;
    this.ui.btnStart.style.display = 'none';
    this.ui.btnRestart.style.display = 'inline-block';
    this.ui.overlay.style.display = 'flex';
  }

  spawnWave() {
    // waveが上がるほど数と速さが少し上がる
    const { w, dpr } = this.world;
    const count = clamp(3 + Math.floor(this.wave * 0.6), 3, 7);
    const baseSpeed = 60 + this.wave * 10;

    for (let i = 0; i < count; i++) {
      const x = (0.15 + Math.random() * 0.7) * w;
      const y = - (40 + Math.random() * 140) * dpr;
      const speed = (baseSpeed + Math.random() * 35) * dpr;
      const drift = (18 + Math.random() * 40) * dpr;
      this.ghosts.push(new Ghost({ x, y, sizeIdx: 0, speed, drift }));
    }
  }

  splitGhost(g) {
    const { ghostSizes } = this.assets;
    const next = g.sizeIdx + 1;
    const maxIdx = ghostSizes.length - 1;

    // points: smaller is higher
    const points = [10, 20, 40, 80][g.sizeIdx] ?? 10;
    this.score += points;
    this.ui.score.textContent = String(this.score);

    g.alive = false;

    if (next > maxIdx) {
      // already smallest → remove
      return;
    }

    // spawn 2 children
    const spread = 85; // pixels/sec (scaled by dpr already in speeds)
    const child1 = new Ghost({
      x: g.x - 10,
      y: g.y,
      sizeIdx: next,
      speed: g.speed * 1.06,
      drift: g.drift * 1.08,
    });
    const child2 = new Ghost({
      x: g.x + 10,
      y: g.y,
      sizeIdx: next,
      speed: g.speed * 1.06,
      drift: g.drift * 1.08,
    });

    // small horizontal nudge by manipulating phase
    child1.phase = g.phase + 1.2;
    child2.phase = g.phase - 1.2;

    // keep in bounds
    child1.x = clamp(child1.x, 20, this.world.w - 20);
    child2.x = clamp(child2.x, 20, this.world.w - 20);

    this.ghosts.push(child1, child2);
  }

  checkCollisions() {
    const { ghostSizes } = this.assets;

    for (const a of this.arrows) {
      if (!a.alive) continue;
      for (const g of this.ghosts) {
        if (!g.alive) continue;
        const r = (ghostSizes[g.sizeIdx] ?? 60) * 0.5 * this.world.dpr;
        const dx = a.x - g.x;
        const dy = a.y - g.y;
        if (dx*dx + dy*dy < (r + a.r) * (r + a.r)) {
          a.alive = false;
          this.splitGhost(g);
          break;
        }
      }
    }
  }

  checkLose() {
    const { ghostSizes } = this.assets;
    for (const g of this.ghosts) {
      if (!g.alive) continue;
      const r = (ghostSizes[g.sizeIdx] ?? 60) * 0.5 * this.world.dpr;
      const dy = Math.abs(g.y - this.player.y);
      const dx = Math.abs(g.x - this.player.x);
      if (dx*dx + dy*dy < (r + this.player.r) * (r + this.player.r)) {
        return true;
      }
    }
    return false;
  }

  cleanup() {
    this.arrows = this.arrows.filter(a => a.alive && a.x > -50 && a.x < this.world.w + 50 && a.y > -80 && a.y < this.world.h + 80);
    this.ghosts = this.ghosts.filter(g => g.alive && g.y < this.world.h + 120);
  }

  step(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;

    for (const a of this.arrows) a.step(dt);
    for (const g of this.ghosts) g.step(dt);

    this.checkCollisions();
    this.cleanup();

    // if all ghosts cleared, next wave
    if (this.ghosts.length === 0) {
      this.wave += 1;
      this.ui.wave.textContent = String(this.wave);
      this.spawnWave();
    }

    if (this.checkLose()) {
      this.gameOver();
    }
  }

  draw() {
    const { w, h, dpr } = this.world;
    const ctx = this.ctx;

    // bg
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, w, h);

    // subtle stars
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 40; i++) {
      const x = ((i * 97) % w);
      const y = ((i * 211) % h) * 0.55;
      ctx.fillRect(x, y, 2*dpr, 2*dpr);
    }

    // player area
    ctx.fillStyle = 'rgba(124,92,255,0.10)';
    ctx.fillRect(0, h - 150*dpr, w, 150*dpr);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2*dpr;
    ctx.beginPath();
    ctx.moveTo(0, h - 150*dpr);
    ctx.lineTo(w, h - 150*dpr);
    ctx.stroke();

    // bow
    const bow = this.assets.bow;
    const bowW = 86*dpr;
    const bowH = 140*dpr;
    ctx.drawImage(bow, this.player.x - bowW*0.5, this.player.y - bowH*0.5, bowW, bowH);

    // arrows
    const arrowImg = this.assets.arrow;
    for (const a of this.arrows) {
      if (!a.alive) continue;
      const ang = Math.atan2(a.vy, a.vx);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(ang);
      ctx.drawImage(arrowImg, -36*dpr, -12*dpr, 72*dpr, 24*dpr);
      ctx.restore();
    }

    // ghosts
    const ghostImg = this.assets.ghost;
    const sizes = this.assets.ghostSizes;
    for (const g of this.ghosts) {
      if (!g.alive) continue;
      const s = (sizes[g.sizeIdx] ?? 60) * dpr;
      ctx.drawImage(ghostImg, g.x - s*0.5, g.y - s*0.5, s, s);
    }
  }

  loop(t) {
    if (!this.running || this.paused) return;
    const dt = clamp((t - this.lastT) / 1000, 0, 0.033);
    this.lastT = t;

    this.step(dt);
    if (!this.running) return;
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
