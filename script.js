(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const loader = document.querySelector("[data-loader]");
  const header = document.querySelector("[data-header]");
  const progressSegments = Array.from(document.querySelectorAll("[data-progress-segment]"));
  const localTime = document.querySelector("[data-local-time]");
  const projects = Array.isArray(window.projects) ? window.projects : [];

<<<<<<< HEAD
  const initSmoothScroll = () => {
    if (prefersReducedMotion || typeof Lenis === "undefined") {
      return null;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.2,
      infinite: false,
      autoResize: true
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
    window.zodiacLenis = lenis;

    return lenis;
  };

  const lenis = initSmoothScroll();

  const stopSmoothScroll = () => {
    window.zodiacLenis?.stop();
  };

  const startSmoothScroll = () => {
    const hasScrollLock =
      body.classList.contains("is-loading") ||
      body.classList.contains("is-work-overlay-open") ||
      body.classList.contains("is-reel-modal-open") ||
      body.classList.contains("is-page-transitioning");

    if (!hasScrollLock) {
      window.zodiacLenis?.start();
    }
  };

  const categories = {
    all: {
      title: "All Work",
      subtitle: "Selected VFX, CGI, music video, film, billboard, and commercial work by Zodiac II Media."
    },
    commercial: {
      title: "Commercial",
      subtitle: "Selected commercial, CGI, and VFX work by Zodiac II Media."
    },
    "music-video": {
      title: "Music Video",
      subtitle: "Selected music video VFX, cleanup, compositing, and cinematic image work."
    },
    film: {
      title: "Film",
      subtitle: "Selected cinematic VFX, film, brand film, and environment work by Zodiac II Media."
    },
    billboard: {
      title: "Billboard",
      subtitle: "Selected billboard, outdoor, LED, and large-format visual work by Zodiac II Media."
    }
  };

=======
  const categories = {
    all: {
      title: "All Work",
      subtitle: "Selected VFX, CGI, music video, film, billboard, and commercial work by Zodiac II Media."
    },
    commercial: {
      title: "Commercial",
      subtitle: "Selected commercial, CGI, and VFX work by Zodiac II Media."
    },
    "music-video": {
      title: "Music Video",
      subtitle: "Selected music video VFX, cleanup, compositing, and cinematic image work."
    },
    film: {
      title: "Film",
      subtitle: "Selected cinematic VFX, film, brand film, and environment work by Zodiac II Media."
    },
    billboard: {
      title: "Billboard",
      subtitle: "Selected billboard, outdoor, LED, and large-format visual work by Zodiac II Media."
    }
  };

>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
  const categoryConfig = {
    commercial: {
      title: "Commercial Reel",
      label: "Commercial",
      category: "commercial",
      description: "Commercial CGI, compositing, and visual effects work for brands, campaigns, and premium advertising.",
      url: "reel.html?category=commercial",
      layout: "standard"
    },
    "music-video": {
      title: "Music Video Reel",
      label: "Music Video",
      category: "music-video",
      description: "Cinematic VFX and visual effects work crafted for music videos, artists, and high-impact visual storytelling.",
      url: "reel.html?category=music-video",
      layout: "large"
    },
    film: {
      title: "Film Reel",
      label: "Film",
      category: "film",
      description: "Cinematic film, brand film, environment, invisible VFX, and long-form visual effects work.",
      url: "reel.html?category=film",
      layout: "wide"
    },
    billboard: {
      title: "Billboard Reel",
      label: "Billboard",
      category: "billboard",
      description: "High-impact billboard, LED, outdoor, OOH, and large-format visual work built for public scale.",
      url: "reel.html?category=billboard",
      layout: "standard"
    }
  };

  const getProjectsByCategory = (category) =>
    projects.filter((project) => project.category === category);

  const getCategoryPosterProject = (category) => {
    const categoryProjects = getProjectsByCategory(category);
    return categoryProjects.find((project) => project.featured) || categoryProjects[0] || projects[0];
  };

  const categoryReels = Object.values(categoryConfig).map((config) => {
    const heroProject = getCategoryPosterProject(config.category);

    return {
      ...config,
      poster: heroProject?.image || "assets/images/hero.jpg",
      previewVideo: heroProject?.video || "assets/videos/SHOWREELS_CINEMATIC_v01.webm",
      fullVideo: heroProject?.video || "assets/videos/SHOWREELS_CINEMATIC_v01.webm",
      projectCount: getProjectsByCategory(config.category).length
    };
  });

  const featuredReels = ["music-video", "commercial", "film", "billboard"]
    .map((category) => categoryReels.find((reel) => reel.category === category))
    .filter(Boolean);

  const createOverlay = () => {
    const overlay = document.createElement("div");
    overlay.className = "work-overlay";
<<<<<<< HEAD
    overlay.setAttribute("data-lenis-prevent", "");
=======
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <p class="work-overlay__label">Work Index</p>
      <button class="work-overlay__back" type="button" data-work-close>Back</button>
      <nav class="work-overlay__links" aria-label="Work category navigation">
        <a style="--i:0" href="work.html?category=all">All Work</a>
        <a style="--i:1" href="work.html?category=commercial">Commercial</a>
        <a style="--i:2" href="work.html?category=music-video">Music Video</a>
        <a style="--i:3" href="work.html?category=film">Film</a>
        <a style="--i:4" href="work.html?category=billboard">Billboard</a>
      </nav>
    `;
    document.body.append(overlay);
    return overlay;
  };

  const createReelModal = () => {
    const modal = document.createElement("div");
    modal.className = "reel-modal";
    modal.dataset.reelModal = "";
<<<<<<< HEAD
    modal.setAttribute("data-lenis-prevent", "");
=======
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="reel-modal__backdrop" data-reel-modal-close></div>
      <div class="reel-modal__panel" role="dialog" aria-modal="true" aria-label="Reel video player">
        <div class="reel-modal__video-wrap">
          <video
            class="reel-modal__video"
            data-reel-modal-video
            muted
            loop
            playsinline
            preload="metadata"
          ></video>
        </div>
        <div class="reel-modal__meta">
          <div class="reel-modal__actions">
            <button class="reel-modal__sound" type="button" data-reel-modal-sound>Sound Off</button>
            <a class="reel-modal__work" href="work.html?category=music-video" data-reel-modal-work>View Work</a>
          </div>
        </div>
      </div>
    `;
    document.body.append(modal);
    return modal;
  };

  const workOverlay = createOverlay();
  const closeButton = workOverlay.querySelector("[data-work-close]");
  const reelModal = createReelModal();
  const modalVideo = reelModal.querySelector("[data-reel-modal-video]");
  const modalSound = reelModal.querySelector("[data-reel-modal-sound]");
  const modalWork = reelModal.querySelector("[data-reel-modal-work]");
  const modalCloseButtons = reelModal.querySelectorAll("[data-reel-modal-close]");

  const openWorkOverlay = () => {
    body.classList.add("is-work-overlay-open");
<<<<<<< HEAD
    stopSmoothScroll();
=======
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
    workOverlay.classList.add("is-open");
    workOverlay.setAttribute("aria-hidden", "false");
    closeButton.focus();
  };

  const closeWorkOverlay = () => {
    body.classList.remove("is-work-overlay-open");
    workOverlay.classList.remove("is-open");
    workOverlay.setAttribute("aria-hidden", "true");
<<<<<<< HEAD
    startSmoothScroll();
=======
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
  };

  const openReelModal = (reel) => {
    if (!reelModal || !modalVideo || !reel) return;
    const videoSrc = reel.fullVideo || reel.previewVideo;

    body.classList.add("is-reel-modal-open");
<<<<<<< HEAD
    stopSmoothScroll();
=======
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
    reelModal.classList.add("is-open");
    reelModal.setAttribute("aria-hidden", "false");

    modalWork.href = `work.html?category=${reel.category}`;

    modalVideo.poster = reel.poster || "";
    modalVideo.innerHTML = `<source src="${videoSrc}" type="${getVideoType(videoSrc)}">`;
    modalVideo.muted = true;
    modalSound.textContent = "Sound Off";

    modalVideo.load();
    modalVideo.play().catch(() => {});
    modalSound.focus({ preventScroll: true });
  };

  const closeReelModal = () => {
    if (!reelModal || !modalVideo) return;

    modalVideo.pause();
    modalVideo.currentTime = 0;
    modalVideo.removeAttribute("src");
    modalVideo.removeAttribute("poster");
    modalVideo.innerHTML = "";
    modalVideo.load();

    reelModal.classList.remove("is-open");
    reelModal.setAttribute("aria-hidden", "true");
    body.classList.remove("is-reel-modal-open");
<<<<<<< HEAD
    startSmoothScroll();
=======
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
  };

  document.querySelectorAll("[data-work-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", openWorkOverlay);
  });
  closeButton.addEventListener("click", closeWorkOverlay);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && workOverlay.classList.contains("is-open")) {
      closeWorkOverlay();
    }
  });
  modalSound.addEventListener("click", () => {
    modalVideo.muted = !modalVideo.muted;
    modalSound.textContent = modalVideo.muted ? "Sound Off" : "Sound On";
  });
  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeReelModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reelModal.classList.contains("is-open")) {
      closeReelModal();
    }
  });

  if (loader) {
    body.classList.add("is-loading");
<<<<<<< HEAD
    stopSmoothScroll();
    const hideLoader = () => {
      loader.classList.add("is-hidden");
      body.classList.remove("is-loading");
      startSmoothScroll();
=======
    const hideLoader = () => {
      loader.classList.add("is-hidden");
      body.classList.remove("is-loading");
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7
      window.setTimeout(() => loader.remove(), 800);
    };
    if (prefersReducedMotion) {
      hideLoader();
    } else {
      window.setTimeout(hideLoader, 1350);
    }
  }

  const getCategory = () => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "all";
    return Object.prototype.hasOwnProperty.call(categories, category) ? category : "all";
  };

  const getProjectCategoryTitle = (project) => {
    return categories[project.category]?.title || project.categoryLabel;
  };

  const getProjectLayoutClass = (index) => {
    const pattern = [
      "project-card--large",
      "project-card--wide",
      "project-card--standard",
      "project-card--wide",
      "project-card--standard",
      "project-card--standard"
    ];
    return pattern[index % pattern.length];
  };

  const projectTemplate = (project, index) => {
    const article = document.createElement("article");
    article.className = `project-card ${getProjectLayoutClass(index)} reveal`;
    article.style.setProperty("--delay", `${Math.min(index, 5) * 70}ms`);
    article.innerHTML = `
      <a href="${project.video}" aria-label="View ${project.title}">
        <figure class="project-frame">
          <img src="${project.image}" alt="${project.title} project still" loading="${index < 2 ? "eager" : "lazy"}">
          <video muted loop playsinline preload="metadata" poster="${project.image}">
            <source src="${project.video}" type="${project.video.endsWith(".webm") ? "video/webm" : "video/mp4"}">
          </video>
          <figcaption class="project-info">
            <h3 class="project-title" aria-label="${project.title}">
              <span class="project-title__track">
                <span class="project-title__line">${project.title}</span>
                <span class="project-title__line" aria-hidden="true">${project.title}</span>
              </span>
            </h3>
            <span class="project-category">${getProjectCategoryTitle(project)}</span>
          </figcaption>
        </figure>
      </a>
    `;
    const video = article.querySelector("video");
    article.addEventListener("mouseenter", () => video.play().catch(() => {}));
    article.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
    article.addEventListener("focusin", () => video.play().catch(() => {}));
    article.addEventListener("focusout", () => {
      video.pause();
      video.currentTime = 0;
    });
    return article;
  };

  const getVideoType = (src) => (src.endsWith(".webm") ? "video/webm" : "video/mp4");

  const reelTemplate = (reel, index) => {
    const link = document.createElement("a");
    link.className = `reel-card reel-card--${reel.layout} reveal`;
    link.href = `work.html?category=${reel.category}`;
    link.setAttribute("aria-label", `Watch ${reel.title}`);
    link.dataset.reelType = reel.category;
    link.style.setProperty("--delay", `${Math.min(index, 5) * 70}ms`);
    link.innerHTML = `
      <span class="reel-card__media">
        <img class="reel-card__poster" src="${reel.poster}" alt="${reel.title} poster image" loading="${index < 2 ? "eager" : "lazy"}">
        <video class="reel-card__video" muted loop playsinline preload="metadata" poster="${reel.poster}" aria-hidden="true">
          <source src="${reel.previewVideo}" type="${getVideoType(reel.previewVideo)}">
        </video>
      </span>
      <span class="reel-card__copy">
        <span class="reel-card__label">${reel.label}</span>
        <span class="reel-card__title" aria-label="${reel.title}">
          <span class="reel-card__title-track">
            <span class="reel-card__title-line">${reel.title}</span>
            <span class="reel-card__title-line" aria-hidden="true">${reel.title}</span>
          </span>
        </span>
      </span>
    `;
    return link;
  };

  const stopPreview = (card, video) => {
    video.pause();
    video.currentTime = 0;
    card.classList.remove("is-playing");
  };

  const setupReelPreview = (card) => {
    const video = card.querySelector(".reel-card__video");
    if (!video || prefersReducedMotion) return;
    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      video.play().then(() => card.classList.add("is-playing")).catch(() => {});
    });
    card.addEventListener("pointerleave", () => stopPreview(card, video));
    card.addEventListener("focusin", () => {
      video.play().then(() => card.classList.add("is-playing")).catch(() => {});
    });
    card.addEventListener("focusout", () => stopPreview(card, video));
  };

  const setupReelModalTrigger = (card) => {
    card.addEventListener("click", (event) => {
      const category = card.dataset.reelType || card.dataset.category;
      const reel = categoryReels.find((item) => item.category === category);
      if (!reel) return;
      event.preventDefault();
      openReelModal(reel);
    });
  };

  const renderReelGrid = () => {
    document.querySelectorAll("[data-reel-grid]").forEach((grid) => {
      const cards = featuredReels.map(reelTemplate);
      grid.replaceChildren(...cards);
      cards.forEach(setupReelPreview);
      cards.forEach(setupReelModalTrigger);
    });
  };

  const renderProjectGrid = () => {
    document.querySelectorAll("[data-project-grid]").forEach((grid) => {
      const mode = grid.dataset.mode;
      const category = mode === "category" ? getCategory() : "all";
      const filtered =
        mode === "featured"
          ? projects.filter((project) => project.featured)
          : category === "all"
            ? projects
            : projects.filter((project) => project.category === category);
      const limit = mode === "featured" ? 6 : filtered.length;
      grid.replaceChildren(...filtered.slice(0, limit).map(projectTemplate));
      const count = document.querySelector("[data-project-count]");
      if (count && mode === "category") {
        count.textContent = `[${filtered.length}]`;
      }
      if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "work-empty reveal";
        empty.textContent = "More work coming soon.";
        grid.replaceWith(empty);
      }
    });
  };

  const renderWorkPage = () => {
    const heroMedia = document.querySelector("[data-category-media]");
    if (!heroMedia) return;
    const category = getCategory();
    const categoryData = categories[category];
    const filteredProjects = category === "all" ? projects : projects.filter((project) => project.category === category);
    const heroProjects = filteredProjects.length ? filteredProjects : projects;
    const firstProject = filteredProjects[0] || projects[0];
    let activeHeroIndex = Math.max(heroProjects.indexOf(firstProject), 0);
    const heroCategoryLabel = document.querySelector("[data-hero-category-label]");
    const heroProjectTitle = document.querySelector("[data-hero-project-title]");
    const heroProjectClient = document.querySelector("[data-hero-project-client]");
    const heroCopy = document.querySelector(".work-category-hero__copy");
    const heroProgress = document.querySelector("[data-category-progress]");
    const prevButton = document.querySelector(".work-category-hero__arrow--prev");
    const nextButton = document.querySelector(".work-category-hero__arrow--next");

    const createHeroMediaElement = (project) => {
      const media = project.video ? document.createElement("video") : document.createElement("img");
      if (project.video) {
        media.autoplay = true;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = "metadata";
        media.poster = project.image;
        media.innerHTML = `<source src="${project.video}" type="${getVideoType(project.video)}">`;
      } else {
        media.src = project.image;
        media.alt = "";
      }
      return media;
    };

    const updateHeroProgress = () => {
      heroProgress?.querySelectorAll("button").forEach((button, index) => {
        const isActive = index === activeHeroIndex;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    const renderHeroProject = (project, direction = "next") => {
      if (!project) return;
      if (heroCategoryLabel) heroCategoryLabel.textContent = categoryData.title;
      if (heroProjectTitle) heroProjectTitle.textContent = project.title;
      if (heroProjectClient) {
        const clientText = project.client || project.categoryLabel || "";
        heroProjectClient.textContent = clientText;
        heroProjectClient.hidden = !clientText;
      }
      if (heroMedia) {
        const previousMediaItems = Array.from(heroMedia.children);
        const media = createHeroMediaElement(project);
        media.className = `work-category-hero__asset work-category-hero__asset--enter-${direction}`;
        if (previousMediaItems.length && !prefersReducedMotion) {
          previousMediaItems.forEach((item) => {
            item.classList.add("work-category-hero__asset", `work-category-hero__asset--exit-${direction}`);
          });
          heroMedia.append(media);
          window.setTimeout(() => {
            previousMediaItems.forEach((item) => item.remove());
            media.className = "work-category-hero__asset";
          }, 840);
        } else {
          heroMedia.replaceChildren(media);
          media.className = "work-category-hero__asset";
        }
        media.play?.().catch(() => {});
      }
      if (heroCopy && !prefersReducedMotion) {
        heroCopy.classList.remove("is-sliding-next", "is-sliding-prev");
        void heroCopy.offsetWidth;
        heroCopy.classList.add(`is-sliding-${direction}`);
      }
      updateHeroProgress();
    };

    document.querySelector("[data-category-subtitle]").textContent = categoryData.subtitle;
    document.title = `${categoryData.title} | Zodiac II Media`;
    renderHeroProject(firstProject, "next");

    const setHeroByOffset = (offset) => {
      if (!heroProjects.length) return;
      activeHeroIndex = (activeHeroIndex + offset + heroProjects.length) % heroProjects.length;
      renderHeroProject(heroProjects[activeHeroIndex], offset < 0 ? "prev" : "next");
    };

    if (heroProgress) {
      const progressButtons = heroProjects.map((project, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", `Show ${project.title}`);
        button.addEventListener("click", () => {
          if (index === activeHeroIndex) return;
          const direction = index > activeHeroIndex ? "next" : "prev";
          activeHeroIndex = index;
          renderHeroProject(heroProjects[activeHeroIndex], direction);
        });
        return button;
      });
      heroProgress.replaceChildren(...progressButtons);
      updateHeroProgress();
    }

    if (heroProjects.length <= 1) {
      prevButton?.setAttribute("disabled", "");
      nextButton?.setAttribute("disabled", "");
    } else {
      heroProgress?.removeAttribute("hidden");
      prevButton?.addEventListener("click", () => setHeroByOffset(-1));
      nextButton?.addEventListener("click", () => setHeroByOffset(1));
    }
  };

  const renderReelPage = () => {
    const page = document.querySelector("[data-reel-page]");
    if (!page) return;
    const requestedCategory = new URLSearchParams(window.location.search).get("category") || "music-video";
    const category = Object.prototype.hasOwnProperty.call(categoryConfig, requestedCategory)
      ? requestedCategory
      : "music-video";
    const reel = categoryReels.find((item) => item.category === category) || categoryReels[0];
    const categoryProjects = getProjectsByCategory(category);
    const mainProject = categoryProjects.find((project) => project.featured) || categoryProjects[0];
    const title = page.querySelector("[data-reel-title]");
    const label = page.querySelector("[data-reel-label]");
    const description = page.querySelector("[data-reel-description]");
    const video = page.querySelector("[data-reel-video]");
    const playerWrap = page.querySelector(".reel-player-wrap");
    const otherReels = page.querySelector("[data-other-reels]");

    title.textContent = reel.title;
    label.textContent = reel.label;
    description.textContent = reel.description;
    document.title = `${reel.title} | Zodiac II Media`;

    if (mainProject) {
      video.poster = mainProject.image;
      video.innerHTML = `<source src="${mainProject.video}" type="${getVideoType(mainProject.video)}">`;
    } else if (playerWrap) {
      const empty = document.createElement("p");
      empty.className = "reel-empty";
      empty.textContent = "More work coming soon.";
      playerWrap.replaceChildren(empty);
    }

    const links = categoryReels
      .filter((item) => item.category !== reel.category)
      .map((item) => {
        const link = document.createElement("a");
        link.href = item.url;
        link.textContent = item.title;
        return link;
      });
    otherReels.replaceChildren(...links);
  };

  const initCapabilitiesKinetic = () => {
    const capabilityData = [
      {
        title: "VFX Supervision",
        description: "On-set oversight, creative alignment, and technical supervision to ensure the final image is achievable, consistent, and production-ready."
      },
      {
        title: "CGI Production",
        description: "End-to-end CGI production across concept, modeling, animation, lighting, rendering, and final integration."
      },
      {
        title: "Compositing",
        description: "Layered image construction, matte integration, finishing, and seamless final-frame compositing."
      },
      {
        title: "FX Simulation",
        description: "Dynamic simulations for smoke, fire, dust, destruction, particles, liquids, and atmospheric detail."
      },
      {
        title: "Environment / Set Extension",
        description: "Digital environments and set extensions that expand physical production into believable cinematic worlds."
      },
      {
        title: "Cleanup / Beauty Work",
        description: "Invisible cleanup, retouching, wire removal, beauty enhancement, and frame-level image correction."
      },
      {
        title: "Motion Design",
        description: "Design-led motion systems for title work, brand animation, interfaces, and visual communication."
      },
      {
        title: "Look Development",
        description: "Material, lighting, shading, and render look development built for premium image quality and consistency."
      }
    ];

    const section = document.querySelector(".capabilities-kinetic");
    const track = section?.querySelector("[data-capabilities-track]");
    const viewport = section?.querySelector("[data-capabilities-viewport]");
    const indexEl = section?.querySelector("[data-capabilities-index]");
    const descEl = section?.querySelector("[data-capabilities-description]");
    const prevBtn = section?.querySelector(".capabilities-kinetic__arrow--prev");
    const nextBtn = section?.querySelector(".capabilities-kinetic__arrow--next");
    const sourceItems = Array.from(track?.querySelectorAll(".capabilities-kinetic__item") || []);

    if (!section || !track || !viewport || sourceItems.length !== capabilityData.length) return;

    const mod = (n, m) => ((n % m) + m) % m;
    const itemCount = capabilityData.length;
    let activeIndex = 0;
    let cursorIndex = itemCount;
    let currentTranslate = 0;
    let isAnimating = false;
    let touchStartY = null;
    let autoAdvanceTimer = null;

    const cloneItem = (item, index) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      clone.dataset.capabilityIndex = String(index);
      return clone;
    };

    const beforeItems = document.createDocumentFragment();
    const afterItems = document.createDocumentFragment();

    sourceItems.forEach((item, index) => {
      item.dataset.capabilityIndex = String(index);
      item.setAttribute("aria-pressed", "false");
      beforeItems.append(cloneItem(item, index));
      afterItems.append(cloneItem(item, index));
    });

    track.prepend(beforeItems);
    track.append(afterItems);

    const visualItems = Array.from(track.querySelectorAll(".capabilities-kinetic__item"));

    const setTrackTranslate = (nextTranslate, instant = false) => {
      if (instant) track.classList.add("is-resetting");
      track.style.transform = `translateY(${nextTranslate}px)`;
      currentTranslate = nextTranslate;

      if (instant) {
        window.requestAnimationFrame(() => {
          track.classList.remove("is-resetting");
        });
      }
    };

    const centerCursor = (instant = false) => {
      const activeItem = visualItems[cursorIndex];
      if (!activeItem) return;

      const viewportRect = viewport.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const offset = (itemRect.top + itemRect.height / 2) - (viewportRect.top + viewportRect.height / 2);

      setTrackTranslate(currentTranslate - offset, instant);
    };

    const updateCapabilityView = (instant = false) => {
      activeIndex = mod(cursorIndex, itemCount);

      visualItems.forEach((item, index) => {
        const distance = index - cursorIndex;
        item.classList.remove("is-active", "is-near", "is-far");

        if (distance === 0) {
          item.classList.add("is-active");
        } else if (Math.abs(distance) === 1) {
          item.classList.add("is-near");
        } else {
          item.classList.add("is-far");
        }
      });

      sourceItems.forEach((item, index) => {
        item.setAttribute("aria-pressed", String(index === activeIndex));
      });

      const activeData = capabilityData[activeIndex];
      if (indexEl) indexEl.textContent = String(activeIndex + 1).padStart(2, "0");
      if (descEl) descEl.textContent = activeData.description;

      centerCursor(instant);
    };

    const resetCursorIfNeeded = () => {
      if (cursorIndex >= itemCount && cursorIndex < itemCount * 2) return;
      cursorIndex = itemCount + activeIndex;
      updateCapabilityView(true);
    };

    const scheduleAutoAdvance = () => {
      window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = window.setTimeout(() => {
        nextCapability();
      }, 1000);
    };

    const goToCursor = (nextCursor) => {
      if (isAnimating) return;
      window.clearTimeout(autoAdvanceTimer);
      isAnimating = true;
      cursorIndex = nextCursor;
      updateCapabilityView();

      window.setTimeout(() => {
        resetCursorIfNeeded();
        isAnimating = false;
        scheduleAutoAdvance();
      }, prefersReducedMotion ? 40 : 760);
    };

    const goToCapability = (targetIndex) => {
      const normalizedTarget = mod(targetIndex, itemCount);
      let delta = normalizedTarget - activeIndex;

      if (delta > itemCount / 2) delta -= itemCount;
      if (delta < -itemCount / 2) delta += itemCount;
      if (delta === 0) return;

      goToCursor(cursorIndex + delta);
    };

    const nextCapability = () => goToCursor(cursorIndex + 1);
    const prevCapability = () => goToCursor(cursorIndex - 1);

    prevBtn?.addEventListener("click", prevCapability);
    nextBtn?.addEventListener("click", nextCapability);

    visualItems.forEach((item) => {
      item.addEventListener("click", () => {
        goToCapability(Number(item.dataset.capabilityIndex || 0));
      });
    });

    section.addEventListener(
      "wheel",
      (event) => {
        if (isAnimating || Math.abs(event.deltaY) < 6) return;
        if (event.deltaY > 0) nextCapability();
        else prevCapability();
      },
      { passive: true }
    );

    section.addEventListener("touchstart", (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    }, { passive: true });

    section.addEventListener("touchend", (event) => {
      if (touchStartY === null || isAnimating) return;
      const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - touchEndY;
      touchStartY = null;
      if (Math.abs(deltaY) < 34) return;
      if (deltaY > 0) nextCapability();
      else prevCapability();
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      const rect = section.getBoundingClientRect();
      const sectionInView = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
      if (!sectionInView) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        nextCapability();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        prevCapability();
      }
    });

    window.addEventListener("resize", () => {
      window.requestAnimationFrame(() => updateCapabilityView(true));
    });

    window.requestAnimationFrame(() => {
      updateCapabilityView(true);
      scheduleAutoAdvance();
    });
  };

  renderWorkPage();
  renderProjectGrid();
  renderReelGrid();
  renderReelPage();
  initCapabilitiesKinetic();

  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  revealItems.forEach((item, index) => {
    if (!item.style.getPropertyValue("--delay")) {
      item.style.setProperty("--delay", `${Math.min(index % 8, 7) * 55}ms`);
    }
  });

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const updateScrollState = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(scrollTop / maxScroll, 1);
    header?.classList.toggle("is-scrolled", scrollTop > 24);
    progressSegments.forEach((segment, index) => {
      const segmentStart = index / progressSegments.length;
      const segmentEnd = (index + 1) / progressSegments.length;
      const fill = (progress - segmentStart) / (segmentEnd - segmentStart);
      segment.style.setProperty("--fill", Math.max(0, Math.min(fill, 1)).toFixed(3));
    });
  };

  let ticking = false;
  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollState();
      ticking = false;
    });
  };
<<<<<<< HEAD

  lenis?.on("scroll", requestScrollUpdate);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target || !window.zodiacLenis) return;

      event.preventDefault();
      window.zodiacLenis.scrollTo(target, {
        offset: 0,
        duration: 1.1
      });
    });
  });

  const createPageTransition = () => {
    let transition = document.querySelector("[data-page-transition]");

    if (!transition) {
      transition = document.createElement("div");
      transition.className = "page-transition";
      transition.setAttribute("data-page-transition", "");
      transition.setAttribute("aria-hidden", "true");
      transition.innerHTML = '<div class="page-transition__panel"></div>';
      document.body.append(transition);
    }

    return transition;
  };

  const isInternalNavigableLink = (link) => {
    if (!link || !link.href) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    if (link.dataset.workTrigger !== undefined) return false;

    const rawHref = link.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#")) return false;

    const url = new URL(link.href, window.location.href);
    if (!["http:", "https:", "file:"].includes(url.protocol)) return false;
    if (url.origin !== window.location.origin) return false;
    if (url.hash) return false;

    const currentUrl = new URL(window.location.href);
    if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) return false;

    const pageName = url.pathname.split("/").filter(Boolean).pop() || "index.html";
    const allowedPages = ["index.html", "about.html", "contact.html", "work.html", "reel.html"];

    return allowedPages.includes(pageName.toLowerCase());
  };

  const getTransitionPending = () => {
    try {
      return sessionStorage.getItem("zodiac_page_transition_pending") === "true";
    } catch {
      return false;
    }
  };

  const setTransitionPending = () => {
    try {
      sessionStorage.setItem("zodiac_page_transition_pending", "true");
    } catch {
      // Navigation should continue even when storage is unavailable.
    }
  };

  const clearTransitionPending = () => {
    try {
      sessionStorage.removeItem("zodiac_page_transition_pending");
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  };

  const waitForTransitionAnimation = (panel, fallbackMs) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        panel.removeEventListener("animationend", finish);
        window.clearTimeout(timer);
        resolve();
      };
      const timer = window.setTimeout(finish, fallbackMs);
      panel.addEventListener("animationend", finish, { once: true });
    });

  const initPageTransitions = () => {
    const transition = createPageTransition();
    const panel = transition.querySelector(".page-transition__panel");
    if (!transition || !panel) return;
    if (prefersReducedMotion) {
      clearTransitionPending();
      return;
    }

    const revealNewPage = () => {
      if (!getTransitionPending()) return;

      clearTransitionPending();
      body.classList.add("is-page-transitioning");
      stopSmoothScroll();
      transition.classList.add("is-active", "is-leaving");
      transition.classList.remove("is-entering");
      panel.style.transform = "translateX(0%)";

      window.setTimeout(() => {
        transition.classList.remove("is-active", "is-leaving");
        panel.style.transform = "translateX(100%)";
        body.classList.remove("is-page-transitioning");
        startSmoothScroll();
      }, 820);
    };

    let isNavigating = false;
    revealNewPage();

    document.addEventListener("click", async (event) => {
      if (event.defaultPrevented || isNavigating) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a");
      if (!isInternalNavigableLink(link)) return;

      event.preventDefault();
      isNavigating = true;

      const targetHref = link.href;
      body.classList.add("is-page-transitioning");
      stopSmoothScroll();
      transition.classList.add("is-active", "is-entering");
      transition.classList.remove("is-leaving");
      panel.style.transform = "";

      await waitForTransitionAnimation(panel, 760);
      setTransitionPending();
      window.location.href = targetHref;
    });
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollState();
  initPageTransitions();
=======
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollState();
>>>>>>> 25d961da52d581a9300ce17d2621664a532376f7

  const updateLocalTime = () => {
    if (!localTime) return;
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    localTime.textContent = `Local Time ${formatter.format(new Date())}`;
  };
  updateLocalTime();
  window.setInterval(updateLocalTime, 30000);
})();
