document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const resultScreen = document.getElementById("result-screen");
  const startButton = document.getElementById("start-button");
  const gameBg = document.querySelector("#game-screen .full-screen");
  const hammer = document.getElementById("hammer");
  const powerLevelEl = document.getElementById("power-level");
  const resultImage = document.getElementById("result-image");
  const newGameButton = document.getElementById("new-game-button");
  const hitArea = document.getElementById("hit-area");
  let hitEnabled = false;

  let power = 0;
  let direction = 1;
  let speed = 0.5;

  function showScreen(screen) {
    [startScreen, gameScreen, resultScreen].forEach((s) =>
      s.classList.add("hidden")
    );
    screen.classList.remove("hidden");
  }

  function startGame() {
    power = 0;
    direction = 1;
    powerLevelEl.style.height = "0%";
    showScreen(gameScreen);
    hitEnabled = true;
    hammer.classList.add("hidden");

    meterInterval = setInterval(() => {
      power += direction * speed;
      if (power >= 100) {
        power = 100;
        direction = -1;
      }
      if (power <= 0) {
        power = 0;
        direction = 1;
      }
      if (Math.random() < 0.02) direction *= -1;
      powerLevelEl.style.height = power + "%";
    }, 20);
  }

  function endGame(success) {
    clearInterval(meterInterval);
    hitEnabled = false;
    if (success) {
      resultImage.src = "Победа.png";
    } else {
      resultImage.src = "Поражение.png";
    }
    setTimeout(() => showScreen(resultScreen), 500);
  }

  function handleHit() {
    if (!hitEnabled) return;
    hitEnabled = false;
    clearInterval(meterInterval);
    hammer.classList.remove("hidden");
    hammer.style.animation = "hit 0.4s ease-in-out";
    hammer.addEventListener(
      "animationend",
      () => {
        powerLevelEl.style.height = power + "%";
        hammer.classList.add("hidden");
        const spark = document.createElement("div");
        spark.className = "spark";
        document.getElementById("game-screen").appendChild(spark);
        spark.addEventListener("animationend", () => spark.remove(), {
          once: true,
        });
        const success = power > 80;
        endGame(success);
      },
      { once: true }
    );
  }

  startButton.addEventListener("click", startGame);
  hitArea.addEventListener("click", handleHit);
  newGameButton.addEventListener("click", startGame);
});
