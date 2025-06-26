const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 700,
  pixelArt: true,
  backgroundColor: '#a3d2ca',
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let bars = {};
let buttons = {};
let lastUsed = {};
const maxBar = 100;
let currentAction = null;
let currentActionTimer = null;

function preload() {
  this.load.image('bg', 'assets/bg_room.png');

  this.load.spritesheet('cat_standing_anim', 'assets/cat_standing.png', {
    frameWidth: 64,
    frameHeight: 64
  });
  this.load.spritesheet('cat_sitting_anim', 'assets/cat_sitting.png', {
    frameWidth: 64,
    frameHeight: 64
  });
  this.load.spritesheet('cat_eating_anim', 'assets/cat_eating.png', {
    frameWidth: 64,
    frameHeight: 64
  });
  this.load.spritesheet('cat_playing_anim', 'assets/cat_playing.png', {
    frameWidth: 64,
    frameHeight: 64
  });
  this.load.spritesheet('cat_sleeping_anim', 'assets/cat_sleeping.png', {
    frameWidth: 64,
    frameHeight: 64
  });
}

function create() {
  // Fondo
  this.add.image(400, 350, 'bg')
    .setDisplaySize(400, 700)
    .setDepth(-1);

  // Animaciones
  this.anims.create({ key: 'idle_standing', frames: this.anims.generateFrameNumbers('cat_standing_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_sitting', frames: this.anims.generateFrameNumbers('cat_sitting_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_eating', frames: this.anims.generateFrameNumbers('cat_eating_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_playing', frames: this.anims.generateFrameNumbers('cat_playing_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_sleeping', frames: this.anims.generateFrameNumbers('cat_sleeping_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });

  // Gato en el centro
  this.pet = this.add.sprite(400, 480, 'cat_standing_anim').setScale(3);
  this.pet.play('idle_standing');

  // Barras
  const barNames = ['Love', 'Hunger', 'Thirst', 'Fun'];
  const colors = ['#ff69b4', '#ffa500', '#1e90ff', '#90ee90'];
  const startX = 280;
  const barX = 380;
  const startY = 50;
  const spacingY = 35;

  barNames.forEach((name, i) => {
    const y = startY + i * spacingY;

    this.add.text(startX, y, name + ':', {
      fontSize: '18px',
      fill: '#000',
      align: 'right',
      fontFamily: 'monospace'
    });

    bars[name] = { value: 100, color: colors[i], x: barX, y };
    bars[name].bar = this.add.graphics();
  });

  // Botones en 2x2 abajo
  const actions = ['Pet', 'Feed', 'Water', 'Play'];
  const buttonStartX = 300;
  const buttonStartY = 570;
  const buttonSpacingX = 120;
  const buttonSpacingY = 60;

  actions.forEach((action, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);

    let btn = this.add.text(
      buttonStartX + col * buttonSpacingX,
      buttonStartY + row * buttonSpacingY,
      action,
      {
        fontSize: '20px',
        backgroundColor: '#f9f2e7',
        padding: { x: 10, y: 5 },
        color: '#000000',
        fontStyle: 'bold',
        fontFamily: 'monospace'
      }
    ).setInteractive();

    buttons[action] = btn;
    lastUsed[action] = -10000;

    btn.on('pointerdown', () => {
      const now = this.time.now;
      if (now - lastUsed[action] >= 10000) {
        if (action === 'Pet') {
          bars.Love.value = Math.min(maxBar, bars.Love.value + 15);
          this.pet.play('idle_sitting');
          currentAction = 'Pet';
        }
        if (action === 'Feed') {
          bars.Hunger.value = Math.min(maxBar, bars.Hunger.value + 20);
          this.pet.play('idle_eating');
          currentAction = 'Feed';
        }
        if (action === 'Water') {
          bars.Thirst.value = Math.min(maxBar, bars.Thirst.value + 20);
          this.pet.play('idle_eating');
          currentAction = 'Water';
        }
        if (action === 'Play') {
          bars.Fun.value = Math.min(maxBar, bars.Fun.value + 20);
          this.pet.play('idle_playing');
          currentAction = 'Play';
        }

        if (currentActionTimer) {
          currentActionTimer.remove(false);
        }

        currentActionTimer = this.time.delayedCall(10000, () => {
          if (currentAction === action) {
            this.pet.play('idle_standing');
            currentAction = null;
          }
        });

        lastUsed[action] = now;
        btn.setAlpha(0.5);
        this.time.delayedCall(10000, () => {
          btn.setAlpha(1);
        });
      }
    });
  });

  // Disminución automática de las barras
  this.time.addEvent({
    delay: 5000,
    loop: true,
    callback: () => {
      bars.Love.value = Math.max(0, bars.Love.value - 1);
      bars.Hunger.value = Math.max(0, bars.Hunger.value - 2);
      bars.Thirst.value = Math.max(0, bars.Thirst.value - 3);
      bars.Fun.value = Math.max(0, bars.Fun.value - 1.5);
    }
  });
}

function update() {
  Object.keys(bars).forEach(name => {
    let bar = bars[name];
    bar.bar.clear();
    bar.bar.fillStyle(0x000000, 1);
    bar.bar.fillRect(bar.x, bar.y, 150, 20);
    bar.bar.fillStyle(Phaser.Display.Color.HexStringToColor(bar.color).color, 1);
    bar.bar.fillRect(bar.x, bar.y, 150 * (bar.value / maxBar), 20);
  });

  // Dormir si todas las barras están muy bajas
  if (
    bars.Love.value < 20 &&
    bars.Hunger.value < 20 &&
    bars.Thirst.value < 20 &&
    bars.Fun.value < 20
  ) {
    if (this.pet.anims.currentAnim.key !== 'idle_sleeping') {
      this.pet.play('idle_sleeping');
    }
  }
}
