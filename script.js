const canvas = document.querySelector(".scene__canvas");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const roadmapLinks = [...document.querySelectorAll(".roadmap__link")];
const roadmapPath = document.querySelector(".roadmap__centerline");
const walker = document.querySelector(".roadmap__walker");
const roadCards = [...document.querySelectorAll(".work-sample, .technology-card")];

const pointer = { x: -1000, y: -1000, active: false };
let particles = [];
let width = 0;
let height = 0;
let animationFrame = 0;
let roadCardRects = [];

const colors = [
  [255, 112, 190],
  [133, 129, 255],
  [255, 168, 119],
  [111, 204, 255],
];
let roadmapFrame = 0;

function createParticles() {
  const count = Math.min(56, Math.max(28, Math.round((width * height) / 24000)));

  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.8 + 0.7,
    speedX: (Math.random() - 0.5) * 0.32,
    speedY: (Math.random() - 0.5) * 0.32,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: Math.random() * 0.48 + 0.2,
  }));
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  width = bounds.width;
  height = bounds.height;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  createParticles();
  draw();
}

function draw() {
  context.clearRect(0, 0, width, height);

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];

    if (!reducedMotion.matches) {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < -5) particle.x = width + 5;
      if (particle.x > width + 5) particle.x = -5;
      if (particle.y < -5) particle.y = height + 5;
      if (particle.y > height + 5) particle.y = -5;

      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        const radius = 130;

        if (distanceSquared > 0 && distanceSquared < radius * radius) {
          const distance = Math.sqrt(distanceSquared);
          const force = ((radius - distance) / radius) * 0.72;
          particle.x += (dx / distance) * force;
          particle.y += (dy / distance) * force;
        }
      }
    }

    const [red, green, blue] = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${particle.alpha})`;
    context.fill();

    for (let j = i + 1; j < particles.length; j += 1) {
      const neighbor = particles[j];
      const dx = particle.x - neighbor.x;
      const dy = particle.y - neighbor.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < 105 * 105) {
        const distance = Math.sqrt(distanceSquared);
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(neighbor.x, neighbor.y);
        context.strokeStyle = `rgba(207, 189, 255, ${(1 - distance / 105) * 0.11})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
    }
  }

  if (!reducedMotion.matches) {
    animationFrame = window.requestAnimationFrame(draw);
  }
}

function updateMotionPreference() {
  window.cancelAnimationFrame(animationFrame);
  draw();
  updateRoadmap();
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});

document.addEventListener("pointerleave", () => {
  pointer.active = false;
});

function measureRoadCards() {
  for (const card of roadCards) {
    card.style.removeProperty("--road-x");
    card.style.removeProperty("--road-y");
    card.style.removeProperty("--road-scale");
    card.style.removeProperty("--road-opacity");
    card.style.removeProperty("--road-bounce");
  }

  roadCardRects = roadCards.map((card) => {
    const bounds = card.getBoundingClientRect();
    return {
      left: bounds.left + window.scrollX,
      top: bounds.top + window.scrollY,
      width: bounds.width,
      height: bounds.height,
    };
  });
}

function updateRoadmap() {
  if (roadmapFrame) return;

  roadmapFrame = window.requestAnimationFrame(() => {
    roadmapFrame = 0;
    const readingLine = window.innerHeight * 0.45;
    let activeLink = roadmapLinks[0];

    for (const link of roadmapLinks) {
      const section = document.querySelector(link.hash);
      if (section && section.getBoundingClientRect().top <= readingLine) {
        activeLink = link;
      }
    }

    for (const link of roadmapLinks) {
      const isCurrent = link === activeLink;
      link.classList.toggle("is-active", isCurrent);

      if (isCurrent) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
    const pathLength = roadmapPath.getTotalLength();
    const distance = Math.max(0, Math.min(1, progress)) * pathLength;
    const point = roadmapPath.getPointAtLength(distance);
    const nextPoint = roadmapPath.getPointAtLength(Math.min(distance + 1, pathLength));
    const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI + 90;

    walker.style.transform = `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)`;
    updateRoadCards();
  });
}

function updateRoadCards() {
  if (roadCards.length === 0) return;

  const start = window.innerHeight * 0.95;
  const end = window.innerHeight * 0.6;
  const shoes = [...walker.querySelectorAll(".roadmap__shoe")];
  const shoeBounds = shoes.map((shoe) => shoe.getBoundingClientRect());
  const startX = shoeBounds.reduce((sum, bounds) => sum + bounds.left + bounds.width / 2, 0) / shoeBounds.length;
  const startY = Math.max(...shoeBounds.map((bounds) => bounds.bottom));

  for (let index = 0; index < roadCards.length; index += 1) {
    const card = roadCards[index];
    const bounds = roadCardRects[index];
    const cardTop = bounds.top - window.scrollY;
    const progress = reducedMotion.matches
      ? 1
      : Math.max(0, Math.min(1, (start - cardTop) / (start - end)));
    const offsetX = startX - (bounds.left - window.scrollX + bounds.width / 2);
    const offsetY = startY - (cardTop + bounds.height / 2);
    const staggeredProgress = reducedMotion.matches
      ? 1
      : Math.max(0, Math.min(1, progress * 1.3 - (index % 3) * 0.12));
    const easedProgress = staggeredProgress ** 3 *
      (staggeredProgress * (staggeredProgress * 6 - 15) + 10);
    const bounce = reducedMotion.matches
      ? 0
      : -16 * Math.sin(staggeredProgress * Math.PI) * (1 - staggeredProgress);

    card.style.setProperty("--road-x", `${offsetX * (1 - easedProgress)}px`);
    card.style.setProperty("--road-y", `${offsetY * (1 - easedProgress)}px`);
    card.style.setProperty("--road-scale", `${0.12 + easedProgress * 0.88}`);
    card.style.setProperty("--road-opacity", `${Math.min(1, staggeredProgress * 2.5)}`);
    card.style.setProperty("--road-bounce", `${bounce}px`);
  }
}

function handleResize() {
  resizeCanvas();
  measureRoadCards();
  updateRoadmap();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.cancelAnimationFrame(animationFrame);
  } else {
    draw();
  }
});

window.addEventListener("scroll", updateRoadmap, { passive: true });
window.addEventListener("resize", handleResize);
document.addEventListener(
  "toggle",
  (event) => {
    if (event.target instanceof HTMLDetailsElement && event.target.matches(".work-sample")) {
      measureRoadCards();
      updateRoadmap();
    }
  },
  true,
);
measureRoadCards();
updateRoadmap();
reducedMotion.addEventListener("change", updateMotionPreference);
resizeCanvas();