(() => {
  const canvas = document.getElementById("night-sky");

  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;

  let stars = [];

  const STAR_COUNT = 130;

  function resize() {
    width = canvas.width = window.innerWidth;

    height = canvas.height = window.innerHeight;

    createStars();
  }

  function createStars() {
    stars = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,

        y: Math.random() * height,

        radius: Math.random() * 1.2 + 0.2,

        alpha: Math.random() * 0.55 + 0.15,

        phase: Math.random() * Math.PI * 2,

        speed: Math.random() * 0.0015 + 0.0005,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      const twinkle = Math.sin(time * star.speed + star.phase) * 0.15;

      const alpha = Math.max(0.05, star.alpha + twinkle);

      ctx.beginPath();

      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;

      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);

  resize();

  requestAnimationFrame(draw);
})();
