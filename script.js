(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  let loader = document.querySelector("[data-loader]");
  const header = document.querySelector("[data-header]");
  const progressSegments = Array.from(document.querySelectorAll("[data-progress-segment]"));
  const localTimeNodes = Array.from(document.querySelectorAll("[data-local-time]"));
  const projects = Array.isArray(window.projects) ? window.projects : [];
  const teamImageBasePath = "/assets/images/people";
  const teamImageExtensions = ["jpg", "png", "webp"];
  const teamMembers = Array.isArray(window.teamMembers) ? window.teamMembers : [];
  const brandLogoPath = "/assets/icons/header_logo.svg";

  const ensureIntroLoader = () => {
    if (loader) return loader;

    const introLoader = document.createElement("div");
    introLoader.className = "intro-loader";
    introLoader.setAttribute("data-loader", "");
    introLoader.innerHTML = "<p>Zodiac II Media</p>";

    const firstChild = body.firstChild;
    if (firstChild) body.insertBefore(introLoader, firstChild);
    else body.append(introLoader);

    loader = introLoader;
    return loader;
  };

  const initBrandLogo = () => {
    const brandMarks = Array.from(document.querySelectorAll(".brand-mark"));
    if (!brandMarks.length) return;

    brandMarks.forEach((brandMark) => {
      if (brandMark.querySelector("img.brand-mark__logo")) return;

      const label = (brandMark.textContent || "Zodiac II Media").trim() || "Zodiac II Media";
      brandMark.textContent = "";

      const logo = document.createElement("img");
      logo.className = "brand-mark__logo";
      logo.src = brandLogoPath;
      logo.alt = label;
      logo.decoding = "async";
      logo.loading = "eager";

      brandMark.append(logo);
    });
  };

  const initSmoothScroll = () => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const cpuThreads = Number.isFinite(navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null;
    const isLowPowerViewport = viewportWidth <= 1440;
    const isLowPowerCpu = cpuThreads !== null && cpuThreads <= 8;
    if (prefersReducedMotion || typeof Lenis === "undefined" || isLowPowerViewport || isLowPowerCpu) {
      window.zodiacLenis = null;
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

  const shouldPauseSmoothScroll = () =>
    body.classList.contains("is-loading") ||
    body.classList.contains("is-work-overlay-open") ||
    body.classList.contains("is-mobile-nav-open") ||
    body.classList.contains("is-reel-modal-open") ||
    body.classList.contains("is-page-transitioning");

  const stopSmoothScroll = () => {
    window.zodiacLenis?.stop();
  };

  const startSmoothScroll = () => {
    if (!shouldPauseSmoothScroll()) {
      window.zodiacLenis?.start();
    }
  };

  const syncSmoothScrollState = () => {
    if (!lenis) return;
    if (shouldPauseSmoothScroll()) stopSmoothScroll();
    else startSmoothScroll();
  };

  const getScrollMax = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const getElementY = (element) =>
    element.getBoundingClientRect().top + window.scrollY;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const pickEvenly = (items, count) => {
    if (count <= 0) return [];
    if (items.length <= count) return items;
    return Array.from({ length: count }, (_, index) => {
      const itemIndex = Math.round(((index + 1) * (items.length - 1)) / (count + 1));
      return items[itemIndex];
    });
  };

  const getVisibleSections = () =>
    Array.from(
      document.querySelectorAll("main [data-nav-section], main section[id], main section")
    )
      .filter((section, index, array) => array.indexOf(section) === index)
      .filter((section) => {
        const rect = section.getBoundingClientRect();
        const style = window.getComputedStyle(section);
        return (
          section.offsetParent !== null &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.height > 120
        );
      });

  const getSectionLabel = (section, index) => {
    const explicit =
      section?.dataset?.navLabel?.trim() ||
      section?.dataset?.sectionTitle?.trim();
    if (explicit) return explicit;

    const heading = section?.querySelector("h1, h2, .section-kicker");
    const headingText = heading?.textContent?.trim();
    if (headingText) return headingText;

    return `Section ${String(index + 1).padStart(2, "0")}`;
  };

  const resolveSelectorTarget = (selector) => {
    if (!selector) return null;
    try {
      const element = document.querySelector(selector);
      return element instanceof HTMLElement ? element : null;
    } catch {
      return null;
    }
  };

  const scrollToTarget = (target, options = {}) => {
    const offset = Number.isFinite(options.offset) ? options.offset : 0;
    const duration = Number.isFinite(options.duration) ? options.duration : 1.05;
    if (target instanceof HTMLElement) {
      if (window.zodiacLenis?.scrollTo) {
        window.zodiacLenis.scrollTo(target, { duration, offset });
      } else {
        const top = clamp(getElementY(target) + offset, 0, getScrollMax());
        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });
      }
      return;
    }

    const y = clamp((Number(target) || 0) + offset, 0, getScrollMax());
    if (window.zodiacLenis?.scrollTo) {
      window.zodiacLenis.scrollTo(y, { duration });
      return;
    }

    window.scrollTo({
      top: y,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  };

  const createHeroScrollCue = () => {
    const button = document.createElement("button");
    button.className = "hero-scroll-cue";
    button.type = "button";
    button.setAttribute("aria-label", "Scroll to next section");
    button.dataset.scrollCue = "";
    button.innerHTML = `
      <span class="hero-scroll-cue__text">Scroll</span>
      <span class="hero-scroll-cue__icon" aria-hidden="true">
        <span class="hero-scroll-cue__line"></span>
        <span class="hero-scroll-cue__dot"></span>
      </span>
    `;
    return button;
  };

  const appendHeroScrollCue = (container) => {
    if (!container || container.querySelector(":scope > [data-scroll-cue]")) return;
    container.append(createHeroScrollCue());
  };

  const getScrollCueTarget = (cue) => {
    const host = cue.closest(".project-detail__player, .reel-player-wrap, section, article");
    if (!host) return null;

    if (host.classList.contains("project-detail__player")) {
      return host.nextElementSibling || host.closest(".project-detail__media")?.nextElementSibling;
    }

    return host.nextElementSibling || host.parentElement?.nextElementSibling;
  };

  const initHeroScrollCues = () => {
    document.querySelectorAll("[data-scroll-cue]").forEach((cue) => {
      if (cue.dataset.scrollCueReady) return;
      cue.dataset.scrollCueReady = "true";
      cue.addEventListener("click", () => {
        const target = getScrollCueTarget(cue);
        if (target) scrollToTarget(target, { offset: -8, duration: 1.05 });
      });
    });
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

  const categoryConfig = {
    commercial: {
      title: "Commercial Reel",
      label: "Commercial",
      category: "commercial",
      description: "Commercial CGI, compositing, and visual effects work for brands, campaigns, and premium advertising.",
      url: "/reel/commercial/",
      layout: "standard"
    },
    "music-video": {
      title: "Music Video Reel",
      label: "Music Video",
      category: "music-video",
      description: "Cinematic VFX and visual effects work crafted for music videos, artists, and high-impact visual storytelling.",
      url: "/reel/music-video/",
      layout: "large"
    },
    film: {
      title: "Film Reel",
      label: "Film",
      category: "film",
      description: "Cinematic film, brand film, environment, invisible VFX, and long-form visual effects work.",
      url: "/reel/film/",
      layout: "wide"
    },
    billboard: {
      title: "Billboard Reel",
      label: "Billboard",
      category: "billboard",
      description: "High-impact billboard, LED, outdoor, OOH, and large-format visual work built for public scale.",
      url: "/reel/billboard/",
      layout: "standard"
    }
  };

  const reelMediaByCategory = {
    commercial: {
      poster: "/assets/videos/reel/reel-thumbnail-commercial.jpg",
      previewVideo: "/assets/videos/reel/reel-preview-commercial.webm",
      fullVideo: "/assets/videos/reel/reel-preview-commercial.webm"
    },
    "music-video": {
      poster: "/assets/videos/reel/reel-thumbnail-musicvideo.jpg",
      previewVideo: "/assets/videos/reel/reel-preview-musicvideo.webm",
      fullVideo: "/assets/videos/reel/reel-preview-musicvideo.webm"
    },
    film: {
      poster: "/assets/videos/reel/reel-thumbnail-film.jpg",
      previewVideo: "/assets/videos/reel/reel-preview-film.webm",
      fullVideo: "/assets/videos/reel/reel-preview-film.webm"
    },
    billboard: {
      poster: "/assets/videos/reel/reel-thumbnail-billboard.jpg",
      previewVideo: "/assets/videos/reel/reel-preview-billboard.webm",
      fullVideo: "/assets/videos/reel/reel-preview-billboard.webm"
    }
  };

  const getProjectsByCategory = (category) =>
    projects.filter((project) => project.category === category);

  const getProjectThumbnail = (project) =>
    project?.thumbnail || "";

  const getProjectPreviewVideo = (project) =>
    project?.previewVideo || "";

  const getProjectMediaUrl = (project) =>
    project?.embedUrl || "";

  const isExternalEmbedUrl = (url) =>
    /^https?:\/\//i.test(url || "");

  const getProjectPlayableVideo = (project) => {
    const mediaUrl = getProjectMediaUrl(project);
    return mediaUrl && !isExternalEmbedUrl(mediaUrl) ? mediaUrl : "";
  };

  const categoryReels = Object.values(categoryConfig).map((config) => {
    const fallbackMedia = reelMediaByCategory["music-video"];
    const reelMedia = reelMediaByCategory[config.category] || fallbackMedia;

    return {
      ...config,
      poster: reelMedia.poster,
      previewVideo: reelMedia.previewVideo,
      fullVideo: reelMedia.fullVideo,
      projectCount: getProjectsByCategory(config.category).length
    };
  });

  const featuredReels = ["music-video", "commercial", "film", "billboard"]
    .map((category) => categoryReels.find((reel) => reel.category === category))
    .filter(Boolean);

  const slugifyName = (name) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getTeamImagePath = (name, extension = teamImageExtensions[0]) =>
    `${teamImageBasePath}/${slugifyName(name)}.${extension}`;

  const getTeamProfileUrl = (member) =>
    member.profileUrl || `/profile/${slugifyName(member.name)}/`;

  const normalizeCleanPath = (path) => (path.endsWith("/") ? path : `${path}/`);

  const getPathSegments = () =>
    window.location.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

  const getCleanCategoryUrl = (base, category) =>
    category && category !== "all" ? `/${base}/${category}/` : `/${base}/`;

  const getCategoryFromPath = (base, fallback = "all") => {
    const segments = getPathSegments();
    const baseIndex = segments.indexOf(base);
    const fromPath = baseIndex >= 0 ? segments[baseIndex + 1] : "";
    if (fromPath && Object.prototype.hasOwnProperty.call(categories, fromPath)) {
      return fromPath;
    }

    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("category") || fallback;
    return Object.prototype.hasOwnProperty.call(categories, fromQuery) ? fromQuery : fallback;
  };

  const getReelUrl = (category) =>
    category && category !== "all" ? `/reel/${category}/` : "/reel/";

  const getReelCategoryFromPath = () => {
    const category = getCategoryFromPath("reel", "music-video");
    return Object.prototype.hasOwnProperty.call(categoryConfig, category) ? category : "music-video";
  };

  const getSlugFromPath = (base, queryName) => {
    const segments = getPathSegments();
    const baseIndex = segments.indexOf(base);
    const fromPath = baseIndex >= 0 ? segments[baseIndex + 1] : "";
    if (fromPath) return fromPath;
    return new URLSearchParams(window.location.search).get(queryName) || "";
  };

  const attachTeamImageFallback = (image, name) => {
    let extensionIndex = 0;
    image.addEventListener("error", () => {
      extensionIndex += 1;
      if (extensionIndex < teamImageExtensions.length) {
        image.src = getTeamImagePath(name, teamImageExtensions[extensionIndex]);
      } else {
        image.hidden = true;
      }
    });
  };

  const renderTeamSection = () => {
    const teamSection = document.querySelector("[data-team-section]");
    const teamList = document.querySelector("[data-team-list]");
    if (!teamSection || !teamList) return;

    teamList.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const currentCounter = teamSection.querySelector("[data-team-current]");
    const totalCounter = teamSection.querySelector("[data-team-total]");
    const nextButtons = Array.from(teamSection.querySelectorAll("[data-team-next]"));
    const visibleTeamMembers = teamMembers.filter(
      (member) => (member.title || member.role || "").toLowerCase() !== "founder & ceo"
    );
    const memberCount = visibleTeamMembers.length;
    let activeIndex = 0;
    let autoCycleTimer = null;

    if (!memberCount) {
      if (totalCounter) totalCounter.textContent = "00";
      if (currentCounter) currentCounter.textContent = "00";
      nextButtons.forEach((button) => button.setAttribute("disabled", ""));
      return;
    }

    if (totalCounter) totalCounter.textContent = String(memberCount).padStart(2, "0");

    visibleTeamMembers.forEach((member, index) => {
      const card = document.createElement("article");
      card.className = "team-card";
      card.dataset.teamCard = "";
      card.dataset.profileUrl = getTeamProfileUrl(member);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${member.name}, ${member.role}. Press Enter for profile.`);
      card.style.setProperty("--i", index);

      const name = document.createElement("h3");
      name.className = "team-card__name";
      name.textContent = member.name;

      const role = document.createElement("p");
      role.className = "team-card__role";
      role.textContent = member.role;

      const number = document.createElement("span");
      number.className = "team-card__index";
      number.setAttribute("aria-hidden", "true");
      number.textContent = String(index + 1).padStart(2, "0");

      const description = document.createElement("p");
      description.className = "team-card__description";
      description.textContent = member.description;

      const profileLink = document.createElement("a");
      profileLink.className = "team-card__link";
      profileLink.dataset.teamInfo = "";
      profileLink.href = getTeamProfileUrl(member);
      profileLink.setAttribute("aria-label", `View ${member.name} profile`);
      profileLink.textContent = "Info";
      profileLink.addEventListener("pointerdown", (event) => event.stopPropagation());
      profileLink.addEventListener("click", (event) => event.stopPropagation());

      const portrait = document.createElement("figure");
      portrait.className = "team-card__portrait";

      const image = document.createElement("img");
      image.src = getTeamImagePath(member.name);
      image.alt = `${member.name} portrait`;
      image.loading = "lazy";
      image.decoding = "async";
      attachTeamImageFallback(image, member.name);

      portrait.append(image);
      card.append(portrait, number, profileLink, role, name, description);
      fragment.append(card);
    });

    teamList.append(fragment);
    teamList.tabIndex = 0;

    const cards = Array.from(teamList.querySelectorAll("[data-team-card]"));
    const interactiveSelector = "a, button, input, select, textarea";
    const getTeamStackScale = () => {
      if (window.matchMedia("(max-width: 560px)").matches) return 0.42;
      if (window.matchMedia("(max-width: 980px)").matches) return 0.7;
      return 1;
    };

    const updateTeamStack = () => {
      const isSingleCardMobile = window.matchMedia("(max-width: 560px)").matches;
      const secondaryIndex = memberCount > 1 ? (activeIndex + 1) % memberCount : activeIndex;
      const visibleIndexes = isSingleCardMobile
        ? [activeIndex]
        : [activeIndex, secondaryIndex].filter((index, arrayIndex, array) => index >= 0 && array.indexOf(index) === arrayIndex);
      const layoutScale = getTeamStackScale();

      cards.forEach((card, index) => {
        const signedOffset = index - activeIndex;
        const isPrimary = signedOffset === 0;
        const isSecondary = !isSingleCardMobile && index === secondaryIndex;
        const isVisible = isPrimary || isSecondary;
        const absOffset = Math.abs(signedOffset);
        const stackDepth = isPrimary ? 0 : isSecondary ? 1 : Math.min(absOffset + 1, 5);
        const hiddenDirection = signedOffset < 0 ? -1 : 1;
        const x = isPrimary
          ? isSingleCardMobile ? 0 : -0.5
          : isSecondary
            ? 0.5
            : hiddenDirection * (0.08 + stackDepth * 0.06);
        const y = isPrimary ? 0 : isSecondary ? 0 : 18 + stackDepth * 12;
        const z = isPrimary ? 0 : isSecondary ? -18 : -120 - stackDepth * 34;
        const rotation = isPrimary
          ? -0.45
          : isSecondary
            ? 0.35
            : hiddenDirection * (1.2 + stackDepth * 0.2);
        const scale = isPrimary ? 1 : isSecondary ? 0.995 : 0.82 - stackDepth * 0.035;
        const opacity = isPrimary ? 1 : isSecondary ? 0.98 : isSingleCardMobile ? 0 : 0.075;

        card.classList.toggle("is-primary", isPrimary);
        card.classList.toggle("is-secondary", isSecondary);
        card.classList.toggle("is-visible-pair", isVisible);
        card.setAttribute("aria-hidden", isVisible ? "false" : "true");
        card.querySelector(".team-card__link")?.setAttribute("tabindex", isVisible ? "0" : "-1");
        card.style.setProperty("--depth", stackDepth);
        card.style.setProperty("--x", `${(x * layoutScale).toFixed(3)}`);
        card.style.setProperty("--y", `${Math.round(y * layoutScale)}px`);
        card.style.setProperty("--tz", `${z}px`);
        card.style.setProperty("--r", `${rotation}deg`);
        card.style.setProperty("--s", scale.toFixed(3));
        card.style.setProperty("--card-opacity", String(opacity));
        const layerOrder = isSecondary ? memberCount + 6 : isPrimary ? memberCount + 5 : memberCount + 4 - stackDepth;
        card.style.setProperty("--z", String(layerOrder));
      });

      teamSection.dataset.activeTeam = String(activeIndex);
      if (currentCounter) currentCounter.textContent = String(activeIndex + 1).padStart(2, "0");
      teamList.setAttribute(
        "aria-label",
        `Zodiac II Media team: ${visibleIndexes.map((index) => visibleTeamMembers[index].name).join(" and ")}`
      );
    };

    const shiftTeam = (direction = 1) => {
      activeIndex = (activeIndex + direction + memberCount) % memberCount;
      updateTeamStack();
    };

    const stopAutoCycle = () => {
      window.clearInterval(autoCycleTimer);
      autoCycleTimer = null;
    };

    const startAutoCycle = () => {
      if (prefersReducedMotion || memberCount < 2 || autoCycleTimer) return;
      autoCycleTimer = window.setInterval(() => shiftTeam(1), 5000);
    };

    const restartAutoCycle = () => {
      stopAutoCycle();
      startAutoCycle();
    };

    let suppressCardClick = false;
    const openTeamProfileFromCard = (card) => {
      if (!card) return false;
      const profileUrl = card.dataset?.profileUrl || card.getAttribute("data-profile-url");
      if (!profileUrl) return false;
      if (card.classList.contains("is-secondary")) {
        shiftTeam(1);
        restartAutoCycle();
        window.setTimeout(() => {
          window.location.href = profileUrl;
        }, 420);
        return true;
      }
      window.location.href = profileUrl;
      return true;
    };

    const initTeamCardGestures = () => {
      if (teamList.dataset.teamGestureInit === "true") return;
      teamList.dataset.teamGestureInit = "true";
      const TAP_THRESHOLD_MOUSE = 8;
      const TAP_THRESHOLD_TOUCH = 10;
      const TAP_DURATION_LIMIT = 320;
      const SWIPE_THRESHOLD_MOUSE = 40;
      const SWIPE_THRESHOLD_TOUCH = 48;
      const VERTICAL_THRESHOLD = 22;
      const HORIZONTAL_LOCK_RATIO_MOUSE = 1.35;
      const HORIZONTAL_LOCK_RATIO_TOUCH = 1.5;
      const VERTICAL_LOCK_RATIO = 1.08;
      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let startTime = 0;
      let gesture = null;
      let isPointerDown = false;
      let activePointerId = null;
      let tapCardCandidate = null;
      let activePointerType = "mouse";
      const clearGestureState = () => {
        isPointerDown = false;
        activePointerId = null;
        gesture = null;
        tapCardCandidate = null;
        activePointerType = "mouse";
        teamList.classList.remove("is-dragging-intent", "is-swiping", "is-vertical-scroll");
        const activeCard = teamList.querySelector("[data-team-card].is-primary");
        activeCard?.classList.remove("is-dragging-intent", "is-swiping", "is-vertical-scroll");
        activeCard?.style.removeProperty("--drag-x");
        teamList.style.removeProperty("--drag-x");
      };
      const onStart = (event, point) => {
        if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;
        tapCardCandidate = event.target instanceof Element ? event.target.closest("[data-team-card]") : null;
        if (!tapCardCandidate || !tapCardCandidate.classList.contains("is-visible-pair")) {
          tapCardCandidate = teamList.querySelector("[data-team-card].is-primary");
        }
        if (!tapCardCandidate || !tapCardCandidate.classList.contains("is-visible-pair")) return;
        if ("button" in event && event.button !== undefined && event.button !== 0) return;
        isPointerDown = true;
        activePointerId = "pointerId" in event ? event.pointerId : "touch";
        activePointerType = event.pointerType || ("touches" in event ? "touch" : "mouse");
        gesture = null;
        startX = point.clientX;
        startY = point.clientY;
        currentX = startX;
        currentY = startY;
        startTime = Date.now();
        suppressCardClick = false;
        stopAutoCycle();
        teamList.classList.add("is-dragging-intent");
        tapCardCandidate.classList.add("is-dragging-intent");
        if ("pointerId" in event) teamList.setPointerCapture?.(event.pointerId);
      };
      const onMove = (event, point) => {
        if (!isPointerDown) return;
        if ("pointerId" in event && event.pointerId !== activePointerId) return;
        currentX = point.clientX;
        currentY = point.clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const swipeThreshold = activePointerType === "touch" ? SWIPE_THRESHOLD_TOUCH : SWIPE_THRESHOLD_MOUSE;
        const horizontalLockRatio =
          activePointerType === "touch" ? HORIZONTAL_LOCK_RATIO_TOUCH : HORIZONTAL_LOCK_RATIO_MOUSE;
        if (!gesture) {
          if (absX > swipeThreshold && absX > absY * horizontalLockRatio) {
            gesture = "horizontal";
            suppressCardClick = true;
            teamList.classList.add("is-swiping");
            tapCardCandidate?.classList.add("is-swiping");
          } else if (absY > VERTICAL_THRESHOLD && absY > absX * VERTICAL_LOCK_RATIO) {
            gesture = "vertical";
            teamList.classList.add("is-vertical-scroll");
            tapCardCandidate?.classList.add("is-vertical-scroll");
          }
        }
        if (gesture === "horizontal") {
          event.preventDefault();
          const dragX = Math.max(Math.min(deltaX, 80), -80);
          teamList.style.setProperty("--drag-x", `${dragX}px`);
          tapCardCandidate?.style.setProperty("--drag-x", `${dragX}px`);
        }
      };
      const onEnd = (event, point) => {
        if (!isPointerDown) return;
        if ("pointerId" in event && event.pointerId !== activePointerId) return;
        if ("pointerId" in event) teamList.releasePointerCapture?.(event.pointerId);
        const deltaX = point.clientX - startX;
        const deltaY = point.clientY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const duration = Date.now() - startTime;
        const tapThreshold = activePointerType === "touch" ? TAP_THRESHOLD_TOUCH : TAP_THRESHOLD_MOUSE;
        const handledGesture = gesture;
        const targetCard = tapCardCandidate;
        clearGestureState();
        if (handledGesture === "horizontal") {
          if (deltaX < 0) shiftTeam(1);
          else shiftTeam(-1);
          restartAutoCycle();
          return;
        }
        if (handledGesture === "vertical") {
          restartAutoCycle();
          return;
        }
        const isTap = absX < tapThreshold && absY < tapThreshold && duration < TAP_DURATION_LIMIT;
        if (isTap && targetCard?.classList.contains("is-visible-pair")) {
          openTeamProfileFromCard(targetCard);
          return;
        }
        restartAutoCycle();
      };
      if (window.PointerEvent) {
        teamList.addEventListener("pointerdown", (event) => onStart(event, event));
        teamList.addEventListener("pointermove", (event) => onMove(event, event), { passive: false });
        teamList.addEventListener("pointerup", (event) => onEnd(event, event));
        teamList.addEventListener("pointercancel", () => {
          clearGestureState();
          restartAutoCycle();
        });
      } else {
        teamList.addEventListener("touchstart", (event) => {
          const touch = event.changedTouches?.[0];
          if (!touch) return;
          onStart(event, touch);
        }, { passive: true });
        teamList.addEventListener("touchmove", (event) => {
          const touch = event.changedTouches?.[0];
          if (!touch) return;
          onMove(event, touch);
        }, { passive: false });
        teamList.addEventListener("touchend", (event) => {
          const touch = event.changedTouches?.[0];
          if (!touch) return;
          onEnd(event, touch);
        });
        teamList.addEventListener("touchcancel", () => {
          clearGestureState();
          restartAutoCycle();
        });
      }
    };

    initTeamCardGestures();
    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;
        if (suppressCardClick || !card.classList.contains("is-visible-pair")) {
          suppressCardClick = false;
          event.preventDefault();
          return;
        }
        event.preventDefault();
        suppressCardClick = false;
        openTeamProfileFromCard(card);
      });
      card.addEventListener("keydown", (event) => {
        if (!card.classList.contains("is-visible-pair")) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTeamProfileFromCard(card);
        }
      });
    });
    teamList.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        shiftTeam(1);
        restartAutoCycle();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        shiftTeam(-1);
        restartAutoCycle();
      }
    });
    teamList.querySelectorAll("[data-team-info]").forEach((button) => {
      button.addEventListener("click", (event) => event.stopPropagation());
    });
    nextButtons.forEach((button) => {
      button.addEventListener("click", () => {
        shiftTeam(1);
        restartAutoCycle();
      });
    });

    window.addEventListener("resize", updateTeamStack);
    updateTeamStack();
    startAutoCycle();
  };

  const renderTeamProfilePage = () => {
    const profileRoot = document.querySelector("[data-profile-root]");
    if (!profileRoot || !teamMembers.length) return;

    const requestedPerson = getSlugFromPath("profile", "person");
    const member = teamMembers.find((item) => slugifyName(item.name) === requestedPerson) || teamMembers[0];
    const activeIndex = teamMembers.indexOf(member);

    const portrait = profileRoot.querySelector("[data-profile-portrait]");
    const title = profileRoot.querySelector("[data-profile-name]");
    const role = profileRoot.querySelector("[data-profile-role]");
    const description = profileRoot.querySelector("[data-profile-description]");
    const index = profileRoot.querySelector("[data-profile-index]");
    const meta = profileRoot.querySelector("[data-profile-meta]");

    if (title) title.textContent = member.name;
    if (role) role.textContent = member.title || member.role;
    if (description) description.textContent = member.bio || member.description;
    if (index) index.textContent = String(activeIndex + 1).padStart(2, "0");
    if (meta && Array.isArray(member.meta)) {
      meta.innerHTML = "";
      member.meta.forEach(([label, value]) => {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");

        term.textContent = label;
        detail.textContent = value;
        row.append(term, detail);
        meta.append(row);
      });
    }

    if (portrait) {
      portrait.src = getTeamImagePath(member.name);
      portrait.alt = `${member.name} portrait`;
      attachTeamImageFallback(portrait, member.name);
    }

    document.title = `${member.name} | Zodiac II Media`;
  };

  const createOverlay = () => {
    const overlay = document.createElement("div");
    overlay.className = "work-overlay";
    overlay.setAttribute("data-lenis-prevent", "");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <p class="work-overlay__label">Work Index</p>
      <button class="work-overlay__back" type="button" data-work-close>Back</button>
      <nav class="work-overlay__links" aria-label="Work category navigation">
        <a style="--i:0" href="/work/">All Work</a>
        <a style="--i:1" href="/work/commercial/">Commercial</a>
        <a style="--i:2" href="/work/music-video/">Music Video</a>
        <a style="--i:3" href="/work/film/">Film</a>
        <a style="--i:4" href="/work/billboard/">Billboard</a>
      </nav>
    `;
    document.body.append(overlay);
    return overlay;
  };

  const createMobileNavOverlay = () => {
    const overlay = document.createElement("div");
    overlay.className = "mobile-nav-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("data-lenis-prevent", "");
    overlay.innerHTML = `
      <button class="mobile-nav-overlay__back" type="button" data-mobile-nav-close>Close</button>
      <nav class="mobile-nav-overlay__links" aria-label="Mobile navigation">
        <button type="button" style="--i:0" data-mobile-work-trigger>Work</button>
        <a style="--i:1" href="/about/">About</a>
        <a style="--i:2" href="/contact/">Contact</a>
      </nav>
    `;
    document.body.append(overlay);
    return overlay;
  };

  const createReelModal = () => {
    const modal = document.createElement("div");
    modal.className = "reel-modal";
    modal.dataset.reelModal = "";
    modal.setAttribute("data-lenis-prevent", "");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="reel-modal__backdrop" data-reel-modal-close></div>
      <div class="reel-modal__panel" role="dialog" aria-modal="true" aria-label="Reel video player">
        <div class="reel-modal__video-wrap">
          <video
            class="reel-modal__video"
            data-reel-modal-video
            autoplay
            controls
            muted
            loop
            playsinline
            preload="auto"
          ></video>
        </div>
        <div class="reel-modal__meta">
          <div class="reel-modal__actions">
            <button class="reel-modal__sound" type="button" data-reel-modal-sound>Sound Off</button>
            <a class="reel-modal__work" href="/work/music-video/" data-reel-modal-work>View Work</a>
          </div>
        </div>
      </div>
    `;
    document.body.append(modal);
    return modal;
  };

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

  const getTransitionPending = () => {
    try {
      return sessionStorage.getItem("zodiac_page_transition_pending") === "true";
    } catch (error) {
      return false;
    }
  };

  const setTransitionPending = () => {
    try {
      sessionStorage.setItem("zodiac_page_transition_pending", "true");
    } catch (error) {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  };

  const clearTransitionPending = () => {
    try {
      sessionStorage.removeItem("zodiac_page_transition_pending");
    } catch (error) {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  };

  const isInternalNavigableLink = (link) => {
    if (!link || !link.href) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    if (link.dataset.workTrigger !== undefined) return false;

    const rawHref = link.getAttribute("href") || "";
    const normalizedHref = rawHref.trim().toLowerCase();
    if (!normalizedHref) return false;
    if (normalizedHref.startsWith("#")) return false;
    if (normalizedHref.startsWith("mailto:")) return false;
    if (normalizedHref.startsWith("tel:")) return false;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (url.hash) return false;

    const path = normalizeCleanPath(url.pathname);
    const isCleanPage =
      path === "/" ||
      path === "/about/" ||
      path === "/contact/" ||
      path === "/work/" ||
      path.startsWith("/work/") ||
      path.startsWith("/reel/") ||
      path.startsWith("/project/") ||
      path.startsWith("/profile/");
    const pageName = url.pathname.split("/").pop() || "index.html";
    const legacyPages = new Set(["index.html", "about.html", "contact.html", "work.html", "reel.html", "project.html", "profile.html"]);
    if (!isCleanPage && !legacyPages.has(pageName)) return false;

    const currentUrl = new URL(window.location.href);
    const isSamePage =
      url.pathname === currentUrl.pathname &&
      url.search === currentUrl.search &&
      url.hash === currentUrl.hash;

    return !isSamePage;
  };

  let copyToastTimer = null;
  let copyToastNode = null;
  const getCopyToastNode = () => {
    if (copyToastNode && document.body.contains(copyToastNode)) return copyToastNode;
    const node = document.createElement("div");
    node.className = "contact-copy-toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.append(node);
    copyToastNode = node;
    return node;
  };

  const showCopyMessage = (message) => {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    const node = getCopyToastNode();
    node.textContent = message;
    node.classList.add("is-visible");
    if (copyToastTimer) window.clearTimeout(copyToastTimer);
    copyToastTimer = window.setTimeout(() => {
      node.classList.remove("is-visible");
    }, 1600);
  };

  const copyThenOpen = async (valueToCopy, targetHref, successMessage) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(valueToCopy);
        showCopyMessage(successMessage);
      }
    } catch (error) {
      console.warn("Clipboard copy failed:", error);
    } finally {
      window.location.href = targetHref;
    }
  };

  const initContactCopyLinks = () => {
    const links = Array.from(document.querySelectorAll("a[data-copy-link]"));
    if (!links.length) return;

    links.forEach((link) => {
      const href = (link.getAttribute("href") || "").trim().toLowerCase();
      const isContactLink = link.classList.contains("contact-email") || link.classList.contains("contact-phone");
      const isMailOrTel = href.startsWith("mailto:") || href.startsWith("tel:");
      if (!isContactLink || !isMailOrTel) return;

      link.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        event.preventDefault();
        const copyValue = link.dataset.copyValue;
        const targetHref = link.getAttribute("href");
        if (!copyValue || !targetHref) {
          window.location.href = targetHref || href;
          return;
        }

        const successMessage = "I copied it already, contact me.";
        copyThenOpen(copyValue, targetHref, successMessage);
      });
    });
  };

  const initPageTransitions = () => {
    const transition = createPageTransition();
    const panel = transition.querySelector(".page-transition__panel");

    if (!transition || !panel) return;

    let isTransitioning = false;

    const resetTransition = () => {
      isTransitioning = false;
      transition.classList.remove("is-active", "is-entering", "is-leaving");
      panel.style.transform = "translateX(100%)";
      body.classList.remove("is-page-transitioning");
      startSmoothScroll();
    };

    if (prefersReducedMotion) {
      clearTransitionPending();
      resetTransition();
      return;
    }

    const revealNewPage = () => {
      if (!getTransitionPending()) {
        resetTransition();
        return;
      }

      clearTransitionPending();
      body.classList.add("is-page-transitioning");
      stopSmoothScroll();
      transition.classList.add("is-active", "is-leaving");
      transition.classList.remove("is-entering");
      panel.style.transform = "translateX(0%)";

      window.setTimeout(resetTransition, 820);
    };

    revealNewPage();

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) revealNewPage();
    });

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (isTransitioning) return;

      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!isInternalNavigableLink(link)) return;

      event.preventDefault();
      isTransitioning = true;

      const targetHref = link.href;
      body.classList.add("is-page-transitioning");
      stopSmoothScroll();
      transition.classList.add("is-active", "is-entering");
      transition.classList.remove("is-leaving");
      panel.style.transform = "";

      window.setTimeout(() => {
        setTransitionPending();
        window.location.href = targetHref;
      }, 680);
    });
  };

  const workOverlay = createOverlay();
  const closeButton = workOverlay.querySelector("[data-work-close]");
  const mobileNavOverlay = createMobileNavOverlay();
  const mobileNavClose = mobileNavOverlay.querySelector("[data-mobile-nav-close]");
  const mobileWorkTrigger = mobileNavOverlay.querySelector("[data-mobile-work-trigger]");
  const reelModal = createReelModal();
  const modalVideo = reelModal.querySelector("[data-reel-modal-video]");
  const modalSound = reelModal.querySelector("[data-reel-modal-sound]");
  const modalWork = reelModal.querySelector("[data-reel-modal-work]");
  const modalCloseButtons = reelModal.querySelectorAll("[data-reel-modal-close]");

  initPageTransitions();
  initContactCopyLinks();

  const openWorkOverlay = () => {
    body.classList.add("is-work-overlay-open");
    stopSmoothScroll();
    workOverlay.classList.add("is-open");
    workOverlay.setAttribute("aria-hidden", "false");
    closeButton.focus();
  };

  const closeWorkOverlay = () => {
    body.classList.remove("is-work-overlay-open");
    workOverlay.classList.remove("is-open");
    workOverlay.setAttribute("aria-hidden", "true");
    startSmoothScroll();
  };

  const mobileNavToggle = document.createElement("button");
  mobileNavToggle.type = "button";
  mobileNavToggle.className = "mobile-nav-toggle";
  mobileNavToggle.setAttribute("aria-label", "Open menu");
  mobileNavToggle.setAttribute("aria-expanded", "false");
  mobileNavToggle.textContent = "Menu";
  header?.append(mobileNavToggle);

  const closeMobileNav = (options = {}) => {
    const { returnFocus = true } = options;
    body.classList.remove("is-mobile-nav-open");
    mobileNavOverlay.classList.remove("is-open");
    mobileNavOverlay.setAttribute("aria-hidden", "true");
    mobileNavToggle.setAttribute("aria-expanded", "false");
    startSmoothScroll();
    if (returnFocus) mobileNavToggle.focus({ preventScroll: true });
  };

  const openMobileNav = () => {
    body.classList.add("is-mobile-nav-open");
    mobileNavOverlay.classList.add("is-open");
    mobileNavOverlay.setAttribute("aria-hidden", "false");
    mobileNavToggle.setAttribute("aria-expanded", "true");
    stopSmoothScroll();
    mobileNavClose?.focus({ preventScroll: true });
  };

  const isMobileNavViewport = () => window.matchMedia("(max-width: 820px)").matches;

  const syncMobileNavState = () => {
    if (!isMobileNavViewport() && mobileNavOverlay.classList.contains("is-open")) {
      closeMobileNav({ returnFocus: false });
    }
  };

  const stopAllReelPreviews = () => {
    document.querySelectorAll(".reel-card").forEach((card) => {
      const video = card.querySelector(".reel-card__video");
      if (!video) return;
      video.pause();
      video.currentTime = 0;
      card.classList.remove("is-playing");
    });
  };

  const requestModalPlayback = () => {
    if (!reelModal.classList.contains("is-open")) return;
    modalVideo.play().catch(() => {});
  };

  const openReelModal = (reel) => {
    if (!reel) return;
    window.location.href = getCleanCategoryUrl("work", reel.category || "music-video");
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
    startSmoothScroll();
  };

  document.querySelectorAll("[data-work-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", openWorkOverlay);
  });
  mobileNavToggle.addEventListener("click", () => {
    if (mobileNavOverlay.classList.contains("is-open")) closeMobileNav();
    else openMobileNav();
  });
  mobileNavClose?.addEventListener("click", () => closeMobileNav());
  mobileNavOverlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMobileNav({ returnFocus: false }));
  });
  mobileWorkTrigger?.addEventListener("click", () => {
    closeMobileNav({ returnFocus: false });
    openWorkOverlay();
  });
  closeButton.addEventListener("click", closeWorkOverlay);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && workOverlay.classList.contains("is-open")) {
      closeWorkOverlay();
    }
    if (event.key === "Escape" && mobileNavOverlay.classList.contains("is-open")) {
      closeMobileNav();
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

  if (lenis && "MutationObserver" in window) {
    const bodyStateObserver = new MutationObserver(syncSmoothScrollState);
    bodyStateObserver.observe(body, { attributes: true, attributeFilter: ["class"] });
  }

  window.addEventListener("pagehide", stopSmoothScroll);
  window.addEventListener("beforeunload", stopSmoothScroll);
  let projectPreviewResizeRaf = 0;
  window.addEventListener("resize", () => {
    syncMobileNavState();
    if (projectPreviewResizeRaf) return;
    projectPreviewResizeRaf = window.requestAnimationFrame(() => {
      initProjectViewportPreviews();
      initReelViewportPreviews();
      projectPreviewResizeRaf = 0;
    });
  });
  syncMobileNavState();

  loader = ensureIntroLoader();
  if (loader) {
    body.classList.add("is-loading");
    const hideLoader = () => {
      loader.classList.add("is-hidden");
      body.classList.remove("is-loading");
      window.setTimeout(() => loader.remove(), 800);
    };
    if (prefersReducedMotion) {
      hideLoader();
    } else {
      window.setTimeout(hideLoader, 1350);
    }
  }

  const getCategory = () => {
    return getCategoryFromPath("work", "all");
  };

  const getProjectCategoryTitle = (project) => {
    return categories[project.category]?.title || project.categoryLabel;
  };

  const getProjectDetailUrl = (project) => `/project/${project.slug}/`;

  const getProjectBySlug = (slug) =>
    projects.find((project) => project.slug === slug) || projects[0] || null;

  const isPlaceholderAward = (item) => {
    const text = String(item || "").trim().toLowerCase();
    return !text
      || text.includes("not publicly listed")
      || text.includes("not public")
      || text.includes("not listed")
      || text === "n/a"
      || text === "none";
  };

  const getProjectAwardTag = (project) => {
    const hasExplicitAwardTag = Object.prototype.hasOwnProperty.call(project, "awardTag");
    const explicitTag = typeof project.awardTag === "string" ? project.awardTag.trim() : "";
    if (explicitTag) return explicitTag;
    if (hasExplicitAwardTag) return "";

    const award = Array.isArray(project.awards)
      ? project.awards.find((item) => !isPlaceholderAward(item))
      : "";
    if (!award) return "";

    return "Awarded";
  };

  const getProjectAwardLine = (project) =>
    typeof project.awardLine === "string" ? project.awardLine.trim() : "";

  const getProjectAwardLevel = (project) => {
    const level = typeof project.awardLevel === "string" ? project.awardLevel.trim().toLowerCase() : "";
    return ["selection", "winner", "finalist", "featured"].includes(level) ? level : "";
  };

  const formatAwardBadgeLabel = (awardTag) => {
    if (typeof awardTag !== "string") return "";
    return awardTag.trim().replace(/\s+/g, " ").toUpperCase();
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
    const thumbnail = getProjectThumbnail(project);
    const previewVideo = getProjectPreviewVideo(project);
    const awardTag = getProjectAwardTag(project);
    const awardBadgeLabel = formatAwardBadgeLabel(awardTag);
    const awardLine = awardTag ? getProjectAwardLine(project) : "";
    const awardLevel = awardTag ? getProjectAwardLevel(project) : "";
    article.className = `project-card ${getProjectLayoutClass(index)}${previewVideo ? " project-card--has-preview" : ""}${awardTag ? " project-card--awarded" : ""}${awardLevel ? ` project-card--award-${awardLevel}` : ""} reveal`;
    article.style.setProperty("--delay", `${Math.min(index, 5) * 70}ms`);
    article.innerHTML = `
      <a href="${getProjectDetailUrl(project)}" aria-label="View ${project.title}">
        <figure class="project-frame">
          ${awardTag ? `
            <span class="project-card__award-tag">
              <span class="project-card__award-copy" aria-label="${awardTag}">${awardBadgeLabel}</span>
            </span>
          ` : ""}
          <img src="${thumbnail}" alt="${project.title} project still" loading="${index < 2 ? "eager" : "lazy"}">
          ${previewVideo ? `
            <video muted loop playsinline preload="metadata" poster="${thumbnail}">
              <source src="${previewVideo}" type="${getVideoType(previewVideo)}">
            </video>
          ` : ""}
          <figcaption class="project-info">
            <h3 class="project-title" aria-label="${project.title}">
              <span class="project-title__track">
                <span class="project-title__line">${project.title}</span>
                <span class="project-title__line" aria-hidden="true">${project.title}</span>
              </span>
            </h3>
            <span class="project-category">${getProjectCategoryTitle(project)}</span>
            ${awardLine ? `<span class="project-award-line">${awardLine}</span>` : ""}
          </figcaption>
        </figure>
      </a>
    `;
    const video = article.querySelector("video");
    if (!video) return article;
    article.addEventListener("mouseenter", () => {
      video.play().then(() => article.classList.add("is-playing")).catch(() => {});
    });
    article.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
      article.classList.remove("is-playing");
    });
    article.addEventListener("focusin", () => {
      video.play().then(() => article.classList.add("is-playing")).catch(() => {});
    });
    article.addEventListener("focusout", () => {
      video.pause();
      video.currentTime = 0;
      article.classList.remove("is-playing");
    });
    return article;
  };

  let projectPreviewObserver = null;
  let activeProjectPreviewCard = null;
  let reelPreviewObserver = null;
  let activeReelPreviewCard = null;

  const isProjectAutoPreviewViewport = () =>
    window.matchMedia("(max-width: 820px)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  const stopProjectPreview = (card) => {
    if (!card) return;
    const video = card.querySelector(".project-frame video");
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    card.classList.remove("is-playing");
  };

  const playProjectPreview = (card) => {
    if (!card) return;
    const video = card.querySelector(".project-frame video");
    if (!video) return;
    video.play().then(() => card.classList.add("is-playing")).catch(() => {});
  };

  const initProjectViewportPreviews = () => {
    if (projectPreviewObserver) {
      projectPreviewObserver.disconnect();
      projectPreviewObserver = null;
    }

    const cards = Array.from(document.querySelectorAll(".project-card--has-preview"));
    cards.forEach(stopProjectPreview);
    activeProjectPreviewCard = null;

    if (!cards.length || prefersReducedMotion || !("IntersectionObserver" in window) || !isProjectAutoPreviewViewport()) {
      return;
    }

    const visibility = new Map();
    const syncActivePreview = () => {
      let nextCard = null;
      let maxRatio = 0;
      visibility.forEach((ratio, card) => {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          nextCard = card;
        }
      });

      if (nextCard === activeProjectPreviewCard) return;
      stopProjectPreview(activeProjectPreviewCard);
      activeProjectPreviewCard = nextCard;
      if (activeProjectPreviewCard) playProjectPreview(activeProjectPreviewCard);
    };

    projectPreviewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            visibility.set(entry.target, entry.intersectionRatio);
          } else {
            visibility.delete(entry.target);
          }
        });
        syncActivePreview();
      },
      { threshold: [0.55, 0.7, 0.85], rootMargin: "-8% 0px -8% 0px" }
    );

    cards.forEach((card) => projectPreviewObserver.observe(card));
  };

  const initReelViewportPreviews = () => {
    if (reelPreviewObserver) {
      reelPreviewObserver.disconnect();
      reelPreviewObserver = null;
    }

    const cards = Array.from(document.querySelectorAll(".reel-card"));
    cards.forEach((card) => {
      const video = card.querySelector(".reel-card__video");
      if (!video) return;
      stopPreview(card, video);
    });
    activeReelPreviewCard = null;

    if (!cards.length || prefersReducedMotion || !("IntersectionObserver" in window)) {
      return;
    }
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const cpuThreads = Number.isFinite(navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : null;
    const isLowPowerDesktop = viewportWidth <= 1440 || (cpuThreads !== null && cpuThreads <= 8);
    if (isLowPowerDesktop) {
      return;
    }

    const visibility = new Map();
    const syncActivePreview = () => {
      let nextCard = null;
      let maxRatio = 0;
      visibility.forEach((ratio, card) => {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          nextCard = card;
        }
      });

      if (nextCard === activeReelPreviewCard) return;
      if (activeReelPreviewCard) {
        const activeVideo = activeReelPreviewCard.querySelector(".reel-card__video");
        if (activeVideo) stopPreview(activeReelPreviewCard, activeVideo);
      }

      activeReelPreviewCard = nextCard;
      if (!activeReelPreviewCard) return;
      const nextVideo = activeReelPreviewCard.querySelector(".reel-card__video");
      if (!nextVideo) return;
      nextVideo.play().then(() => activeReelPreviewCard.classList.add("is-playing")).catch(() => {});
    };

    reelPreviewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            visibility.set(entry.target, entry.intersectionRatio);
          } else {
            visibility.delete(entry.target);
          }
        });
        syncActivePreview();
      },
      { threshold: [0.45, 0.6, 0.8], rootMargin: "-8% 0px -8% 0px" }
    );

    cards.forEach((card) => reelPreviewObserver.observe(card));
  };

  const renderProjectDetailPage = () => {
    const page = document.querySelector("[data-project-page]");
    if (!page) return;

    const requestedSlug = getSlugFromPath("project", "slug");
    const project = getProjectBySlug(requestedSlug);
    const title = page.querySelector("[data-project-title]");
    const category = page.querySelector("[data-project-category]");
    const client = page.querySelector("[data-project-client]");
    const year = page.querySelector("[data-project-year]");
    const type = page.querySelector("[data-project-type]");
    const role = page.querySelector("[data-project-role]");
    const description = page.querySelector("[data-project-description]");
    const descriptionDisclosure = description?.closest(".project-disclosure");
    const credits = page.querySelector("[data-project-credits]");
    const awards = page.querySelector("[data-project-awards]");
    const video = page.querySelector("[data-project-video]");
    const player = video?.closest(".project-detail__player");
    const gallery = page.querySelector("[data-project-gallery]");
    const back = page.querySelector(".project-detail__back");

    if (!project) {
      page.innerHTML = '<p class="project-detail__empty reveal">Project data is not available.</p>';
      document.title = "Project | Zodiac II Media";
      return;
    }

    const projectCategoryTitle = getProjectCategoryTitle(project);
    const creditItems = Array.isArray(project.credits) ? project.credits.filter(Boolean) : [];
    const awardItems = Array.isArray(project.awards) ? project.awards.filter(Boolean) : [];
    const fallbackGalleryItems = [
      getProjectThumbnail(project),
      ...projects
        .filter((item) => item.slug !== project.slug && item.category === project.category)
        .map(getProjectThumbnail),
      ...projects
        .filter((item) => item.slug !== project.slug && item.category !== project.category)
        .map(getProjectThumbnail)
    ].filter(Boolean);
    const galleryItems = Array.isArray(project.gallery) && project.gallery.length
      ? project.gallery
      : Array.from(new Set(fallbackGalleryItems)).slice(0, 5);

    if (title) title.textContent = project.title;
    if (category) category.textContent = projectCategoryTitle;
    if (client) client.textContent = project.client || "";
    if (year) year.textContent = project.year ? `[${project.year}]` : "";
    if (type) type.textContent = projectCategoryTitle;
    if (role) role.textContent = project.scope || "VFX / CGI";
    if (descriptionDisclosure) descriptionDisclosure.remove();
    if (back) back.href = getCleanCategoryUrl("work", project.category || "all");
    document.title = `${project.title} | Zodiac II Media`;

    if (credits) {
      credits.replaceChildren(...creditItems.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
    }

    if (awards) {
      awards.replaceChildren(...awardItems.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
    }

    if (player) {
      const poster = getProjectThumbnail(project);
      const mediaUrl = getProjectMediaUrl(project);
      if (mediaUrl && isExternalEmbedUrl(mediaUrl)) {
        const iframe = document.createElement("iframe");
        iframe.className = "project-detail__embed";
        iframe.src = mediaUrl;
        iframe.title = `${project.title} video`;
        iframe.loading = "eager";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        player.replaceChildren(iframe);
      } else if (mediaUrl) {
        const localVideo = document.createElement("video");
        localVideo.controls = true;
        localVideo.playsInline = true;
        localVideo.preload = "metadata";
        localVideo.poster = poster;
        localVideo.innerHTML = `<source src="${mediaUrl}" type="${getVideoType(mediaUrl)}">`;
        player.replaceChildren(localVideo);
      } else if (poster) {
        const fallbackImage = document.createElement("img");
        fallbackImage.className = "project-detail__poster";
        fallbackImage.src = poster;
        fallbackImage.alt = `${project.title} project still`;
        player.replaceChildren(fallbackImage);
      }

      appendHeroScrollCue(player);
    }

    if (gallery) {
      const frames = galleryItems.map((src, index) => {
        const figure = document.createElement("figure");
        figure.className = "project-detail__frame";
        figure.innerHTML = `<img src="${src}" alt="${project.title} frame ${index + 1}" loading="${index < 2 ? "eager" : "lazy"}">`;
        return figure;
      });
      gallery.replaceChildren(...frames);
    }
  };

  const initProjectDisclosures = () => {
    document.querySelectorAll(".project-disclosure").forEach((details) => {
      const summary = details.querySelector("summary");
      const content = Array.from(details.children).find((child) => child !== summary);
      if (!summary || !content) return;

      content.classList.add("project-disclosure__content");

      const setStaticState = (isOpen) => {
        details.open = isOpen;
        details.classList.toggle("is-open", isOpen);
        content.style.height = isOpen ? "" : "0px";
        content.style.opacity = isOpen ? "" : "0";
        content.style.transform = "";
      };

      setStaticState(details.open);

      let disclosureAnimation = null;
      const animateDisclosure = (shouldOpen) => {
        if (disclosureAnimation) {
          disclosureAnimation.cancel();
          disclosureAnimation = null;
        }

        if (prefersReducedMotion) {
          setStaticState(shouldOpen);
          return;
        }

        details.classList.add("is-animating");

        if (shouldOpen) {
          details.open = true;
          details.classList.add("is-open");
          content.style.height = "0px";
          content.style.opacity = "0";
          content.style.transform = "translateY(-4px)";

          const endHeight = content.scrollHeight;
          disclosureAnimation = content.animate(
            [
              { height: "0px", opacity: 0, transform: "translateY(-4px)" },
              { height: `${endHeight}px`, opacity: 1, transform: "translateY(0)" }
            ],
            {
              duration: 420,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)"
            }
          );
        } else {
          const startHeight = content.offsetHeight;
          disclosureAnimation = content.animate(
            [
              { height: `${startHeight}px`, opacity: 1, transform: "translateY(0)" },
              { height: "0px", opacity: 0, transform: "translateY(-4px)" }
            ],
            {
              duration: 320,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)"
            }
          );
        }

        disclosureAnimation.onfinish = () => {
          setStaticState(shouldOpen);
          details.classList.remove("is-animating");
          disclosureAnimation = null;
          window.zodiacLenis?.resize?.();
        };

        disclosureAnimation.oncancel = () => {
          details.classList.remove("is-animating");
        };
      };

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        animateDisclosure(!details.classList.contains("is-open"));
      });
    });
  };

  const getVideoType = (src) => (src.endsWith(".webm") ? "video/webm" : "video/mp4");

  const reelTemplate = (reel, index) => {
    const link = document.createElement("a");
    link.className = `reel-card reel-card--${reel.layout} reveal`;
    link.href = getCleanCategoryUrl("work", reel.category);
    link.setAttribute("aria-label", `View ${reel.title} work`);
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

  const renderReelGrid = () => {
    document.querySelectorAll("[data-reel-grid]").forEach((grid) => {
      const cards = featuredReels.map(reelTemplate);
      grid.replaceChildren(...cards);
      cards.forEach(setupReelPreview);
    });
    initReelViewportPreviews();
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
    appendHeroScrollCue(heroMedia.closest(".work-category-hero"));
    const category = getCategory();
    const categoryData = categories[category];
    const filteredProjects = category === "all" ? projects : projects.filter((project) => project.category === category);
    const heroProjects = filteredProjects.filter((project) => project.featured);
    const firstProject = heroProjects[0];
    let activeHeroIndex = Math.max(heroProjects.indexOf(firstProject), 0);
    const heroCategoryLabel = document.querySelector("[data-hero-category-label]");
    const heroProjectTitle = document.querySelector("[data-hero-project-title]");
    const heroProjectClient = document.querySelector("[data-hero-project-client]");
    const heroCopy = document.querySelector(".work-category-hero__copy");
    const heroProgress = document.querySelector("[data-category-progress]");
    const heroReelLink = document.querySelector("[data-hero-reel-link]");
    const prevButton = document.querySelector(".work-category-hero__arrow--prev");
    const nextButton = document.querySelector(".work-category-hero__arrow--next");
    const heroSection = heroMedia.closest(".work-category-hero");

    const createHeroMediaElement = (project) => {
      const localVideo = getProjectPreviewVideo(project) || getProjectPlayableVideo(project);
      const media = localVideo ? document.createElement("video") : document.createElement("img");
      if (localVideo) {
        media.autoplay = true;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = "metadata";
        media.poster = getProjectThumbnail(project);
        media.innerHTML = `<source src="${localVideo}" type="${getVideoType(localVideo)}">`;
      } else {
        media.src = getProjectThumbnail(project);
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
    if (heroReelLink) {
      const reelCategory = category === "all" ? "music-video" : category;
      heroReelLink.setAttribute("href", getCleanCategoryUrl("work", reelCategory));
      heroReelLink.onclick = null;
    }

    if (!heroProjects.length) {
      heroMedia.replaceChildren();
      if (heroCategoryLabel) heroCategoryLabel.textContent = categoryData.title;
      if (heroProjectTitle) heroProjectTitle.textContent = categoryData.title;
      if (heroProjectClient) {
        heroProjectClient.textContent = "";
        heroProjectClient.hidden = true;
      }
      heroProgress?.replaceChildren();
      heroProgress?.setAttribute("hidden", "");
      prevButton?.setAttribute("disabled", "");
      nextButton?.setAttribute("disabled", "");
      return;
    }

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

      if (heroSection) {
        const interactiveSelector = "a, button, input, select, textarea, [role='button']";
        let swipePointerId = null;
        let swipeStartX = 0;
        let swipeStartY = 0;
        let swipeDone = false;
        const swipeThreshold = 64;
        const axisLockThreshold = 10;

        const resetSwipe = () => {
          swipePointerId = null;
          swipeStartX = 0;
          swipeStartY = 0;
          swipeDone = false;
        };

        heroSection.addEventListener("pointerdown", (event) => {
          if (event.pointerType !== "touch") return;
          if (event.pointerType === "mouse" && event.button !== 0) return;
          if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;
          swipePointerId = event.pointerId;
          swipeStartX = event.clientX;
          swipeStartY = event.clientY;
          swipeDone = false;
          heroSection.setPointerCapture?.(swipePointerId);
        });

        heroSection.addEventListener("pointermove", (event) => {
          if (swipePointerId !== event.pointerId || swipeDone) return;
          const deltaX = event.clientX - swipeStartX;
          const deltaY = event.clientY - swipeStartY;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (absX < axisLockThreshold && absY < axisLockThreshold) return;
          if (absY > absX) return;
          if (absX < swipeThreshold) return;

          swipeDone = true;
          setHeroByOffset(deltaX < 0 ? 1 : -1);
          event.preventDefault();
        }, { passive: false });

        const endSwipe = (event) => {
          if (swipePointerId !== event.pointerId) return;
          heroSection.releasePointerCapture?.(swipePointerId);
          resetSwipe();
        };

        heroSection.addEventListener("pointerup", endSwipe);
        heroSection.addEventListener("pointercancel", endSwipe);
      }
    }
  };

  const renderReelPage = () => {
    const page = document.querySelector("[data-reel-page]");
    if (!page) return;
    const category = getReelCategoryFromPath();
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

    if (mainProject && getProjectPlayableVideo(mainProject)) {
      const localVideo = getProjectPlayableVideo(mainProject);
      video.poster = getProjectThumbnail(mainProject);
      video.innerHTML = `<source src="${localVideo}" type="${getVideoType(localVideo)}">`;
    } else if (mainProject && getProjectThumbnail(mainProject) && playerWrap) {
      const poster = document.createElement("img");
      poster.className = "reel-player reel-player--poster";
      poster.src = getProjectThumbnail(mainProject);
      poster.alt = `${mainProject.title} reel poster`;
      playerWrap.replaceChildren(poster);
    } else if (playerWrap) {
      const empty = document.createElement("p");
      empty.className = "reel-empty";
      empty.textContent = "More work coming soon.";
      playerWrap.replaceChildren(empty);
    }

    appendHeroScrollCue(playerWrap);

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

  const initHorizontalTimeline = () => {
    const sections = Array.from(document.querySelectorAll("[data-horizontal-timeline]"));
    if (!sections.length) return;

    const timelines = sections
      .map((section) => {
        const track = section.querySelector("[data-horizontal-timeline-track]");
        const progress = section.querySelector("[data-horizontal-timeline-progress]");
        const items = Array.from(section.querySelectorAll(".about-timeline__item"));
        const skipButton = section.querySelector("[data-about-timeline-skip]");
        if (!track) return null;
        return { section, track, progress, items, skipButton, maxShift: 0 };
      })
      .filter(Boolean);

    if (!timelines.length) return;

    const updateMetrics = () => {
      timelines.forEach((timeline) => {
        const viewport = timeline.section.querySelector(".about-timeline__viewport");
        const viewportWidth = viewport?.clientWidth || timeline.section.clientWidth;
        timeline.maxShift = Math.max(timeline.track.scrollWidth - viewportWidth, 0);
        const baseHeight = window.innerHeight;
        const travelHeight = timeline.maxShift + baseHeight * 0.9;
        timeline.section.style.setProperty("--timeline-scroll-span", `${Math.max(baseHeight * 2, travelHeight)}px`);
      });
    };

    const updateProgress = () => {
      timelines.forEach((timeline) => {
        const rect = timeline.section.getBoundingClientRect();
        const total = Math.max(timeline.section.offsetHeight - window.innerHeight, 1);
        const progress = Math.max(0, Math.min((-rect.top) / total, 1));
        const shift = timeline.maxShift * progress;

        timeline.track.style.transform = `translate3d(${-shift}px, 0, 0)`;
        timeline.progress?.style.setProperty("transform", `scaleX(${progress.toFixed(3)})`);

        if (timeline.items.length) {
          const activeIndex = Math.min(
            timeline.items.length - 1,
            Math.max(0, Math.round(progress * (timeline.items.length - 1)))
          );
          timeline.items.forEach((item, index) => item.classList.toggle("is-active", index === activeIndex));
        }
      });
    };

    let rafId = 0;
    const requestTimelineUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        updateProgress();
        rafId = 0;
      });
    };

    updateMetrics();
    updateProgress();

    timelines.forEach((timeline) => {
      if (!timeline.skipButton) return;
      timeline.skipButton.addEventListener("click", () => {
        const target = timeline.section.nextElementSibling;
        if (!(target instanceof HTMLElement)) return;

        const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (window.zodiacLenis?.scrollTo) {
          window.zodiacLenis.scrollTo(target, { duration: prefersReducedMotion ? 0.01 : 1.1 });
          return;
        }

        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      });
    });

    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.zodiacLenis?.on?.("scroll", requestTimelineUpdate);
    window.addEventListener("resize", () => {
      updateMetrics();
      requestTimelineUpdate();
    });
    window.addEventListener("load", () => {
      updateMetrics();
      requestTimelineUpdate();
    });
  };

  renderWorkPage();
  renderProjectGrid();
  initBrandLogo();
  initProjectViewportPreviews();
  renderReelGrid();
  renderReelPage();
  renderProjectDetailPage();
  initHeroScrollCues();
  initProjectDisclosures();
  renderTeamSection();
  renderTeamProfilePage();
  initCapabilitiesKinetic();
  initHorizontalTimeline();

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

  const navTimeline = document.querySelector(".nav-timeline");
  const navSegments = Array.from(navTimeline?.querySelectorAll("[data-progress-segment]") || []);
  let navTimelineTargets = [];

  const getMiddleFallbackRatios = (count) => {
    if (count <= 0) return [];
    return Array.from({ length: count }, (_, index) => (index + 1) / (count + 1));
  };

  const buildNavTimelineTargets = () => {
    const segmentCount = navSegments.length;
    if (!segmentCount) return [];
    if (segmentCount === 1) return [{ type: "position", y: 0, label: "Top" }];

    const middleCount = Math.max(0, segmentCount - 2);
    const visibleSections = getVisibleSections();
    const topY = 0;
    const bottomY = getScrollMax();
    const topCutoff = Math.min(160, bottomY * 0.1);
    const bottomCutoff = Math.max(0, bottomY - Math.min(160, bottomY * 0.1));
    const middleSections = visibleSections.filter((section) => {
      const y = getElementY(section);
      return y > topCutoff && y < bottomCutoff;
    });

    const explicitMiddle = navSegments.slice(1, segmentCount - 1).map((segment) => {
      const explicitSelector = segment.getAttribute("data-nav-target");
      const explicitElement = resolveSelectorTarget(explicitSelector);
      return explicitElement ? { segment, element: explicitElement } : null;
    });

    const explicitElements = explicitMiddle
      .filter(Boolean)
      .map((item) => item.element);
    const autoPool = middleSections.filter((section) => !explicitElements.includes(section));
    const autoPicked = pickEvenly(
      autoPool,
      Math.max(0, middleCount - explicitElements.length)
    );

    const middleTargets = [];
    let autoIndex = 0;
    for (let slot = 0; slot < middleCount; slot += 1) {
      const explicitItem = explicitMiddle[slot];
      const section = explicitItem?.element || autoPicked[autoIndex] || null;
      if (section && !explicitItem) autoIndex += 1;
      if (section) {
        middleTargets.push({
          type: "element",
          element: section,
          label: getSectionLabel(section, slot + 1)
        });
      } else {
        const fallbackRatio = getMiddleFallbackRatios(middleCount)[slot] || 0.5;
        middleTargets.push({
          type: "position",
          y: () => getScrollMax() * fallbackRatio,
          label: `Section ${String(slot + 2).padStart(2, "0")}`
        });
      }
    }

    return [
      { type: "position", y: topY, label: "Top" },
      ...middleTargets,
      { type: "position", y: () => getScrollMax(), label: "End" }
    ].slice(0, segmentCount);
  };

  const getTimelineTargetY = (target) => {
    if (!target) return 0;
    if (target.type === "element" && target.element) {
      return clamp(getElementY(target.element), 0, getScrollMax());
    }
    const y = typeof target.y === "function" ? target.y() : target.y;
    return clamp(Number(y) || 0, 0, getScrollMax());
  };

  const scrollToTimelineTarget = (target) => {
    if (!target) return;
    if (target.type === "element" && target.element) {
      scrollToTarget(target.element, { duration: 1.05 });
      return;
    }
    scrollToTarget(getTimelineTargetY(target), { duration: 1.05 });
  };

  const applyNavTimelineTargets = () => {
    if (!navSegments.length) return;
    navTimelineTargets = buildNavTimelineTargets();

    navSegments.forEach((segment, index) => {
      const target = navTimelineTargets[index];
      if (!target) return;
      const labelText = target.label || `Section ${String(index + 1).padStart(2, "0")}`;

      segment.dataset.timelineIndex = String(index);
      segment.setAttribute("tabindex", "0");
      segment.setAttribute("role", "link");
      segment.setAttribute("aria-label", `Jump to ${labelText}`);
      if (index === 0) {
        segment.setAttribute("data-nav-target", "__page_top__");
      } else if (index === navSegments.length - 1) {
        segment.setAttribute("data-nav-target", "__page_bottom__");
      }

      let labelNode = segment.querySelector(".nav-timeline__label");
      if (!labelNode) {
        labelNode = document.createElement("span");
        labelNode.className = "nav-timeline__label";
        segment.append(labelNode);
      }
      labelNode.textContent = labelText;
      labelNode.title = labelText;
    });
  };

  let lastScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  let mobileHeaderHidden = false;
  const mobileHeaderQuery = window.matchMedia("(max-width: 900px)");
  const mobileHeaderHideDelta = 10;

  const setMobileHeaderHidden = (nextHidden) => {
    if (!header || mobileHeaderHidden === nextHidden) return;
    mobileHeaderHidden = nextHidden;
    header.classList.toggle("is-hidden", mobileHeaderHidden);
  };

  const updateScrollState = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = Math.max(getScrollMax(), 1);
    header?.classList.toggle("is-scrolled", scrollTop > 24);

    if (!header) {
      lastScrollTop = scrollTop;
    } else if (!mobileHeaderQuery.matches) {
      setMobileHeaderHidden(false);
      lastScrollTop = scrollTop;
    } else {
      const lockedHeader =
        body.classList.contains("is-mobile-nav-open") ||
        body.classList.contains("is-work-overlay-open");

      if (lockedHeader || scrollTop <= 24) {
        setMobileHeaderHidden(false);
      } else {
        const delta = scrollTop - lastScrollTop;
        if (delta > mobileHeaderHideDelta) {
          setMobileHeaderHidden(true);
        } else if (delta < -mobileHeaderHideDelta) {
          setMobileHeaderHidden(false);
        }
      }
      lastScrollTop = scrollTop;
    }

    if (navSegments.length && navTimelineTargets.length === navSegments.length) {
      const anchors = navTimelineTargets.map((target) => getTimelineTargetY(target));
      navSegments.forEach((segment, index) => {
        const prev = index === 0 ? 0 : anchors[index - 1];
        const current = anchors[index];
        const next = index === navSegments.length - 1 ? maxScroll : anchors[index + 1];
        const start = index === 0 ? 0 : (prev + current) / 2;
        const end = index === navSegments.length - 1 ? maxScroll : (current + next) / 2;
        const span = Math.max(end - start, 1);
        const fill = clamp((scrollTop - start) / span, 0, 1);
        segment.style.setProperty("--fill", fill.toFixed(3));
      });
      return;
    }

    progressSegments.forEach((segment, index) => {
      const segmentStart = index / progressSegments.length;
      const segmentEnd = (index + 1) / progressSegments.length;
      const progress = Math.min(scrollTop / maxScroll, 1);
      const fill = (progress - segmentStart) / (segmentEnd - segmentStart);
      segment.style.setProperty("--fill", clamp(fill, 0, 1).toFixed(3));
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
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  let navResizeRaf = 0;
  window.addEventListener("resize", () => {
    if (navResizeRaf) return;
    navResizeRaf = window.requestAnimationFrame(() => {
      navResizeRaf = 0;
      applyNavTimelineTargets();
      requestScrollUpdate();
    });
  });
  window.addEventListener("load", () => {
    applyNavTimelineTargets();
    requestScrollUpdate();
  });
  updateScrollState();
  applyNavTimelineTargets();

  if (navTimeline && navSegments.length) {
    const setActiveSegment = (activeSegment = null) => {
      navSegments.forEach((segment) => {
        segment.classList.toggle("is-active-segment", segment === activeSegment);
      });
    };

    navSegments.forEach((segment) => {
      const activateSegment = (event) => {
        event.preventDefault();
        const index = Number.parseInt(segment.dataset.timelineIndex || "-1", 10);
        const target = navTimelineTargets[index];
        if (!target) return;
        setActiveSegment(segment);
        scrollToTimelineTarget(target);
      };

      segment.addEventListener("click", activateSegment);
      segment.addEventListener("pointerenter", () => {
        navTimeline.classList.add("is-hovering-segment");
        setActiveSegment(segment);
      });

      segment.addEventListener("pointerleave", () => {
        // Keep active state stable while pointer is still within timeline.
      });

      segment.addEventListener("focusin", () => {
        navTimeline.classList.add("is-focus-within-segment");
        setActiveSegment(segment);
      });

      segment.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!navTimeline.contains(document.activeElement)) {
            navTimeline.classList.remove("is-focus-within-segment");
            setActiveSegment(null);
          }
        }, 0);
      });

      segment.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        activateSegment(event);
      });
    });

    navTimeline.addEventListener("pointerleave", () => {
      navTimeline.classList.remove("is-hovering-segment");
      setActiveSegment(null);
    });
  }

  document.querySelectorAll("[data-nav-target]").forEach((trigger) => {
    const isTimelineSegment = trigger.hasAttribute("data-progress-segment");
    if (isTimelineSegment) return;
    trigger.addEventListener("click", (event) => {
      const targetId = trigger.getAttribute("data-nav-target");
      const target = resolveSelectorTarget(targetId);
      if (!target) return;
      event.preventDefault();
      scrollToTarget(target);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      trigger.click();
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.hasAttribute("data-nav-target")) return;
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      let target = null;
      try {
        target = document.querySelector(targetId);
      } catch {
        return;
      }
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);
    });
  });

  const updateLocalTime = () => {
    if (!localTimeNodes.length) return;
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    localTimeNodes.forEach((node) => {
      node.textContent = `Local Time ${formatter.format(new Date())}`;
    });
  };
  updateLocalTime();
  window.setInterval(updateLocalTime, 30000);
})();
