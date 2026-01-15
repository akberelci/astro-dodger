// Astro Dodger (Phaser.js)
// Features: Start screen, score, high score (localStorage), difficulty scaling, restart

const STORAGE_KEY = "astro_dodger_highscore";

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.player = null;
    this.asteroids = null;

    this.score = 0;
    this.highScore = 0;

    this.alive = false;
    this.gameOverState = false;

    this.spawnEvery = 850;
    this.spawnTimer = 0;

    this.scoreText = null;
    this.highText = null;
    this.centerText = null;

    this.cursors = null;
    this.keys = null;

    this.stars = null;
  }

  create() {
    const { width, height } = this.scale;

    // Star background
    this.stars = this.add.group();
    for (let i = 0; i < 140; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(0.6, 2.0);
      const a = Phaser.Math.FloatBetween(0.08, 0.6);
      const s = this.add.circle(x, y, r, 0xffffff, a);
      s.speed = Phaser.Math.FloatBetween(30, 140);
      this.stars.add(s);
    }

    this.makeTextures();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

    // Player
    this.player = this.physics.add.image(width * 0.2, height * 0.5, "ship");
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(true);
    this.player.setDrag(0.92);
    this.player.setMaxVelocity(420);

    // Asteroids
    this.asteroids = this.physics.add.group();

    // UI
    this.scoreText = this.add.text(16, 14, "Score: 0", {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "18px",
      color: "#ffffff"
    });

    this.highScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
    this.highText = this.add.text(16, 40, `High Score: ${this.highScore}`, {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "18px",
      color: "#ffffff"
    });

    this.centerText = this.add.text(width / 2, height / 2, "", {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "34px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    // Collision
    this.physics.add.overlap(this.player, this.asteroids, () => this.onHit(), null, this);

    // Start menu
    this.showStartScreen();
  }

  update(_, dtMs) {
    const dt = dtMs / 1000;

    this.updateStars(dt);

    if (!this.alive) return;

    // Movement
    const accel = 920;
    let ax = 0, ay = 0;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (left) ax -= accel;
    if (right) ax += accel;
    if (up) ay -= accel;
    if (down) ay += accel;

    this.player.setAcceleration(ax, ay);

    // Asteroid spawning + difficulty scaling
    this.spawnTimer += dtMs;
    if (this.spawnTimer >= this.spawnEvery) {
      this.spawnTimer = 0;
      this.spawnAsteroid();

      this.spawnEvery = Math.max(260, this.spawnEvery - 10);

      this.score += 1;
      this.scoreText.setText(`Score: ${this.score}`);
    }

    this.asteroids.children.iterate((a) => {
      if (!a) return;
      if (a.x < -80) a.destroy();
    });
  }

  showStartScreen() {
    this.alive = false;
    this.gameOverState = false;
    this.physics.pause();

    this.score = 0;
    this.spawnEvery = 850;
    this.spawnTimer = 0;

    this.scoreText.setText("Score: 0");
    this.highText.setText(`High Score: ${this.highScore}`);

    this.centerText.setText("ASTRO DODGER\n\nPress SPACE or Click to Start");

    this.asteroids.clear(true, true);

    const start = () => this.startGame();
    this.input.once("pointerdown", start);
    this.input.keyboard.once("keydown-SPACE", start);
  }

  startGame() {
    if (this.alive) return;

    this.centerText.setText("");
    this.alive = true;
    this.physics.resume();

    this.player.clearTint();
    this.player.setVelocity(0, 0);
    this.player.setAcceleration(0, 0);
  }

  onHit() {
    if (!this.alive) return;

    this.alive = false;
    this.gameOverState = true;

    this.physics.pause();
    this.player.setTint(0xff6677);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(STORAGE_KEY, String(this.highScore));
    }
    this.highText.setText(`High Score: ${this.highScore}`);

    this.centerText.setText(
      `GAME OVER\nScore: ${this.score}\nHigh Score: ${this.highScore}\n\nPress SPACE or Click to Restart`
    );

    const restart = () => this.scene.restart();
    this.input.once("pointerdown", restart);
    this.keys.SPACE.once("down", restart);
  }

  spawnAsteroid() {
    const { width, height } = this.scale;

    const x = width + 50;
    const y = Phaser.Math.Between(40, height - 40);

    const a = this.asteroids.create(x, y, "asteroid");
    a.setCircle(16);
    a.setOffset(2, 2);

    const speed = Phaser.Math.Between(220, 520);
    a.setVelocityX(-speed);
    a.setVelocityY(Phaser.Math.Between(-40, 40));
    a.setAngularVelocity(Phaser.Math.Between(-220, 220));

    const scale = Phaser.Math.FloatBetween(0.6, 1.35);
    a.setScale(scale);
    a.setImmovable(true);
  }

  updateStars(dt) {
    const { width, height } = this.scale;
    this.stars.children.iterate((s) => {
      s.x -= s.speed * dt;
      if (s.x < -10) {
        s.x = width + 10;
        s.y = Phaser.Math.Between(0, height);
      }
    });
  }

  makeTextures() {
    if (this.textures.exists("ship") && this.textures.exists("asteroid")) return;

    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0x66ccff, 1);
    g.beginPath();
    g.moveTo(18, 0);
    g.lineTo(0, 40);
    g.lineTo(18, 32);
    g.lineTo(36, 40);
    g.closePath();
    g.fillPath();
    g.generateTexture("ship", 36, 40);

    g.clear();
    g.fillStyle(0xb9b9b9, 1);
    g.fillCircle(18, 18, 18);
    g.fillStyle(0x9a9a9a, 1);
    g.fillCircle(12, 12, 6);
    g.fillCircle(24, 22, 5);
    g.generateTexture("asteroid", 36, 36);

    g.destroy();
  }
}

window.onload = () => {
  new Phaser.Game({
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: "#050612",
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scene: [GameScene]
  });
};
