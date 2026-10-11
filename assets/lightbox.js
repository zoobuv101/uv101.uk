/* Gallery viewer: tap any picture in a post or the gallery to open it full screen, then swipe (or use the
   arrows / arrow keys) through every picture on the page. Esc, the close button or the phone's back button
   closes it. Slides are a native scroll-snap strip, so swiping feels like the phone's own photo viewer.
   Tapping the picture itself opens the full-resolution file (data-full, else the shown file) in a new tab. */
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll(".page figure img, .gallery figure img"))
    .filter(function (im) { return !im.closest(".masthead, .hero, .tiles"); });
  if (!imgs.length) return;

  var items = imgs.map(function (im) {
    var fig = im.closest("figure"), cap = fig && fig.querySelector("figcaption"), a = im.closest("a");
    var src = a ? a.getAttribute("href") : im.currentSrc || im.src;
    return { src: src, full: im.getAttribute("data-full") || src, alt: im.alt, cap: cap ? cap.innerHTML : "" };
  });

  var box = document.createElement("div");
  box.className = "lb"; box.hidden = true;
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Picture viewer");
  box.innerHTML = '<div class="lb__track"></div>' +
    '<button class="lb__btn lb__close" aria-label="Close">&times;</button>' +
    '<button class="lb__btn lb__prev" aria-label="Previous picture">&lsaquo;</button>' +
    '<button class="lb__btn lb__next" aria-label="Next picture">&rsaquo;</button>' +
    '<p class="lb__count" aria-live="polite"></p>';
  var track = box.querySelector(".lb__track"), count = box.querySelector(".lb__count");
  items.forEach(function (it) {
    var s = document.createElement("figure");
    s.className = "lb__slide";
    s.innerHTML = '<a class="lb__full" target="_blank" rel="noopener"><img alt="" decoding="async"></a><figcaption></figcaption>';
    var link = s.querySelector("a");
    link.href = it.full;
    link.title = it.full !== it.src ? "Open the full-resolution image in a new tab" : "Open the image in a new tab";
    s.querySelector("img").alt = it.alt;
    s.querySelector("figcaption").innerHTML = it.cap;
    track.appendChild(s);
  });
  document.body.appendChild(box);
  var slides = track.children, cur = 0, opener = null;

  function load(i) {  // only fetch the pictures either side of the one being viewed
    for (var j = i - 1; j <= i + 1; j++) {
      var im = slides[j] && slides[j].querySelector("img");
      if (im && !im.getAttribute("src")) im.src = items[j].src;
    }
  }
  function show(i) {
    cur = Math.max(0, Math.min(items.length - 1, i));
    load(cur);
    count.textContent = (cur + 1) + " / " + items.length;
    box.querySelector(".lb__prev").hidden = cur === 0;
    box.querySelector(".lb__next").hidden = cur === items.length - 1;
  }
  function go(i) {
    i = Math.max(0, Math.min(items.length - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }
  function open(i) {
    opener = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add("lb-open");
    track.scrollLeft = i * track.clientWidth;
    show(i);
    box.querySelector(".lb__close").focus();
    history.pushState({ lb: 1 }, "");
  }
  function close(fromHistory) {
    if (box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove("lb-open");
    imgs[cur].scrollIntoView({ block: "center" });
    if (opener && opener.focus) opener.focus();
    if (!fromHistory && history.state && history.state.lb) history.back();
  }

  imgs.forEach(function (im, i) {
    var target = im.closest("a") || im;
    if (target === im) { im.tabIndex = 0; im.setAttribute("role", "button"); }
    im.style.cursor = "zoom-in";
    target.addEventListener("click", function (e) { e.preventDefault(); open(i); });
    target.addEventListener("keydown", function (e) {
      if (target === im && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(i); }
    });
  });

  var t;
  track.addEventListener("scroll", function () {
    clearTimeout(t);
    t = setTimeout(function () { show(Math.round(track.scrollLeft / track.clientWidth)); }, 60);
  });
  window.addEventListener("resize", function () { if (!box.hidden) track.scrollLeft = cur * track.clientWidth; });
  box.querySelector(".lb__close").addEventListener("click", function () { close(false); });
  box.querySelector(".lb__prev").addEventListener("click", function () { go(cur - 1); });
  box.querySelector(".lb__next").addEventListener("click", function () { go(cur + 1); });
  track.addEventListener("click", function (e) { if (e.target === track || e.target.classList.contains("lb__slide")) close(false); });
  window.addEventListener("popstate", function () { close(true); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close(false);
    else if (e.key === "ArrowRight") go(cur + 1);
    else if (e.key === "ArrowLeft") go(cur - 1);
    else if (e.key === "Tab") {  // keep focus inside the viewer
      var b = Array.prototype.filter.call(box.querySelectorAll("button"), function (x) { return !x.hidden; });
      var k = b.indexOf(document.activeElement);
      e.preventDefault();
      b[(k + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
    }
  });
})();
