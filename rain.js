// rain.js
(function () {
  const STORAGE_KEY = "rainAmount";
  const DEFAULT_DESKTOP = 50;
  const DEFAULT_MOBILE = 35;

  function isMobileNow() {
    return window.innerWidth <= 768;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function getSavedRainAmount() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const num = parseInt(raw, 10);
    if (Number.isFinite(num)) return num;
    return isMobileNow() ? DEFAULT_MOBILE : DEFAULT_DESKTOP;
  }

  function setSavedRainAmount(amount) {
    localStorage.setItem(STORAGE_KEY, String(amount));
  }

  function clearDrops() {
    // IMPORTANT: only remove our rain drops (not every <i> on the page)
    document.querySelectorAll("i.rain-drop").forEach(drop => drop.remove());
  }

  function spawnRain(amount) {
    clearDrops();

    const max = isMobileNow() ? 120 : 200;
    const clamped = clamp(amount, 0, max);

    for (let n = 0; n < clamped; n++) {
      const drop = document.createElement("i");
      drop.className = "rain-drop";

      const size = Math.random() * 3;
      const posX = Math.floor(Math.random() * window.innerWidth);
      const delay = Math.random() * -20;
      const duration = Math.random() * 5;

      drop.style.width = (0.2 + size) + "px";
      drop.style.left = posX + "px";
      drop.style.animationDelay = delay + "s";
      drop.style.animationDuration = (3 + duration) + "s";
      drop.style.top = "0";

      document.body.appendChild(drop);
    }

    setSavedRainAmount(clamped);
  }

  window.Rain = {
    get: getSavedRainAmount,
    set(amount) { spawnRain(amount); },
    increase(stepDesktop = 25, stepMobile = 10) {
      const current = getSavedRainAmount();
      spawnRain(current + (isMobileNow() ? stepMobile : stepDesktop));
    },
    decrease(stepDesktop = 25, stepMobile = 10) {
      const current = getSavedRainAmount();
      spawnRain(current - (isMobileNow() ? stepMobile : stepDesktop));
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    spawnRain(getSavedRainAmount());
  });

  window.addEventListener("resize", () => {
    spawnRain(getSavedRainAmount());
  });
})();
