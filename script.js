(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById("site-header");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = themeToggle.querySelector(".theme-icon-img, .theme-icon");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileLinks = mobileNav.querySelectorAll("a");
  const navLinks = document.querySelectorAll(".desktop-nav .nav-link");
  const sections = document.querySelectorAll("main section[id]");
  const filters = document.querySelectorAll(".filter-button");
  const projectCards = document.querySelectorAll(".project-card");
  const heroVideo = document.getElementById("hero-video");
  const isHomePage = body.dataset.page === "home";

  function updateThemeIcon() {
    const dark = root.dataset.theme === "dark";

    if (themeIcon) {
      if (themeIcon.tagName === "IMG") {
        const currentSrc = themeIcon.getAttribute("src") || "";
        const iconBase = currentSrc.includes("/")
          ? currentSrc.slice(0, currentSrc.lastIndexOf("/") + 1)
          : "assets/images/logos/";

        themeIcon.src = `${iconBase}${dark ? "sun.svg" : "moon.svg"}`;
      } else {
        // Backwards compatibility for project pages that still use the old span icon.
        themeIcon.textContent = dark ? "☀" : "☾";
      }
    }

    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }

  function toggleTheme() {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem("portfolio-theme", nextTheme);
    updateThemeIcon();
  }

  function closeMobileMenu() {
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    body.classList.remove("menu-open");
  }

  function toggleMobileMenu() {
    const opening = !mobileNav.classList.contains("open");
    mobileNav.classList.toggle("open", opening);
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Close navigation" : "Open navigation");
    body.classList.toggle("menu-open", opening);
  }

  function updateHeaderState() {
    if (!isHomePage) {
      header.classList.add("scrolled");
      return;
    }

    header.classList.toggle("scrolled", window.scrollY > 18);
  }

  function setActiveNav(id) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.section === id);
    });
  }

  function setupSectionObserver() {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveNav(visible[0].target.id);
        }
      },
      {
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0, 0.1, 0.25, 0.5]
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function filterProjects(filter) {
    projectCards.forEach((card) => {
      const matches = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !matches);
    });
  }

  function setupReducedMotion() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncVideo() {
      if (!heroVideo) return;
      if (reducedMotion.matches) {
        heroVideo.pause();
      } else {
        heroVideo.play().catch(() => {});
      }
    }

    syncVideo();
    reducedMotion.addEventListener?.("change", syncVideo);
  }

  themeToggle.addEventListener("click", toggleTheme);
  menuToggle.addEventListener("click", toggleMobileMenu);
  mobileLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));

  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeMobileMenu();
  });

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      filters.forEach((filterButton) => filterButton.classList.remove("active"));
      button.classList.add("active");
      filterProjects(button.dataset.filter);
    });
  });


  function setupAboutSlideshow() {
    const slideshow = document.getElementById("about-slideshow");
    if (!slideshow) return;

    const slides = Array.from(slideshow.querySelectorAll(".about-slide"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      const loadedSlides = slides.filter((slide) => slide.complete && slide.naturalWidth > 0);

      slides.forEach((slide) => {
        if (!loadedSlides.includes(slide)) {
          slide.classList.remove("is-active");
        }
      });

      slideshow.classList.toggle("is-empty", loadedSlides.length === 0);

      if (loadedSlides.length === 0) return;

      loadedSlides.forEach((slide) => slide.classList.remove("is-active"));
      loadedSlides[0].classList.add("is-active");

      if (loadedSlides.length === 1 || reducedMotion) return;

      let current = 0;
      window.setInterval(() => {
        loadedSlides[current].classList.remove("is-active");
        current = (current + 1) % loadedSlides.length;
        loadedSlides[current].classList.add("is-active");
      }, 4500);
    };

    let settled = 0;
    const settle = () => {
      settled += 1;
      if (settled >= slides.length) start();
    };

    slides.forEach((slide) => {
      if (slide.complete) {
        settle();
      } else {
        slide.addEventListener("load", settle, { once: true });
        slide.addEventListener("error", settle, { once: true });
      }
    });
  }

  const initialFilter = document.querySelector(".filter-button.active")?.dataset.filter || "all";
  filterProjects(initialFilter);

  const year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();

  updateThemeIcon();
  updateHeaderState();
  if (isHomePage) setupSectionObserver();
  setupReducedMotion();
  setupAboutSlideshow();
})();
