const canvas = document.querySelector(".scene__canvas");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const roadmapLinks = [...document.querySelectorAll(".roadmap__link")];
const roadmapPath = document.querySelector(".roadmap__centerline");
const walker = document.querySelector(".roadmap__walker");
const roadmap = document.querySelector(".roadmap");
const portfolioTabs = [...document.querySelectorAll('[role="tab"]')];
const descriptionMeta = document.querySelector('meta[name="description"]');
const workViewer = document.querySelector("#work-viewer");
const workViewerMedia = workViewer.querySelector(".work-viewer__media");
const workViewerCaption = workViewer.querySelector(".work-viewer__caption");
const roadmapStops = {
  "social-media-tab": [
    { href: "#intro", label: "Intro" },
    { href: "#experience", label: "Experience" },
    { href: "#dela-casa", label: "Dela Casa Radio" },
    { href: "#four-stripes", label: "Four Stripes" },
    { href: "#editing-tools", label: "Editing Tools" },
  ],
  "web-developer-tab": [
    { href: "#web-intro", label: "Intro" },
    { href: "#web-projects", label: "Experience" },
    { href: "#selected-projects", label: "Projects" },
    { href: "#developer-skills", label: "Technical Skills" },
    { href: "#developer-certifications", label: "Certifications" },
  ],
};
const socialRoadCardSelector =
  "#social-media-portfolio .work-sample, #social-media-portfolio .technology-card, #social-media-portfolio .client-proof .work-sample";
const developerRoadCardSelector = [
  "#web-developer-portfolio .developer-project",
  "#web-developer-portfolio .selected-project",
  "#web-developer-portfolio .developer-service",
  "#web-developer-portfolio .developer-certifications",
  "#web-developer-portfolio .client-proof .work-sample",
].join(", ");
let roadCards = [...document.querySelectorAll(socialRoadCardSelector)];

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

function activatePortfolioTab(tab, moveFocus = false) {
  const isSocialMedia = tab.id === "social-media-tab";
  const activeRoadmap = roadmapStops[tab.id];

  for (const portfolioTab of portfolioTabs) {
    const isSelected = portfolioTab === tab;
    portfolioTab.classList.toggle("is-active", isSelected);
    portfolioTab.setAttribute("aria-selected", String(isSelected));
    portfolioTab.tabIndex = isSelected ? 0 : -1;

    if (isSelected) {
      document.title = portfolioTab.dataset.title;
      descriptionMeta.content = portfolioTab.dataset.description;
    }

    const panel = document.getElementById(portfolioTab.getAttribute("aria-controls"));
    panel.hidden = !isSelected;
  }

  if (moveFocus) tab.focus();
  roadmap.hidden = !activeRoadmap;
  if (activeRoadmap) {
    roadmapLinks.forEach((link, index) => {
      link.href = activeRoadmap[index].href;
      link.querySelector(".roadmap__label").textContent = activeRoadmap[index].label;
    });
  }
  const roadCardSelector = isSocialMedia
    ? socialRoadCardSelector
    : tab.id === "web-developer-tab"
      ? developerRoadCardSelector
      : null;
  roadCards = roadCardSelector ? [...document.querySelectorAll(roadCardSelector)] : [];
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  measureRoadCards();
  updateRoadmap();
}

for (const [index, tab] of portfolioTabs.entries()) {
  tab.addEventListener("click", () => activatePortfolioTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % portfolioTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + portfolioTabs.length) % portfolioTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = portfolioTabs.length - 1;
    else return;

    event.preventDefault();
    activatePortfolioTab(portfolioTabs[nextIndex], true);
  });
}

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
    const readingLine = window.innerHeight * 0.2;
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

async function findPortfolioMedia(prefix, index) {
  for (const extension of ["jpg", "jpeg", "png", "webp", "gif"]) {
    const image = new Image();
    const loaded = await new Promise((resolve) => {
      image.addEventListener("load", () => resolve(true), { once: true });
      image.addEventListener("error", () => resolve(false), { once: true });
      image.src = `assets/${prefix}${index}.${extension}`;
    });

    if (loaded) return { type: "image", src: image.src };
  }

  for (const extension of ["mp4", "webm"]) {
    const video = document.createElement("video");
    const loaded = await new Promise((resolve) => {
      const timeout = window.setTimeout(() => resolve(false), 5000);
      video.addEventListener(
        "loadedmetadata",
        () => {
          window.clearTimeout(timeout);
          resolve(true);
        },
        { once: true },
      );
      video.addEventListener(
        "error",
        () => {
          window.clearTimeout(timeout);
          resolve(false);
        },
        { once: true },
      );
      video.preload = "metadata";
      video.src = `assets/${prefix}${index}.${extension}`;
    });

    if (loaded) return { type: "video", src: video.src };
  }

  return null;
}

function createPortfolioWorkSample(media, index, portfolioName) {
  const sample = document.createElement("details");
  sample.className = "work-sample";

  const trigger = document.createElement("summary");
  trigger.className = "work-sample__trigger";

  const preview = document.createElement("span");
  preview.className = "work-sample__preview work-sample__preview--poster";

  const number = String(index).padStart(2, "0");
  const label = document.createElement("span");
  label.className = "work-sample__index";
  label.textContent = `${number} / ${portfolioName.toUpperCase()}`;

  let workMedia;
  if (media.type === "video") {
    workMedia = document.createElement("video");
    workMedia.className = "work-sample__image work-sample__video";
    workMedia.src = media.src;
    workMedia.muted = true;
    workMedia.preload = "metadata";
    workMedia.playsInline = true;

    const play = document.createElement("span");
    play.className = "work-sample__play";
    play.setAttribute("aria-hidden", "true");
    preview.append(play);
  } else {
    workMedia = document.createElement("img");
    workMedia.className = "work-sample__image";
    workMedia.src = media.src;
    workMedia.alt = portfolioName === "Client Proof"
      ? `Web development proof ${index}`
      : `${portfolioName} social media work sample ${index}`;
  }

  const plus = document.createElement("span");
  plus.className = "work-sample__plus";
  plus.setAttribute("aria-hidden", "true");
  plus.textContent = "+";

  const caption = document.createElement("span");
  caption.className = "work-sample__caption";
  caption.textContent = `${portfolioName} — ${number}`;

  const detail = document.createElement("p");
  detail.className = "work-sample__detail";
  detail.textContent = media.type === "video" ? "Select to play video." : "Select to view full size.";

  preview.append(label, workMedia, plus);
  trigger.append(preview, caption);
  sample.append(trigger, detail);
  sample.dataset.mediaType = media.type;

  return sample;
}

async function loadPortfolioWork(prefix, portfolioName, galleryId) {
  const gallery = document.getElementById(galleryId);
  const samples = [];

  for (let index = 1; ; index += 1) {
    const media = await findPortfolioMedia(prefix, index);
    if (!media) break;
    samples.push(createPortfolioWorkSample(media, index, portfolioName));
  }

  gallery.append(...samples);

  if (samples.length > 0) {
    roadCards = [...document.querySelectorAll(socialRoadCardSelector)];
    measureRoadCards();
    updateRoadmap();
  }
}

async function findProofMedia(folder, filename) {
  const image = new Image();
  const loaded = await new Promise((resolve) => {
    image.addEventListener("load", () => resolve(true), { once: true });
    image.addEventListener("error", () => resolve(false), { once: true });
    image.src = `assets/${folder}/${filename}`;
  });

  return loaded ? { type: "image", src: image.src } : null;
}

async function loadClientProof(galleryId = "client-proof-grid", proofMode = "development") {
  const gallery = document.getElementById(galleryId);
  if (!gallery) return;

  const proofFiles = proofMode === "development"
    ? [
        { filename: "Gemini_Generated_Image_4l35nq4l35nq4l35.jpg", title: "FCMS Dashboard" },
        { filename: "efc02f0a-e13f-482a-8560-5036dde48bc7.webp", title: "AEVM Age Groups" },
      ]
    : [
        { filename: "image.png", title: "Zoom Client Meeting" },
      ];
  const folder = proofMode === "development" ? "proofs" : "smmproof";

  const samples = [];
  let proofIndex = 1;
  for (const proof of proofFiles) {
    const { filename } = proof;
    const title = proof.title;
    const media = await findProofMedia(folder, filename);
    if (media) {
      const sample = createPortfolioWorkSample(media, proofIndex, proofMode === "development" ? "Client Proof" : "Social Media Proof");
      sample.querySelector(".work-sample__caption").textContent = title;
      sample.querySelector(".work-sample__image").alt = title;
      samples.push(sample);
      proofIndex += 1;
    }
  }

  gallery.append(...samples);

  if (samples.length > 0) {
    roadCards = [...document.querySelectorAll(
      proofMode === "development" ? developerRoadCardSelector : socialRoadCardSelector,
    )];
    measureRoadCards();
    updateRoadmap();
  }
}

document.addEventListener("click", (event) => {
  const summary = event.target.closest(".work-sample__trigger");
  if (!summary) return;

  event.preventDefault();
  const sample = summary.closest(".work-sample");
  const source = sample.querySelector(".work-sample__image");
  workViewerMedia.replaceChildren();
  workViewerCaption.textContent = summary.querySelector(".work-sample__caption").textContent;

  if (sample.dataset.mediaType === "video") {
    const video = document.createElement("video");
    video.className = "work-viewer__video";
    video.src = source.currentSrc || source.src;
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    workViewerMedia.append(video);
  } else {
    const image = document.createElement("img");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    workViewerMedia.append(image);
  }

  document.body.classList.add("is-viewer-open");
  workViewer.showModal();
});

workViewer.addEventListener("click", (event) => {
  if (event.target === workViewer) workViewer.close();
});

workViewer.querySelector(".work-viewer__close").addEventListener("click", () => {
  workViewer.close();
});

workViewer.addEventListener("close", () => {
  document.body.classList.remove("is-viewer-open");
  workViewerMedia.replaceChildren();
});

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
loadPortfolioWork("dlc", "Dela Casa Radio", "dela-work-grid");
loadPortfolioWork("fs", "Four Stripes", "four-stripes-work-grid");
loadClientProof("smm-client-proof-grid", "social");
loadClientProof("client-proof-grid", "development");
reducedMotion.addEventListener("change", updateMotionPreference);
resizeCanvas();