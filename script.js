(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const loader = document.querySelector("[data-loader]");
  const header = document.querySelector("[data-header]");
  const progressSegments = Array.from(document.querySelectorAll("[data-progress-segment]"));
  const localTime = document.querySelector("[data-local-time]");
  const projects = Array.isArray(window.projects) ? window.projects : [];
  const reels = Array.isArray(window.reels) ? window.reels : [];

  const categories = {
    all: {
      title: "All Work",
      subtitle: "Selected VFX, CGI, music video, film, and commercial work by Zodiac II Media."
    },
    film: {
      title: "Film",
      subtitle: "Selected cinematic VFX, brand film, and environment work by Zodiac II Media."
    },
    commercial: {
      title: "Commercial",
      subtitle: "Selected commercial, CGI, and VFX work by Zodiac II Media."
    },
    "music-video": {
      title: "Music Video",
      subtitle: "Selected music video VFX, cleanup, compositing, and cinematic image work."
    }
  };

  const createOverlay = () => {
    const overlay = document.createElement("div");
    overlay.className = "work-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <p class="work-overlay__label">Work Index</p>
      <button class="work-overlay__back" type="button" data-work-close>Back</button>
      <nav class="work-overlay__links" aria-label="Work category navigation">
        <a style="--i:0" href="work.html?category=all">All Work</a>
        <a style="--i:1" href="work.html?category=film">Film</a>
        <a style="--i:2" href="work.html?category=commercial">Commercial</a>
        <a style="--i:3" href="work.html?category=music-video">Music Video</a>
      </nav>
    `;
    document.body.append(overlay);
    return overlay;
  };

  const workOverlay = createOverlay();
  const closeButton = workOverlay.querySelector("[data-work-close]");

  const openWorkOverlay = () => {
    body.classList.add("is-work-overlay-open");
    workOverlay.classList.add("is-open");
    workOverlay.setAttribute("aria-hidden", "false");
    closeButton.focus();
  };

  const closeWorkOverlay = () => {
    body.classList.remove("is-work-overlay-open");
    workOverlay.classList.remove("is-open");
    workOverlay.setAttribute("aria-hidden", "true");
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
            <h3>${project.title}</h3>
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
    link.href = reel.url;
    link.setAttribute("aria-label", `Watch ${reel.title}`);
    link.dataset.reelType = reel.type;
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
      const cards = reels.map(reelTemplate);
      grid.replaceChildren(...cards);
      cards.forEach(setupReelPreview);
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
    const pageTitle = document.querySelector("[data-category-title]");
    if (!pageTitle) return;
    const category = getCategory();
    const categoryData = categories[category];
    const filteredProjects = category === "all" ? projects : projects.filter((project) => project.category === category);
    const heroProjects = filteredProjects.length ? filteredProjects : projects;
    const firstProject = filteredProjects[0] || projects[0];
    let activeHeroIndex = Math.max(heroProjects.indexOf(firstProject), 0);
    const heroCategory = document.querySelector("[data-category-hero-category]");
    const heroTitle = document.querySelector("[data-category-hero-title]");
    const heroMedia = document.querySelector("[data-category-media]");
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
      if (heroCategory) heroCategory.textContent = categoryData.title;
      if (heroTitle) heroTitle.textContent = project.title;
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

    pageTitle.textContent = categoryData.title;
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
      heroProgress?.setAttribute("hidden", "");
    } else {
      heroProgress?.removeAttribute("hidden");
      prevButton?.addEventListener("click", () => setHeroByOffset(-1));
      nextButton?.addEventListener("click", () => setHeroByOffset(1));
    }
  };

  const renderReelPage = () => {
    const page = document.querySelector("[data-reel-page]");
    if (!page || !reels.length) return;
    const type = new URLSearchParams(window.location.search).get("type");
    const reel = reels.find((item) => item.type === type) || reels[0];
    const title = page.querySelector("[data-reel-title]");
    const label = page.querySelector("[data-reel-label]");
    const description = page.querySelector("[data-reel-description]");
    const video = page.querySelector("[data-reel-video]");
    const otherReels = page.querySelector("[data-other-reels]");

    title.textContent = reel.title;
    label.textContent = reel.label;
    description.textContent = reel.description;
    document.title = `${reel.title} | Zodiac II Media`;

    video.poster = reel.poster;
    video.innerHTML = `<source src="${reel.fullVideo}" type="${getVideoType(reel.fullVideo)}">`;

    const links = reels
      .filter((item) => item.type !== reel.type)
      .map((item) => {
        const link = document.createElement("a");
        link.href = item.url;
        link.textContent = item.title;
        return link;
      });
    otherReels.replaceChildren(...links);
  };

  renderWorkPage();
  renderProjectGrid();
  renderReelGrid();
  renderReelPage();

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
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollState();

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
