(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const loader = document.querySelector("[data-loader]");
  const header = document.querySelector("[data-header]");
  const progressSegments = Array.from(document.querySelectorAll("[data-progress-segment]"));
  const localTime = document.querySelector("[data-local-time]");
  const projectImages = Array.from(document.querySelectorAll(".project-card img"));

  body.classList.add("is-loading");

  const hideLoader = () => {
    if (!loader) return;
    loader.classList.add("is-hidden");
    body.classList.remove("is-loading");
    window.setTimeout(() => loader.remove(), 800);
  };

  if (prefersReducedMotion) {
    hideLoader();
  } else {
    window.setTimeout(hideLoader, 1350);
  }

  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  revealItems.forEach((item, index) => {
    item.style.setProperty("--delay", `${Math.min(index % 8, 7) * 55}ms`);
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

  projectImages.forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        image.classList.add("is-missing");
      },
      { once: true }
    );
  });

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
