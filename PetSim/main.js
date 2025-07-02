const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 700,
  pixelArt: true,
  backgroundColor: '#98d1cc',
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
let isGameOver = false;
let isZombie = false;

function preload() {
  this.load.image('bg', 'assets/bg_room.png');
  this.load.spritesheet('cat_standing_anim', 'assets/cat_standing.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_sitting_anim', 'assets/cat_sitting.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_eating_anim', 'assets/cat_eating.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_playing_anim', 'assets/cat_playing.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_sleeping_anim', 'assets/cat_sleeping.png', { frameWidth: 64, frameHeight: 64 });
  // this.load.spritesheet('cat_zombie_anim', 'assets/cat_zombie.png', { frameWidth: 64, frameHeight: 64 }); // optional
}

function create() {
  const scene = this;

  function setButtonsEnabled(enabled) {
    Object.values(buttons).forEach(btn => {
      if (enabled) {
        btn.setAlpha(1);
        btn.setInteractive();
      } else {
        btn.setAlpha(0.5);
        btn.disableInteractive();
      }
    });
  }

  function triggerGameOver(barName) {
    isGameOver = true;
    scene.pet.play('idle_sleeping');
    setButtonsEnabled(false);

    const message = scene.add.text(400, 300, `Game Over\n${barName} reached 0!`, {
      fontSize: '32px',
      fill: '#ff0000',
      stroke: '#ffffff',           
      strokeThickness: 10, 
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    const retryBtn = scene.add.text(250, 350, 'Retry', {
      fontSize: '24px',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      color: '#000000',
      fontFamily: 'monospace'
    }).setInteractive();

    const continueBtn = scene.add.text(400, 350, 'Continue?', {
      fontSize: '24px',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setInteractive();

    retryBtn.on('pointerdown', () => {
      Object.keys(bars).forEach(name => {
        bars[name].value = 100;
      });

      scene.pet.setTexture('cat_standing_anim');
      scene.pet.play('idle_standing');
      isGameOver = false;
      isZombie = false;
      currentAction = null;

      message.destroy();
      retryBtn.destroy();
      continueBtn.destroy();
      setButtonsEnabled(true);
    });

    continueBtn.on('pointerdown', () => {
      isGameOver = false;
      isZombie = true;
      currentAction = null;

      // Optional: if you have zombie sprite
      // scene.pet.setTexture('cat_zombie_anim');
      // scene.pet.play('idle_zombie');

      scene.pet.setTexture('cat_standing_anim');
      scene.pet.play('idle_standing');

      message.destroy();
      retryBtn.destroy();
      continueBtn.destroy();
      setButtonsEnabled(true);
    });
  }

  // Background
  this.add.image(400, 350, 'bg').setDisplaySize(400, 700).setDepth(-1);

  // Animations
  this.anims.create({ key: 'idle_standing', frames: this.anims.generateFrameNumbers('cat_standing_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_sitting', frames: this.anims.generateFrameNumbers('cat_sitting_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_eating', frames: this.anims.generateFrameNumbers('cat_eating_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_playing', frames: this.anims.generateFrameNumbers('cat_playing_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_sleeping', frames: this.anims.generateFrameNumbers('cat_sleeping_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });

  // Cat sprite
  this.pet = this.add.sprite(400, 480, 'cat_standing_anim').setScale(3);
  this.pet.play('idle_standing');

  // Bars
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
      fontFamily: 'monospace'
    });
    bars[name] = { value: 10, color: colors[i], x: barX, y };
    bars[name].bar = this.add.graphics();
  });

  // Buttons
  const actions = ['Pet', 'Feed', 'Water', 'Play'];
  actions.forEach((action, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    let btn = this.add.text(300 + col * 120, 570 + row * 60, action, {
      fontSize: '20px',
      backgroundColor: '#f9f2e7',
      padding: { x: 10, y: 5 },
      color: '#000000',
      fontFamily: 'monospace'
    }).setInteractive();

    buttons[action] = btn;
    lastUsed[action] = -10000;

    btn.on('pointerdown', () => {
      const now = this.time.now;
      if (now - lastUsed[action] >= 10000 && currentAction === null && !isGameOver) {
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

        setButtonsEnabled(false);
        if (currentActionTimer) currentActionTimer.remove(false);

        currentActionTimer = this.time.delayedCall(10000, () => {
          this.pet.play('idle_standing');
          currentAction = null;
          if (!isGameOver) setButtonsEnabled(true);
        });

        lastUsed[action] = now;
      }
    });
  });

  // Bar decay
  this.time.addEvent({
    delay: 5000,
    loop: true,
    callback: () => {
      if (isGameOver) return;
      bars.Love.value = Math.max(0, bars.Love.value - 1);
      bars.Hunger.value = Math.max(0, bars.Hunger.value - 2);
      bars.Thirst.value = Math.max(0, bars.Thirst.value - 3);
      bars.Fun.value = Math.max(0, bars.Fun.value - 1.5);
    }
  });

  // Save reference to trigger function
  this.triggerGameOver = triggerGameOver;
}

function update() {
  if (isGameOver) return;

  Object.keys(bars).forEach(name => {
    let bar = bars[name];
    bar.bar.clear();
    bar.bar.fillStyle(0x000000, 1);
    bar.bar.fillRect(bar.x, bar.y, 150, 20);
    bar.bar.fillStyle(Phaser.Display.Color.HexStringToColor(bar.color).color, 1);
    bar.bar.fillRect(bar.x, bar.y, 150 * (bar.value / maxBar), 20);

    if (bar.value <= 0 && !isGameOver) {
      this.triggerGameOver(name);
    }
  });

  if (
    currentAction === null &&
    bars.Love.value < 20 &&
    bars.Hunger.value < 20 &&
    bars.Thirst.value < 20 &&
    bars.Fun.value < 20 &&
    !isZombie
  ) {
    if (this.pet.anims.currentAnim.key !== 'idle_sleeping') {
      this.pet.play('idle_sleeping');
    }
  }
}
