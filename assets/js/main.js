/* GF Maritime – site behaviour (no dependencies)
   curtain loader · header · menu + search · reveals · hero parallax · service tabs · contact form */
(function () {
  "use strict";

  var doc = document;
  var html = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(key, val) {
    try {
      if (val === undefined) return window.sessionStorage.getItem(key);
      window.sessionStorage.setItem(key, val);
    } catch (e) { /* storage can be unavailable (private mode) */ }
    return null;
  }

  /* ------------------------------------------------------------------
     Curtain loader + page transitions
     ------------------------------------------------------------------ */
  var curtain = $(".curtain");
  var revealsStarted = false;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function openCurtain() {
    if (revealsStarted) return;
    revealsStarted = true;
    if (curtain) {
      curtain.classList.add("is-open");
      setTimeout(function () { curtain.classList.add("is-done"); }, 1300);
    }
    html.classList.add("is-ready");
    setTimeout(startReveals, reduceMotion ? 0 : 350);
  }

  if (curtain && !reduceMotion) {
    var seen = store("gf-intro");
    if (seen) curtain.classList.add("is-quick");
    store("gf-intro", "1");

    var loaded = new Promise(function (resolve) {
      if (doc.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    });
    var fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
    Promise.all([loaded, fonts, wait(seen ? 120 : 1500)]).then(openCurtain);
    setTimeout(openCurtain, 6000); // never trap the visitor
  } else {
    openCurtain();
  }

  // Close the curtain, then navigate
  function leave(url) {
    if (!curtain || reduceMotion) { window.location.href = url; return; }
    curtain.classList.remove("is-done", "is-open");
    curtain.classList.add("is-quick", "is-leaving");
    setTimeout(function () { window.location.href = url; }, 700);
  }

  doc.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin || (url.protocol !== "http:" && url.protocol !== "https:")) return;
    if (/\.pdf$/i.test(url.pathname)) return; // downloads are handled by the browser
    var samePage = url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePage) return; // in-page anchor – let the browser (and tabs) handle it
    e.preventDefault();
    closeMenu(true);
    leave(url.href);
  });

  // Back/forward cache: make sure the page is not left behind a closed curtain
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && curtain) {
      curtain.classList.remove("is-leaving");
      curtain.classList.add("is-open", "is-done");
    }
  });

  /* ------------------------------------------------------------------
     Header
     ------------------------------------------------------------------ */
  var header = $(".site-header");
  var hero = $(".hero");
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      if (hero) {
        var limit = hero.offsetHeight - header.offsetHeight - 24;
        header.classList.toggle("is-solid", y > limit);
      }
    }
    if (hero && !reduceMotion && y < hero.offsetHeight + 100) {
      var media = $(".hero__media", hero);
      if (media) media.style.translate = "0 " + Math.round(y * 0.22) + "px";
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ------------------------------------------------------------------
     Menu + search
     ------------------------------------------------------------------ */
  var menu = $(".menu");
  var burger = $(".burger");
  var closeBtn = $(".menu__close");
  var searchInput = $("#site-search");
  var resultsEl = $("#search-results");
  var inertTargets = $$("main, .site-footer, .site-header, .wa");

  function openMenu() {
    if (!menu || menu.classList.contains("is-open")) return;
    menu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    doc.body.classList.add("is-locked");
    inertTargets.forEach(function (el) { el.inert = true; });
    setTimeout(function () { closeBtn && closeBtn.focus({ preventScroll: true }); }, 60);
  }

  function closeMenu(silent) {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    doc.body.classList.remove("is-locked");
    inertTargets.forEach(function (el) { el.inert = false; });
    if (!silent) burger.focus({ preventScroll: true });
  }

  if (menu && burger) {
    burger.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", function () { closeMenu(); });
    doc.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeMenu(); return; }
      if (e.key === "Tab") {
        var f = $$("a[href], button, input", menu).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    // same-page links inside the menu (e.g. #anchors) should also close it
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { closeMenu(true); });
    });
  }

  // Lightweight client-side search over the site's pages and sections
  var INDEX = [
    { t: "Home", u: "index.html", k: "welcome gf maritime ship agency panama canal trusted partner" },
    { t: "Who We Are", u: "who-we-are.html", k: "about us company panama based ship agency network singapore middle east turkey spain netherlands belgium us gulf gsa focal" },
    { t: "Vision & Mission", u: "who-we-are.html#vision", k: "vision mission trusted maritime partner of choice keeping vessels moving" },
    { t: "Our Approach", u: "who-we-are.html#approach", k: "professional responsive connected solutions-focused single point of contact" },
    { t: "Compliance and Safety", u: "who-we-are.html#standards", k: "compliance ethics health safety sustainability policy high standards" },
    { t: "What We Do", u: "what-we-do.html", k: "services our services maritime services marine" },
    { t: "Canal Transits", u: "what-we-do.html#canal-transits", k: "panama canal transit booking scheduling documentation pilot tug toll pda tonnage certificate advisory draft" },
    { t: "Husbandry Activities", u: "what-we-do.html#husbandry-activities", k: "husbandry launch services fresh water provisions garbage sludge fumigation sanitation divers hull cleaning afloat repairs drydock astibal surveys flag inspections courier hospital clinic cash to master crew changes hotel transportation immigration visa medical spare parts ship supplies" },
    { t: "Port Agency", u: "what-we-do.html#port-agency", k: "port calls agency terminals arrival departure formalities crew medical cash to master spare parts local service providers" },
    { t: "Owners Protective Agency", u: "what-we-do.html#owners-protective-agency", k: "owners protective agency representation oversight supervision charterer liaison cost control reporting" },
    { t: "Bunker Coordination", u: "what-we-do.html#bunker-coordination", k: "bunker fuel supplier coordination vessel scheduling delivery arrangements" },
    { t: "Where We Are", u: "where-we-are.html", k: "location panama city office map" },
    { t: "Ports & Terminals Across Panama", u: "where-we-are.html#coverage", k: "coverage atlantic caribbean pacific cristobal balboa manzanillo colon container terminal psa charco azul chiriqui grande anchorage limon bay gatun lake flamenco" },
    { t: "Useful Links", u: "useful-links.html", k: "acp notices to shipping advisories tariff gatun lake water level amp autoridad maritima migracion" },
    { t: "Talk To Us", u: "talk-to-us.html", k: "contact phone email address enquiry form renato bryant general manager office obarrio bella vista" },
    { t: "Compliance, Ethics, Health & Safety and Sustainability Policies", u: "policies.html", k: "policy policies compliance ethics health safety sustainability" },
  { t: "Terms and Conditions (PDF)", u: "assets/docs/GF-Maritime-Website-Terms-and-Conditions.pdf", k: "terms conditions legal user responsibilities liability intellectual property governing law" },
  { t: "Privacy Policy (PDF)", u: "assets/docs/GF-Maritime-Website-Privacy-Policy.pdf", k: "privacy personal data collection retention security consent rights gdpr legal" },
  { t: "Cookie Policy (PDF)", u: "assets/docs/GF-Maritime-Website-Cookie-Policy.pdf", k: "cookies tracking analytics google analytics browser settings legal" }
  ];

  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  var HERE = window.location.pathname.split("/").pop() || "index.html";

  function renderResults(q) {
    if (!resultsEl) return;
    resultsEl.innerHTML = "";
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return;
    var hits = INDEX.map(function (it) {
      var title = norm(it.t), hay = title + " " + norm(it.k);
      var ok = terms.every(function (t) { return hay.indexOf(t) !== -1; });
      var score = terms.reduce(function (s, t) { return s + (title.indexOf(t) !== -1 ? 2 : 1); }, 0);
      return ok ? { it: it, score: score } : null;
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 6);

    if (!hits.length) {
      var li = doc.createElement("li");
      li.className = "search-empty";
      li.textContent = "No results for “" + q + "”.";
      resultsEl.appendChild(li);
      return;
    }
    hits.forEach(function (h, i) {
      var li = doc.createElement("li");
      var a = doc.createElement("a");
      a.href = h.it.u;
      if (/\.pdf$/i.test(h.it.u)) { a.target = "_blank"; a.rel = "noopener"; }
      if (i === 0) a.dataset.active = "true";
      a.textContent = h.it.t;
      var small = doc.createElement("small");
      small.textContent = /\.pdf$/i.test(h.it.u) ? "PDF document" : h.it.u.split("#")[0].replace(".html", "").replace("index", "home").replace(/-/g, " ");
      a.appendChild(small);
      li.appendChild(a);
      resultsEl.appendChild(li);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () { renderResults(searchInput.value); });
    searchInput.addEventListener("keydown", function (e) {
      var items = $$("a", resultsEl);
      if (!items.length) return;
      var cur = items.findIndex(function (a) { return a.dataset.active === "true"; });
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var next = (cur + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach(function (a, i) { if (i === next) a.dataset.active = "true"; else delete a.dataset.active; });
      } else if (e.key === "Enter") {
        e.preventDefault();
        var target = items[Math.max(cur, 0)];
        var url = new URL(target.href, window.location.href);
        closeMenu(true);
        if (/\.pdf$/i.test(url.pathname)) { window.open(target.href, "_blank", "noopener"); return; }
        if (url.pathname === window.location.pathname) { window.location.href = target.href; }
        else leave(target.href);
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------ */
  function startReveals() {
    $$("[data-stagger]").forEach(function (parent) {
      Array.prototype.forEach.call(parent.children, function (child, i) {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "up");
        child.style.setProperty("--d", (i * 0.1).toFixed(2) + "s");
      });
    });
    var els = $$("[data-reveal], [data-wipe]");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Service tiles (home): no hover on touch, so the first tap reveals the description
     ------------------------------------------------------------------ */
  var noHover = window.matchMedia("(hover: none)");
  $$(".card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (!noHover.matches || card.classList.contains("is-open")) return;
      e.preventDefault();
      $$(".card.is-open").forEach(function (c) { c.classList.remove("is-open"); });
      card.classList.add("is-open");
    });
  });
  doc.addEventListener("click", function (e) {
    if (!e.target.closest(".card")) $$(".card.is-open").forEach(function (c) { c.classList.remove("is-open"); });
  });

  /* ------------------------------------------------------------------
     Service tabs (What We Do)
     ------------------------------------------------------------------ */
  var tablist = $(".tabs__list");
  if (tablist) {
    var tabs = $$('[role="tab"]', tablist);
    var panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute("aria-controls")); });
    var bar = $(".tabs__bar", tablist);
    var current = 0;

    var scroller = $(".tabs__scroller");
    var updateScrollState = function () {
      var max = tablist.scrollWidth - tablist.clientWidth;
      var hasPrev = tablist.scrollLeft > 4;
      var hasNext = tablist.scrollLeft < max - 4;
      scroller.classList.toggle("has-prev", hasPrev);
      scroller.classList.toggle("has-next", hasNext);
      tablist.style.setProperty("--fl", hasPrev ? "56px" : "0px");
      tablist.style.setProperty("--fr", hasNext ? "56px" : "0px");
    };
    tablist.addEventListener("scroll", updateScrollState, { passive: true });
    $(".tabs__arrow--prev", scroller).addEventListener("click", function () {
      tablist.scrollBy({ left: -tablist.clientWidth * 0.6, behavior: "smooth" });
    });
    $(".tabs__arrow--next", scroller).addEventListener("click", function () {
      tablist.scrollBy({ left: tablist.clientWidth * 0.6, behavior: "smooth" });
    });

    var moveBar = function () {
      var t = tabs[current];
      bar.style.setProperty("--x", t.offsetLeft + "px");
      bar.style.setProperty("--w", t.offsetWidth + "px");
    };

    var select = function (i, opts) {
      opts = opts || {};
      current = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
        panels[j].classList.toggle("is-active", on);
      });
      moveBar();
      var t = tabs[i];
      if (tablist.scrollWidth > tablist.clientWidth) {
        tablist.scrollTo({ left: t.offsetLeft - (tablist.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
      }
      if (opts.focus) t.focus();
      if (opts.push && window.history.replaceState) window.history.replaceState(null, "", "#" + t.dataset.slug);
    };

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, { push: true }); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, { focus: true, push: true }); }
      });
    });

    var fromHash = function () {
      var slug = window.location.hash.slice(1);
      var i = tabs.findIndex(function (t) { return t.dataset.slug === slug; });
      select(i === -1 ? 0 : i);
    };
    window.addEventListener("hashchange", function () {
      fromHash();
      var wrap = $(".tabs");
      if (wrap) wrap.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    window.addEventListener("resize", function () { moveBar(); updateScrollState(); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { moveBar(); updateScrollState(); });
    fromHash();
    updateScrollState();

    // One gentle nudge the first time the tabs are seen, to show that they scroll sideways
    if ("IntersectionObserver" in window && !reduceMotion) {
      var nudged = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        nudged.disconnect();
        if (tablist.scrollWidth - tablist.clientWidth < 24 || tablist.scrollLeft > 4) return;
        tablist.scrollTo({ left: 80, behavior: "smooth" });
        setTimeout(function () { tablist.scrollTo({ left: 0, behavior: "smooth" }); }, 900);
      }, { threshold: 0.9 });
      nudged.observe(scroller);
    }
  }

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */
  var form = $("#contact-form-el");
  if (form) {
    var status = $(".form-status", form);
    var MESSAGES = {
      firstName: "Please enter your first name.",
      lastName: "Please enter your last name.",
      email: "Please enter a valid email address.",
      imo: "An IMO number has 7 digits.",
      message: "Please tell us how we can help.",
      consent: "Please tick the consent box so we can reply to you."
    };

    var setError = function (input, msg) {
      var field = input.closest(".field") || input.closest(".consent");
      var err = field && $(".err", field);
      if (field) field.classList.toggle("has-error", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
    };

    $$("input, textarea", form).forEach(function (el) {
      el.addEventListener("input", function () { if (el.validity.valid) setError(el, ""); });
    });

    var CONTACT_EMAIL = "operations@gf-maritime.com";

    // Spam trap: the server rejects submissions that arrive faster than a person could fill the form
    var stamp = function () { var t = $("#form-ts", form); if (t) t.value = String(Date.now()); };
    stamp();

    var mailtoHref = function (data) {
      var lines = [
        "Company: " + (data.company || "-"),
        "Name: " + data.firstName + " " + data.lastName,
        "Email: " + data.email,
        "Contact number: " + (data.phone || "-"),
        "Vessel name: " + (data.vessel || "-"),
        "IMO number: " + (data.imo || "-"),
        "Port/Canal requirement: " + (data.requirement || "-"),
        "",
        data.message
      ];
      var subject = "Website enquiry" + (data.vessel ? " – " + data.vessel : data.company ? " – " + data.company : "");
      return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
    };

    // Sending failed: never lose the enquiry – offer the same message as a ready-to-send email
    var showFallback = function (data) {
      var a = doc.createElement("a");
      a.href = mailtoHref(data);
      a.textContent = "Send it by email instead";
      status.className = "form-status is-error";
      status.textContent = "Sorry, we couldn’t send your message just now. ";
      status.appendChild(a);
    };

    // Hand the enquiry to the visitor's email app (used when no email service is configured)
    var openEmailApp = function (data) {
      window.location.href = mailtoHref(data);
      status.className = "form-status";
      status.textContent = "Your email app should now open with your message ready to send. If it doesn’t, please email " + CONTACT_EMAIL + ".";
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      var firstBad = null;
      $$("[required], [pattern]", form).forEach(function (el) {
        if (!el.value && !el.required) { setError(el, ""); return; }
        var ok = el.type === "checkbox" ? el.checked : el.checkValidity();
        setError(el, ok ? "" : (MESSAGES[el.name] || "Please check this field."));
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      if ($("#website", form).value) return; // honeypot

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      var btn = $("button[type=submit]", form);
      var endpoint = form.dataset.endpoint;

      if (endpoint) {
        btn.disabled = true;
        status.textContent = "Sending…";
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        }).then(function (r) {
          // 503 = the email service is not configured yet: behave like the plain email-app form
          if (r.status === 503) { openEmailApp(data); return; }
          if (!r.ok) throw new Error(String(r.status));
          form.reset();
          stamp();
          status.textContent = "Thank you – your message has been sent. We will be in touch shortly.";
        }).catch(function () {
          showFallback(data);
        }).then(function () { btn.disabled = false; });
        return;
      }

      openEmailApp(data);
    });
  }
})();
