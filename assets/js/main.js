const menuButton = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-site-nav]");
const yearNode = document.querySelector("[data-year]");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const currentPath = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll("[data-nav-link]").forEach((link) => {
  const target = link.getAttribute("href");
  if (!target) return;
  if (target === currentPath || (currentPath === "" && target === "index.html")) {
    link.setAttribute("aria-current", "page");
  }
});

function initVideoHero() {
  const heroVideo = document.querySelector("[data-video-hero]");
  if (!heroVideo) return;
  const heroSection = heroVideo.closest(".video-hero");
  if (!heroSection) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const slowNetwork = Boolean(connection && typeof connection.effectiveType === "string" && connection.effectiveType.includes("2g"));
  const enableFallback = () => {
    heroSection.classList.add("is-fallback");
  };

  // Keep poster-only mode for constrained devices/user preferences.
  if (prefersReducedMotion || saveData || slowNetwork) {
    enableFallback();
    return;
  }

  const videos = [
    "https://cdn.pixabay.com/video/2018/07/14/17285-280038627_tiny.mp4",
    "https://cdn.pixabay.com/video/2018/06/09/16685-274413239_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/06/13/216620_large.mp4",
  ];
  const selectedVideo = videos[Math.floor(Math.random() * videos.length)];

  const loadAndPlay = () => {
    heroVideo.addEventListener(
      "loadeddata",
      () => {
        heroVideo.classList.add("is-ready");
      },
      { once: true }
    );
    heroVideo.addEventListener("error", enableFallback, { once: true });

    const source = document.createElement("source");
    source.src = selectedVideo;
    source.type = "video/mp4";
    heroVideo.appendChild(source);
    heroVideo.load();
    heroVideo.play().catch(() => {
      enableFallback();
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadAndPlay, { timeout: 1500 });
  } else {
    window.setTimeout(loadAndPlay, 300);
  }
}

initVideoHero();
