const config = {
  type: Phaser.AUTO,           // Phaser decide automáticamente el render (WebGL o Canvas)
  width: 800,                  // Ancho del juego en píxeles
  height: 700,                 // Alto del juego en píxeles
  pixelArt: true,              // Modo pixel art para evitar suavizado
  backgroundColor: '#98d1cc', // Color de fondo del juego
  scene: {
    preload,                   // Función para cargar recursos
    create,                    // Función para crear los elementos del juego
    update                     // Función que se ejecuta en cada frame (loop)
  }
};

const game = new Phaser.Game(config); // Crear instancia del juego con la configuración

// Variables globales para controlar barras, botones y estados
let bars = {};                 // Objeto para almacenar las barras de estado
let buttons = {};              // Objeto para almacenar los botones de acción
let lastUsed = {};             // Objeto para guardar el tiempo del último uso de cada acción (para cooldown)
const maxBar = 100;            // Valor máximo que puede tener una barra
let currentAction = null;      // Acción actual que se está realizando (null si ninguna)
let currentActionTimer = null; // Temporizador para duración de la acción actual
let isGameOver = false;        // Estado de si el juego terminó o no
let isZombie = false;          // Estado que indica si el gato está en modo zombie

// Función para cargar recursos antes de que inicie el juego
function preload() {
  this.load.image('bg', 'assets/bg_room.png'); // Fondo de la habitación
  // Spritesheet para las distintas animaciones del gato (con tamaño 64x64 cada frame)
  this.load.spritesheet('cat_standing_anim', 'assets/cat_standing.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_sitting_anim', 'assets/cat_sitting.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_eating_anim', 'assets/cat_eating.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_playing_anim', 'assets/cat_playing.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('cat_sleeping_anim', 'assets/cat_sleeping.png', { frameWidth: 64, frameHeight: 64 });
  // this.load.spritesheet('cat_zombie_anim', 'assets/cat_zombie.png', { frameWidth: 64, frameHeight: 64 }); // (comentado por ahora)
}

// Función para crear elementos y lógica inicial del juego
function create() {
  const scene = this; // Referencia a la escena actual para usar dentro de funciones internas

  // Función para activar o desactivar todos los botones (usada para bloquear inputs)
  function setButtonsEnabled(enabled) {
    Object.values(buttons).forEach(btn => {
      if (enabled) {
        btn.setAlpha(1);          // Mostrar botones completamente
        btn.setInteractive();     // Hacer que los botones sean interactivos (clickables)
      } else {
        btn.setAlpha(0.5);        // Hacer botones semi-transparentes (deshabilitados visualmente)
        btn.disableInteractive(); // Desactivar la interacción (no se puede clickear)
      }
    });
  }

  // Función que maneja la pantalla y lógica cuando termina el juego
  function triggerGameOver(barName) {
    isGameOver = true;               // Marcar el juego como terminado
    scene.pet.play('idle_sleeping'); // Poner al gato en animación de dormir (como "muerto")
    setButtonsEnabled(false);       // Deshabilitar botones

    // Mostrar mensaje de "Game Over" indicando qué barra llegó a 0
    const message = scene.add.text(400, 300, `Game Over\n${barName} reached 0!`, {
      fontSize: '32px',
      fill: '#ff0000',
      stroke: '#ffffff',           
      strokeThickness: 10, 
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Crear botón para reiniciar el juego
    const retryBtn = scene.add.text(250, 350, 'Retry', {
      fontSize: '24px',
      backgroundColor: '#ffffff',
      padding: { x: 20, y: 10 },
      color: '#000000',
      fontFamily: 'monospace'
    }).setInteractive();

    // Crear botón para continuar en modo "zombie"
    const continueBtn = scene.add.text(400, 350, 'Continue?', {
      fontSize: '24px',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setInteractive();

    // Evento para el botón "Retry" (reiniciar juego)
    retryBtn.on('pointerdown', () => {
      // Restaurar todas las barras a 100
      Object.keys(bars).forEach(name => {
        bars[name].value = 100;
      });

      scene.pet.setTexture('cat_standing_anim'); // Cambiar textura del gato a la normal
      scene.pet.play('idle_standing');            // Animación normal
      isGameOver = false;                         // Volver a estado de juego activo
      isZombie = false;                           // No en modo zombie
      currentAction = null;                       // Sin acción activa

      // Borrar texto y botones de "Game Over"
      message.destroy();
      retryBtn.destroy();
      continueBtn.destroy();

      setButtonsEnabled(true);                    // Reactivar botones
    });

    // Evento para el botón "Continue?" (modo zombie)
    continueBtn.on('pointerdown', () => {
      isGameOver = false;                         // Salir de estado game over
      isZombie = true;                            // Activar modo zombie
      currentAction = null;                       // Sin acción activa

      scene.pet.setTexture('cat_standing_anim'); // Cambiar textura del gato normal
      scene.pet.play('idle_standing');            // Animación normal

      // Borrar mensaje y botones
      message.destroy();
      retryBtn.destroy();
      continueBtn.destroy();

      setButtonsEnabled(true);                    // Reactivar botones
    });
  }

  // Agregar imagen de fondo y ajustarla a tamaño
  this.add.image(400, 350, 'bg').setDisplaySize(400, 700).setDepth(-1);

  // Crear las animaciones para cada estado del gato
  this.anims.create({ key: 'idle_standing', frames: this.anims.generateFrameNumbers('cat_standing_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_sitting', frames: this.anims.generateFrameNumbers('cat_sitting_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_eating', frames: this.anims.generateFrameNumbers('cat_eating_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_playing', frames: this.anims.generateFrameNumbers('cat_playing_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });
  this.anims.create({ key: 'idle_sleeping', frames: this.anims.generateFrameNumbers('cat_sleeping_anim', { start: 0, end: 1 }), frameRate: 1, repeat: -1 });

  // Crear sprite del gato en pantalla, lo posicionamos y escalamos
  this.pet = this.add.sprite(400, 480, 'cat_standing_anim').setScale(3);
  this.pet.play('idle_standing'); // Animación inicial del gato

  // Definimos las barras de estado y sus colores y posiciones
  const barNames = ['Love', 'Hunger', 'Thirst', 'Fun']; // Nombre de las barras
  const colors = ['#ff69b4', '#ffa500', '#1e90ff', '#90ee90']; // Colores para cada barra
  const startX = 280; // Posición X para los textos de las barras
  const barX = 380;   // Posición X para dibujar barras
  const startY = 50;  // Posición Y inicial
  const spacingY = 35; // Espacio vertical entre barras

  // Crear textos y barras en pantalla para cada estado
  barNames.forEach((name, i) => {
    const y = startY + i * spacingY; // Posición Y de cada barra
    this.add.text(startX, y, name + ':', {
      fontSize: '18px',
      fill: '#000',
      fontFamily: 'monospace'
    });
    bars[name] = { value: 100, color: colors[i], x: barX, y }; // Guardamos el valor inicial y posición
    bars[name].bar = this.add.graphics(); // Creamos el gráfico para la barra (relleno)
  });

  // Definir botones de acciones que el jugador puede usar
  const actions = ['Pet', 'Feed', 'Water', 'Play'];
  actions.forEach((action, i) => {
    const col = i % 2; // Columna (2 botones por fila)
    const row = Math.floor(i / 2); // Fila
    let btn = this.add.text(300 + col * 120, 570 + row * 60, action, {
      fontSize: '20px',
      backgroundColor: '#f9f2e7',
      padding: { x: 10, y: 5 },
      color: '#000000',
      fontFamily: 'monospace'
    }).setInteractive(); // Hacer botón interactivo (clickable)

    buttons[action] = btn;       // Guardar referencia del botón
    lastUsed[action] = -10000;   // Inicializar cooldown (muy viejo)

    // Evento cuando se hace click en el botón
    btn.on('pointerdown', () => {
      const now = this.time.now; // Tiempo actual
      // Solo permitir acción si pasó el cooldown, no hay acción en curso y el juego no terminó
      if (now - lastUsed[action] >= 10000 && currentAction === null && !isGameOver) {
        // Efectos según la acción
        if (action === 'Pet') {
          bars.Love.value = Math.min(maxBar, bars.Love.value + 15); // Sube barra de amor
          this.pet.play('idle_sitting'); // Animación de gato sentado
          currentAction = 'Pet';          // Guardar acción en curso
        }
        if (action === 'Feed') {
          bars.Hunger.value = Math.min(maxBar, bars.Hunger.value + 20); // Sube barra de hambre
          this.pet.play('idle_eating');  // Animación de comer
          currentAction = 'Feed';
        }
        if (action === 'Water') {
          bars.Thirst.value = Math.min(maxBar, bars.Thirst.value + 20); // Sube barra de sed
          this.pet.play('idle_eating');  // Reusa animación comer para beber
          currentAction = 'Water';
        }
        if (action === 'Play') {
          bars.Fun.value = Math.min(maxBar, bars.Fun.value + 20);      // Sube barra diversión
          this.pet.play('idle_playing'); // Animación jugando
          currentAction = 'Play';
        }

        setButtonsEnabled(false); // Deshabilitar botones mientras dura la acción
        if (currentActionTimer) currentActionTimer.remove(false); // Eliminar timer anterior si existe

        // Crear temporizador para que la acción dure 10 segundos
        currentActionTimer = this.time.delayedCall(10000, () => {
          this.pet.play('idle_standing'); // Volver a animación de pie
          currentAction = null;            // Termina la acción
          if (!isGameOver) setButtonsEnabled(true); // Reactivar botones si el juego no terminó
        });

        lastUsed[action] = now; // Actualizar cooldown con tiempo actual
      }
    });
  });

  // Evento que baja los valores de las barras periódicamente (cada 5 segundos)
  this.time.addEvent({
    delay: 5000,
    loop: true,
    callback: () => {
      if (isGameOver) return; // No hacer nada si el juego terminó

      // Disminuir barras con diferentes velocidades
      bars.Love.value = Math.max(0, bars.Love.value - 1);
      bars.Hunger.value = Math.max(0, bars.Hunger.value - 2);
      bars.Thirst.value = Math.max(0, bars.Thirst.value - 3);
      bars.Fun.value = Math.max(0, bars.Fun.value - 1.5);
    }
  });

  this.triggerGameOver = triggerGameOver; // Hacer disponible la función para llamar desde update
}

// Función que se ejecuta cada frame (loop principal)
function update() {
  if (isGameOver) return; // No actualizar nada si el juego terminó

  // Dibujar y actualizar las barras en pantalla
  Object.keys(bars).forEach(name => {
    let bar = bars[name];
    bar.bar.clear();                    // Limpiar gráfico anterior
    bar.bar.fillStyle(0x000000, 1);    // Color negro para el borde de la barra
    bar.bar.fillRect(bar.x, bar.y, 150, 20); // Dibujar fondo negro

    // Dibujar barra rellena con el color correspondiente y su proporción
    bar.bar.fillStyle(Phaser.Display.Color.HexStringToColor(bar.color).color, 1);
    bar.bar.fillRect(bar.x, bar.y, 150 * (bar.value / maxBar), 20);

    // Si alguna barra llega a 0, activar game over
    if (bar.value <= 0 && !isGameOver) {
      this.triggerGameOver(name);
    }
  });

  // Si ninguna acción está activa y todas las barras están muy bajas, y no es zombie,
  // poner al gato a dormir (animación sleepy)
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
