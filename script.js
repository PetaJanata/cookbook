// ================================
// HERO CAROUSEL
// ================================

// Hard-coded images (replace with your actual image paths)
let carouselImages = [
  "images/photo1.jpg",
  "images/photo2.jpg",
  "images/photo3.jpg",
  "images/photo4.jpg",
  "images/photo5.jpg",
  "images/photo6.jpg",
  "images/photo7.jpg",
  "images/photo8.jpg",
  "images/photo9.jpg",
  "images/photo10.jpg"
];

// Shuffle function for carousel
function shuffleImages(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Shuffle images initially
carouselImages = shuffleImages(carouselImages);

// Create carousel container
const heroSection = document.querySelector(".hero");
const carouselContainer = document.createElement("div");
carouselContainer.classList.add("hero-carousel");

heroSection.insertBefore(carouselContainer, heroSection.querySelector(".hero-buttons"));

// Carousel state
let currentIndex = 0;
const visibleCount = 5; // main + 2 layers on each side

function getVisibleIndexes(centerIndex) {
  const total = carouselImages.length;
  let indexes = [];
  for (let i = -2; i <= 2; i++) {
    let idx = (centerIndex + i + total) % total;
    indexes.push(idx);
  }
  return indexes;
}

function renderCarousel() {
  carouselContainer.innerHTML = "";
  const indexes = getVisibleIndexes(currentIndex);

  indexes.forEach((imgIdx, position) => {
    const img = document.createElement("img");
    img.src = carouselImages[imgIdx];
    img.classList.add("carousel-img");

    // Set classes for position (main, first, second)
    if (position === 2) img.classList.add("main-img");
    else if (position === 1 || position === 3) img.classList.add("first-layer");
    else img.classList.add("second-layer");

    // Clickable side images
    if (position === 1 || position === 3) {
      img.addEventListener("click", () => {
        currentIndex = position < 2
          ? (currentIndex - 1 + carouselImages.length) % carouselImages.length
          : (currentIndex + 1) % carouselImages.length;
        renderCarousel();
      });
    }

    carouselContainer.appendChild(img);
  });
}

// Initial render
renderCarousel();

// Make carousel responsive on resize
window.addEventListener("resize", renderCarousel);



// ================================ 
// GLOBAL VARIABLES
// ================================
let videos = []; // holds all video metadata from CSV
let activeFilter = null; // current active filter
const gallery = document.getElementById("video-gallery");

// ================================
// SHUFFLE FUNCTION (Fisher–Yates)
// ================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ================================
// FILTER FUNCTION (NOW WITH shouldScroll)
// ================================
function applyFilter(filterValue, shouldScroll = false) {
  activeFilter = filterValue;

  // Update button active styles
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));

  if (filterValue === null) {
    document.getElementById("btn-all")?.classList.add("active");
  }
  else if (filterValue === "Peťák a Renča") {
    document.getElementById("btn-renča")?.classList.add("active");
  }
  else if (filterValue === "Peťa a Peťa") {
    document.getElementById("btn-peta")?.classList.add("active");
  }

  const filteredVideos = !filterValue ? [...videos] : videos.filter(v => v.button === filterValue);
  const shuffledVideos = shuffleArray(filteredVideos);

  loadGallery(shuffledVideos);
  lazyLoadVideos();

  // 🔥 Only scroll when user clicks a filter
 if (shouldScroll) {
  document.getElementById("video-gallery")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


}

// ================================
// LAZY LOAD + AUTO-PAUSE VIDEOS
// ================================
let lazyObserver = null;
let pauseObserver = null;
let visibilityCheckAttached = false;

function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");

  const loadVideo = video => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
    video.play().catch(() => {});
  };

  // Lazy Observer
  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadVideo(entry.target);
          lazyObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "400px 0px", threshold: 0.1 });
  }

  videoElements.forEach(video => lazyObserver.observe(video));

  // Extra visibility check
  if (!visibilityCheckAttached) {
    const checkVisible = () => {
      document.querySelectorAll("video[data-src]").forEach(video => {
        const rect = video.getBoundingClientRect();
        if (rect.top < window.innerHeight + 300 && rect.bottom > -300) {
          loadVideo(video);
        }
      });
    };
    window.addEventListener("scroll", checkVisible, { passive: true });
    window.addEventListener("resize", checkVisible);
    visibilityCheckAttached = true;
  }

  // Pause Observer
  if (!pauseObserver) {
    pauseObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (!entry.isIntersecting) video.pause();
        else if (video.paused && !video.dataset.src) video.play().catch(() => {});
      });
    }, { threshold: 0.25 });
  }

  document.querySelectorAll("video").forEach(video => pauseObserver.observe(video));
}

// ================================
// LOAD GALLERY
// ================================
function loadGallery(videoList) {
  if (!gallery) return;
  gallery.innerHTML = "";

  videoList.forEach(v => {
    if (!v.src480) return;

    const card = document.createElement("div");
    card.classList.add("video-card");
    card.style.position = "relative";

    const video = document.createElement("video");
    video.dataset.src = v.src480;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    if (v.znam === "znám") {
      video.classList.add("know-green");
    } else if (v.znam === "potřebuju zlepšit") {
      video.classList.add("know-yellow");
    } else if (v.znam === "neznám") {
      video.classList.add("know-red");
    }

    const speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "1×";
    card.appendChild(speedIcon);

    card.addEventListener("mouseenter", () => {
      speedIcon.style.display = "block";
    });
    card.addEventListener("mouseleave", () => {
      speedIcon.style.display = "none";
    });

    attachSpeedScroll(video, speedIcon, true);

    video.style.cursor = "default";
    card.appendChild(video);

    if (v.hd) {
      const fullscreenIcon = document.createElement("div");
      fullscreenIcon.classList.add("fullscreen-icon");
      fullscreenIcon.innerHTML = "⤢";
      card.appendChild(fullscreenIcon);

      card.addEventListener("mouseenter", () => {
        fullscreenIcon.style.display = "block";
      });
      card.addEventListener("mouseleave", () => {
        fullscreenIcon.style.display = "none";
      });

      fullscreenIcon.addEventListener("click", () => openOverlay(v));
    }

    gallery.appendChild(card);
  });
}

// ================================
// OPEN OVERLAY
// ================================
function openOverlay(videoObj) {
  const { hd, alt } = videoObj;
  if (!hd) return;

  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const videoContainer = document.createElement("div");
  videoContainer.style.display = "flex";
  videoContainer.style.gap = "20px";
  overlay.appendChild(videoContainer);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  function createVideoWrapper(src, muted = true) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";

    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.muted = muted;
    video.classList.add("overlay-video");

    wrapper.appendChild(video);
    return { wrapper, video };
  }

  const main = createVideoWrapper(hd, false);
  videoContainer.appendChild(main.wrapper);

  let altWrapper, mainButton, altButton, backBtn;

  if (alt) {
    altWrapper = createVideoWrapper(alt, true);
    altWrapper.wrapper.style.display = "none";
    videoContainer.appendChild(altWrapper.wrapper);

    mainButton = document.createElement("button");
    mainButton.textContent = "Ukaž video z jiného úhlu";
    mainButton.style.marginTop = "10px";
    main.wrapper.appendChild(mainButton);

    const showDualView = () => {
      overlay.classList.add("dual-view");
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      main.video.play().catch(() => {});
      altWrapper.video.play().catch(() => {});

      mainButton.textContent = "pohled 1";
      if (altButton) altButton.remove();

      altButton = document.createElement("button");
      altButton.textContent = "pohled 2";
      altButton.style.marginTop = "10px";
      altWrapper.wrapper.appendChild(altButton);

      mainButton.onclick = showMainOnly;
      altButton.onclick = showAltOnly;
    };

    const showMainOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "none";

      main.video.muted = false;
      altWrapper.video.muted = true;

      mainButton.textContent = "Ukaž video z jiného úhlu";
      altButton?.remove();
      altButton = null;

      mainButton.onclick = showDualView;
    };

    const showAltOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "none";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      altWrapper.video.play().catch(() => {});

      altButton?.remove();

      backBtn = document.createElement("button");
      backBtn.textContent = "Ukaž video z jiného úhlu";
      backBtn.style.marginTop = "10px";
      backBtn.addEventListener("click", () => {
        backBtn.remove();
        backBtn = null;
        showDualView();
      });
      altWrapper.wrapper.appendChild(backBtn);
    };

    mainButton.onclick = showDualView;
  }

  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

// ================================
// DOM CONTENT LOADED — INIT
// ================================
window.addEventListener("DOMContentLoaded", () => {

  fetch("videos.csv")
    .then(res => res.text())
    .then(csvText => {
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      videos = results.data.map(row => ({
        src480: row["480p"] || null,
        hd: row["1080p"] || null,
        alt: row["Alt"] || null,
        button: row["Button"] || null,
        znam: row["znám?"] || null
      }));

      console.log("Videos loaded from CSV:", videos);

      // ⛔ NO SCROLL ON PAGE LOAD
      applyFilter(null, false);

      const btnRenCa = document.getElementById("btn-renča");
      const btnPeta = document.getElementById("btn-peta");
      const btnAll = document.getElementById("btn-all");

      if (btnRenCa)
        btnRenCa.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "Peťák a Renča";
          applyFilter(isTogglingOff ? null : "Peťák a Renča", true);
        });

      if (btnPeta)
        btnPeta.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "Peťa a Peťa";
          applyFilter(isTogglingOff ? null : "Peťa a Peťa", true);
        });

      if (btnAll)
        btnAll.addEventListener("click", () => {
          applyFilter(null, true);
        });

    })
    .catch(err => console.error("Error loading CSV:", err));
});

// ================================
// SPEED SCROLL FUNCTION
// ================================
function attachSpeedScroll(video, label, iconOnly = false) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  let index = speeds.indexOf(1);

  const showLabel = () => {
    if (speeds[index] === 1) {
      label.style.display = iconOnly ? "block" : "none";
      label.textContent = "1×";
    } else {
      label.textContent = speeds[index] + "×";
      label.style.display = "block";
    }
  };

  const wheelHandler = e => {
    e.preventDefault();
    if (e.deltaY < 0) index = Math.min(index + 1, speeds.length - 1);
    else index = Math.max(index - 1, 0);

    video.playbackRate = speeds[index];
    showLabel();
  };

  if (iconOnly) {
    label.addEventListener("wheel", wheelHandler);
  } else {
    video.addEventListener("wheel", wheelHandler);
  }

  if (!iconOnly) {
    video.addEventListener("mouseleave", () => {
      if (speeds[index] === 1) label.style.display = "none";
    });
  }
}

// ================================
// HERO BUTTON AUTO-HIDE
// ================================
function isHeroOutOfView() {
  const hero = document.querySelector(".hero");
  const rect = hero.getBoundingClientRect();
  return rect.bottom <= 0;
}

const heroBar = document.querySelector(".hero-buttons");
let hideTimeout = null;

function isScrollOnVideo(e) {
  const el = e.target;
  if (!(el instanceof Element)) return false;
  return el.closest("video") || el.closest(".speed-icon");
}

function showHeroBar() {
  heroBar.classList.remove("hidden-hero");
}

function hideHeroBar() {
  heroBar.classList.add("hidden-hero");
}

function onPageScroll(e) {
  if (isScrollOnVideo(e)) return;

  if (!isHeroOutOfView()) {
    showHeroBar();
    if (hideTimeout) clearTimeout(hideTimeout);
    return;
  }

  showHeroBar();

  if (hideTimeout) clearTimeout(hideTimeout);

  hideTimeout = setTimeout(() => {
    hideHeroBar();
  }, 2000);
}

window.addEventListener("wheel", onPageScroll, { passive: true });
window.addEventListener("scroll", onPageScroll, { passive: true });
