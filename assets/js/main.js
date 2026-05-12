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

const HERO_FADE_MS = 520;

function initVideoHero() {
  const stack = document.querySelector("[data-video-hero-stack]");
  if (!stack) return;
  const layers = stack.querySelectorAll("[data-video-hero-layer]");
  if (layers.length < 2) return;
  const heroSection = stack.closest(".video-hero");
  if (!heroSection) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const slowNetwork = Boolean(connection && typeof connection.effectiveType === "string" && connection.effectiveType.includes("2g"));
  const enableFallback = () => {
    heroSection.classList.add("is-fallback");
  };

  if (prefersReducedMotion || saveData || slowNetwork) {
    enableFallback();
    return;
  }

  const videos = [
    "https://cdn.pixabay.com/video/2018/07/14/17285-280038627_tiny.mp4",
    "https://cdn.pixabay.com/video/2018/06/09/16685-274413239_tiny.mp4",
    "https://cdn.pixabay.com/video/2024/06/13/216620_large.mp4",
  ];
  let videoIndex = 0;

  let topEl = layers[0];
  let baseEl = layers[1];

  baseEl.classList.add("is-hero-base");
  topEl.classList.add("is-hero-top");

  const ensureSource = (video) => {
    let source = video.querySelector("source");
    if (!source) {
      source = document.createElement("source");
      source.type = "video/mp4";
      video.appendChild(source);
    }
    return source;
  };

  const playClipOn = (video, index) => {
    const source = ensureSource(video);
    source.src = videos[index];
    video.load();
    return video.play();
  };

  const startFirstClip = () => {
    playClipOn(topEl, videoIndex).catch(() => {
      enableFallback();
    });
  };

  const finishCrossfade = (outgoing, incoming) => {
    outgoing.pause();
    outgoing.classList.remove("is-hero-top", "is-hero-visible");
    outgoing.classList.add("is-hero-base");

    incoming.classList.remove("is-hero-base");
    incoming.classList.add("is-hero-top", "is-hero-visible");

    topEl = incoming;
    baseEl = outgoing;
  };

  const crossfadeToNext = () => {
    videoIndex = (videoIndex + 1) % videos.length;
    const outgoing = topEl;
    const incoming = baseEl;

    const source = ensureSource(incoming);
    source.src = videos[videoIndex];
    incoming.load();

    const runFade = () => {
      incoming.play().catch(() => {
        enableFallback();
      });
      incoming.classList.add("is-hero-visible");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          outgoing.classList.remove("is-hero-visible");
        });
      });

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        outgoing.removeEventListener("transitionend", onTransitionEnd);
        finishCrossfade(outgoing, incoming);
      };

      const onTransitionEnd = (ev) => {
        if (ev.target !== outgoing || ev.propertyName !== "opacity") return;
        settle();
      };

      outgoing.addEventListener("transitionend", onTransitionEnd);
      window.setTimeout(settle, HERO_FADE_MS + 80);
    };

    const tryIncomingReady = () => {
      if (incoming.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      incoming.removeEventListener("loadeddata", tryIncomingReady);
      incoming.currentTime = 0;
      runFade();
    };

    incoming.addEventListener("loadeddata", tryIncomingReady);
    incoming.addEventListener(
      "error",
      () => {
        enableFallback();
      },
      { once: true }
    );
    tryIncomingReady();
  };

  const loadAndPlay = () => {
    const markTopReady = () => {
      topEl.classList.add("is-hero-visible");
    };
    topEl.addEventListener("loadeddata", markTopReady, { once: true });
    if (topEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markTopReady();
    }
    topEl.addEventListener("error", enableFallback);
    baseEl.addEventListener("error", enableFallback);

    const onEnded = (ev) => {
      if (ev.target !== topEl) return;
      crossfadeToNext();
    };
    topEl.addEventListener("ended", onEnded);
    baseEl.addEventListener("ended", onEnded);

    startFirstClip();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadAndPlay, { timeout: 1500 });
  } else {
    window.setTimeout(loadAndPlay, 300);
  }
}

function initVideoHeroParallax() {
  const stack = document.querySelector("[data-video-hero-stack]");
  if (!stack) return;
  const heroSection = stack.closest(".video-hero");
  if (!heroSection) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const PARALLAX_STRENGTH = 1;

  let heroHeight = 0;
  let heroDocTop = 0;

  const measure = () => {
    const rect = heroSection.getBoundingClientRect();
    heroHeight = rect.height || 1;
    heroDocTop = rect.top + (window.scrollY || window.pageYOffset);
  };

  let rafId = 0;

  const apply = () => {
    rafId = 0;
    const scrollY = window.scrollY || window.pageYOffset;
    const scrolledWithinHero = Math.min(Math.max(0, scrollY - heroDocTop), heroHeight);
    const offsetPx = scrolledWithinHero * PARALLAX_STRENGTH;
    stack.style.setProperty("--video-hero-parallax-y", `${offsetPx}px`);
  };

  const schedule = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(apply);
  };

  const onResize = () => {
    measure();
    schedule();
  };

  measure();
  apply();

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize, { once: true });

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(onResize);
    ro.observe(heroSection);
  }

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", schedule);
  }
}

function initVimeoScrollAutoplay() {
  const iframes = Array.from(document.querySelectorAll('iframe[src*="player.vimeo.com"]'));
  if (!iframes.length || !("IntersectionObserver" in window)) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const loadVimeoApi = () =>
    new Promise((resolve, reject) => {
      if (window.Vimeo?.Player) {
        resolve(window.Vimeo);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      script.onload = () => resolve(window.Vimeo);
      script.onerror = () => reject(new Error("Vimeo Player API failed to load"));
      document.head.appendChild(script);
    });

  loadVimeoApi()
    .then((Vimeo) => {
      if (!Vimeo?.Player) return;

      iframes.forEach((iframe) => {
        let playerPromise;

        const getPlayer = () => {
          if (!playerPromise) {
            playerPromise = Promise.resolve(new Vimeo.Player(iframe));
          }
          return playerPromise;
        };

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                getPlayer().then(async (player) => {
                  try {
                    await player.setVolume(1);
                    await player.play();
                  } catch {
                    /* Browser autoplay policy may block unmuted playback without prior gesture. */
                  }
                });
              } else if (playerPromise) {
                playerPromise.then(async (player) => {
                  try {
                    await player.pause();
                  } catch {
                    /* ignore */
                  }
                });
              }
            });
          },
          { threshold: 0.3, rootMargin: "0px 0px -8% 0px" }
        );

        observer.observe(iframe);
      });
    })
    .catch(() => {});
}

initVideoHero();
initVideoHeroParallax();
initVimeoScrollAutoplay();

function parseDimsFromFilename(name) {
  const wh = /w_(\d+),h_(\d+)/.exec(name);
  if (wh) {
    return { w: Number(wh[1]), h: Number(wh[2]) };
  }
  const wOnly = /w_(\d+)/.exec(name);
  if (wOnly) {
    const ww = Number(wOnly[1]);
    return { w: ww, h: Math.max(400, Math.round(ww * 0.65)) };
  }
  return { w: 1200, h: 800 };
}

function carouselSrcFromBase(baseDir, file) {
  const normalized = baseDir.endsWith("/") ? baseDir : `${baseDir}/`;
  return `${normalized}${encodeURIComponent(file)}`;
}

function buildSlidesFromManifest(track, manifest, baseDir) {
  track.textContent = "";
  const list = Array.isArray(manifest) ? manifest : manifest?.images;
  if (!Array.isArray(list) || list.length === 0) {
    const li = document.createElement("li");
    li.className = "media-carousel-slide media-carousel-slide--empty";
    li.setAttribute("role", "status");
    const p = document.createElement("p");
    p.className = "media-carousel-empty";
    p.textContent =
      "No gallery images yet. Add images to assets/img/carousel/, then run: python3 scripts/generate-carousel-manifest.py";
    li.appendChild(p);
    track.appendChild(li);
    return;
  }

  list.forEach((entry, i) => {
    const file = typeof entry === "string" ? entry : entry?.file;
    if (!file) return;
    const alt =
      (typeof entry === "object" && entry?.alt) || "Earl Cooper campaign photo in Delaware.";
    let w = typeof entry === "object" && entry?.width;
    let h = typeof entry === "object" && entry?.height;
    if (!w || !h) {
      const d = parseDimsFromFilename(file);
      w = d.w;
      h = d.h;
    }
    const li = document.createElement("li");
    li.className = "media-carousel-slide";
    const fig = document.createElement("figure");
    fig.className = "media-carousel-figure";
    const img = document.createElement("img");
    img.src = carouselSrcFromBase(baseDir, file);
    img.alt = alt;
    img.decoding = "async";
    img.loading = i < 3 ? "eager" : "lazy";
    img.width = w;
    img.height = h;
    fig.appendChild(img);
    li.appendChild(fig);
    track.appendChild(li);
  });
}

function attachMediaCarousel(root) {
  const viewport = root.querySelector("[data-carousel-viewport]");
  const track = root.querySelector("[data-carousel-track]");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  const dotsHost = root.querySelector("[data-carousel-dots]");
  if (!viewport || !track || !prevBtn || !nextBtn) return;

  const slides = track.querySelectorAll(".media-carousel-slide");
  const n = slides.length;
  const onlyEmpty = n === 1 && slides[0].classList.contains("media-carousel-slide--empty");

  if (n === 0 || onlyEmpty) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    if (dotsHost) dotsHost.innerHTML = "";
    root.classList.add("media-carousel--empty");
    return;
  }

  root.classList.remove("media-carousel--empty");

  let index = 0;
  const images = Array.from(track.querySelectorAll(".media-carousel-figure img"));

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const circDist = (a, b) => Math.min(Math.abs(a - b), n - Math.abs(a - b));

  const primeNearbyImages = () => {
    images.forEach((img, i) => {
      if (circDist(i, index) <= 1) {
        img.loading = "eager";
      }
    });
  };

  let dotButtons = [];
  let autoplayId = null;
  let intersecting = true;

  const intervalMs = () => (reduceMotion() ? 9000 : 5500);

  const syncDots = () => {
    if (!dotButtons.length) return;
    dotButtons.forEach((btn, i) => {
      const on = i === index;
      btn.setAttribute("aria-current", on ? "true" : "false");
    });
  };

  const applyLayout = () => {
    const w = viewport.clientWidth;
    if (w <= 0) return;
    track.style.width = `${n * w}px`;
    slides.forEach((slide) => {
      slide.style.flex = `0 0 ${w}px`;
      slide.style.width = `${w}px`;
    });
    goTo(index, { instant: true, layoutOnly: true });
  };

  const bumpAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
    const tick = () => {
      if (document.hidden || !intersecting) return;
      if (root.matches(":hover") || root.matches(":focus-within")) return;
      goTo(index + 1);
    };
    autoplayId = window.setInterval(tick, intervalMs());
  };

  const goTo = (nextIndex, { instant = false, layoutOnly = false } = {}) => {
    index = ((nextIndex % n) + n) % n;
    const w = viewport.clientWidth;
    const x = -(index * w);
    const noAnim = instant || reduceMotion();
    if (noAnim) {
      track.classList.add("media-carousel-track--instant");
    }
    track.style.transform = `translate3d(${x}px, 0, 0)`;
    if (noAnim) {
      void track.offsetHeight;
      track.classList.remove("media-carousel-track--instant");
    }
    syncDots();
    primeNearbyImages();
    if (!layoutOnly) {
      bumpAutoplay();
    }
  };

  if (dotsHost) {
    dotsHost.innerHTML = "";
    dotButtons = [];
    for (let i = 0; i < n; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "media-carousel-dot";
      btn.setAttribute("aria-label", `Show photo ${i + 1} of ${n}`);
      btn.addEventListener("click", () => goTo(i));
      dotsHost.appendChild(btn);
      dotButtons.push(btn);
    }
  } else {
    dotButtons = [];
  }

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      applyLayout();
    }, 100);
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        intersecting = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(root);
  }

  applyLayout();
  primeNearbyImages();
  bumpAutoplay();
}

async function initMediaCarousels() {
  const roots = document.querySelectorAll("[data-carousel]");
  for (const root of roots) {
    const manifestUrl = root.getAttribute("data-carousel-manifest");
    const track = root.querySelector("[data-carousel-track]");
    if (manifestUrl && track) {
      const baseDir =
        root.getAttribute("data-carousel-image-base") || manifestUrl.replace(/manifest\.json$/i, "");
      try {
        const res = await fetch(manifestUrl, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        buildSlidesFromManifest(track, data, baseDir);
      } catch (err) {
        console.error("[carousel] manifest failed:", err);
        track.textContent = "";
        const li = document.createElement("li");
        li.className = "media-carousel-slide media-carousel-slide--empty";
        li.setAttribute("role", "alert");
        const p = document.createElement("p");
        p.className = "media-carousel-empty";
        p.textContent =
          "Gallery manifest missing or invalid. Run: python3 scripts/generate-carousel-manifest.py";
        li.appendChild(p);
        track.appendChild(li);
      }
    }
    attachMediaCarousel(root);
  }
}

void initMediaCarousels();
