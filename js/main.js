/* ===== Shared behaviour: theme, language, nav, animations, page renderers ===== */
(function () {
  const S = window.SITE;
  const LS = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---- theme (light / dark), persisted ---- */
  const root = document.documentElement;
  const savedTheme = LS.get("theme") || "dark";
  root.classList.toggle("dark", savedTheme === "dark");
  function toggleTheme() { const dark = root.classList.toggle("dark"); LS.set("theme", dark ? "dark" : "light"); renderThemeIcon(); }

  /* ---- language (en / fr), persisted ---- */
  let lang = LS.get("lang") || "en";
  const T = () => S.i18n[lang];
  function toggleLang() { lang = lang === "en" ? "fr" : "en"; LS.set("lang", lang); document.documentElement.lang = lang; renderAll(); }

  /* ---- helpers ---- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let page = document.body.dataset.page;

  const ICONS = {
    linkedin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.3 8h4.4v14H.3V8zm7.5 0h4.2v1.9h.1c.6-1.1 2-2.3 4.2-2.3 4.5 0 5.3 3 5.3 6.8V22h-4.4v-6.7c0-1.6 0-3.7-2.2-3.7s-2.6 1.7-2.6 3.6V22H7.8V8z"/></svg>',
    scholar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/></svg>',
    rg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 20V6h5a3 3 0 010 6H8"/><path d="M11 12l4 8"/><path d="M17 4h3M18.5 2.5v3"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>'
  };

  const outlook = () => "https://outlook.office.com/mail/deeplink/compose?to=" + encodeURIComponent(S.email.toLowerCase()) + "&subject=" + encodeURIComponent(lang === "fr" ? "Collaboration - sécheresse et observation de la Terre" : "Collaboration - drought & Earth observation");

  /* ---- header / nav ---- */
  function renderNav() {
    const t = T().nav;
    const links = [["index.html", t.home, "home"], ["about.html", t.about, "about"], ["projects.html", t.projects, "projects"], ["publications.html", t.pubs, "pubs"], ["certificates.html", t.certs, "certs"]].concat(S.events && S.events.length ? [["events.html", t.events, "events"]] : []).concat(S.references && S.references.length ? [["references.html", t.refs, "refs"]] : []).concat([["contact.html", t.contact, "contact"]]);
    const linkHtml = links.map(([h, l, k]) => `<a class="nl" href="${h}" ${page === k ? 'aria-current="page"' : ""}>${esc(l)}</a>`).join("");
    const socials = `<a class="soc" href="${S.links.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICONS.linkedin}</a>
      <a class="soc" href="${S.links.scholar}" target="_blank" rel="noopener" aria-label="Google Scholar">${ICONS.scholar}</a>
      <a class="soc" href="${S.links.researchgate}" target="_blank" rel="noopener" aria-label="ResearchGate">${ICONS.rg}</a>
      <a class="soc" href="${outlook()}" target="_blank" rel="noopener" aria-label="Email via Outlook">${ICONS.mail}</a>
      <button class="lang" id="langBtn" aria-label="Switch language">${lang === "en" ? "FR" : "EN"}</button>
      <button class="theme" id="themeBtn" aria-label="Toggle dark mode"></button>`;
    $("#header").innerHTML = `
      <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      <nav class="nav-links">${linkHtml}</nav>
      <a class="logo" href="index.html" aria-label="Home"><img src="images/profile/avatar.png" alt="" width="48" height="48"><span>Sabir OUSSAOUI</span></a>
      <div class="socials">${socials}</div>`;
    let menu = $("#mobileMenu"); if (!menu) { menu = document.createElement("div"); menu.className = "mobile-menu"; menu.id = "mobileMenu"; document.body.appendChild(menu); }
    menu.innerHTML = `<button class="menu-close" id="menuClose" aria-label="Close menu">&times;</button>${linkHtml}<div class="socials" style="display:flex">${socials.replace(/id="(langBtn|themeBtn)"/g, 'data-m="$1"')}</div>`;
    $("#themeBtn").addEventListener("click", toggleTheme);
    $("#langBtn").addEventListener("click", toggleLang);
    $$('[data-m="themeBtn"]').forEach((b) => b.addEventListener("click", toggleTheme));
    $$('[data-m="langBtn"]').forEach((b) => b.addEventListener("click", toggleLang));
    const burger = $("#burger");
    const setMenu = (open) => { menu.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); document.body.style.overflow = open ? "hidden" : ""; };
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
    $("#menuClose").addEventListener("click", () => setMenu(false));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    // The name badge replays the opening screen and brings the visitor back home.
    $("#header .logo").addEventListener("click", (e) => {
      if (!window.showIntro || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); e.stopPropagation();
      window.showIntro();
      if (page !== "home" && typeof softGo === "function" && location.protocol !== "file:") softGo(new URL("index.html", location.href).href, true);
      else if (page !== "home") setTimeout(() => { location.href = "index.html"; }, 50);
    });
    renderThemeIcon();
  }
  function renderThemeIcon() { const dark = root.classList.contains("dark"); $$("#themeBtn,[data-m='themeBtn']").forEach((b) => (b.innerHTML = dark ? ICONS.sun : ICONS.moon)); }

  function renderFooter() {
    $("#footer").innerHTML = `<span>© ${new Date().getFullYear()} ${esc(S.name)} · UM6P-IWRI · UQTR-RIVE</span><a href="${outlook()}" target="_blank" rel="noopener">${esc(T().say)}</a>`;
  }

  /* ---- animated headline (word by word) ---- */
  function animateText(el, text) {
    el.innerHTML = text.split(" ").map((w, i) => `<span class="anim-word" style="animation-delay:${0.08 * i}s">${esc(w)}&nbsp;</span>`).join("");
  }

  /* ---- scroll reveal + timeline rails + counters ---- */
  function observeReveals() {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$(".reveal, .timeline li").forEach((el) => io.observe(el));
    $$(".stats .num[data-to]").forEach((el) => {
      const o = new IntersectionObserver((en) => { if (en[0].isIntersecting) { countUp(el); o.disconnect(); } });
      o.observe(el);
    });
  }
  function countUp(el) {
    const to = Number(el.dataset.to), suffix = el.dataset.suffix || "", start = performance.now(), dur = 1600;
    (function step(now) { const p = Math.min(1, (now - start) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v + suffix; if (p < 1) requestAnimationFrame(step); })(start);
  }
  function timelineRails() {
    const rails = $$(".timeline");
    if (!rails.length) return;
    const update = () => rails.forEach((tl) => {
      const r = tl.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
      $(".rail i", tl).style.height = p * 100 + "%";
    });
    window.addEventListener("scroll", update, { passive: true }); update();
  }

  /* ---- page renderers ---- */
  function renderHome() {
    const t = T();
    animateText($("#heroTitle"), t.heroTitle);
    $("#heroSub").innerHTML = t.heroSub; // trusted string from data.js; contains <b>
    $("#heroCot").textContent = t.cotutelle;
    $("#ctaResearch").textContent = t.ctaResearch;
    $("#ctaPubs").textContent = t.ctaPubs;
    const cv = $("#cvLink");
    if (S.cvFile) { cv.href = S.cvFile; cv.textContent = t.cv; cv.setAttribute("download", ""); } else { cv.removeAttribute("href"); cv.textContent = t.cvNote; cv.style.textDecoration = "none"; cv.style.fontWeight = "500"; cv.style.color = "var(--muted)"; }
    $("#hireLabel").textContent = t.hire;
    $("#hireLabel").href = outlook();
    $("#ringText").textContent = lang === "en" ? "Open to collaboration · drought · water · EO · " : "Ouvert aux collaborations · sécheresse · eau · ";
  }

  function renderAbout() {
    const t = T();
    animateText($("#aboutTitle"), t.aboutTitle);
    $("#bioHead").textContent = t.bioHead;
    $("#bio").innerHTML = t.bio.map((p) => `<p>${esc(p)}</p>`).join("");
    $("#stats").innerHTML = t.stats.map(([n, suf, l]) => `<div><span class="num" data-to="${n}" data-suffix="${suf}">0</span><span class="lbl">${esc(l)}</span></div>`).join("");
    $("#skillsTitle").textContent = t.skillsTitle;
    $("#skillsNote").textContent = t.skillsNote;
    const rings = [{ r: 150, d: 36 }, { r: 232, d: 52 }, { r: 312, d: 70 }, { r: 388, d: 92 }];
    const byRing = {}; S.skills.forEach((s) => { (byRing[s[2]] = byRing[s[2]] || []).push(s); });
    const satIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="6" height="6" rx="1"/><rect x="1" y="10" width="6" height="4"/><rect x="17" y="10" width="6" height="4"/><path d="M12 15v4M9 20h6"/></svg>';
    let orbits = "";
    Object.keys(byRing).forEach((k) => {
      const ring = rings[k], items = byRing[k], n = items.length;
      items.forEach(([label, cls, , size], i) => {
        const delay = -(i / n) * ring.d;
        orbits += `<div class="orbit" style="--d:${ring.d}s;--delay:${delay}s"><div class="sat-pos" style="--r:${ring.r}px"><div class="skill ${cls}" style="--s:${size}px;--d:${ring.d}s;--delay:${delay}s">${satIcon}<span>${esc(label)}</span></div></div></div>`;
      });
    });
    $("#skills").innerHTML = rings.map((rg) => `<div class="ring" style="--r:${rg.r}px"></div>`).join("") +
      `<div class="globe" aria-hidden="true"><img src="images/earth.gif" alt="" width="329" height="318"></div><div class="globe-label">Earth Observation × AI</div>` + orbits;
    const cols = ["var(--accent)", "var(--veg)", "var(--fg)", "var(--amber)"];
    $("#legend").innerHTML = t.legend.map((l, i) => `<span class="mono"><span style="color:${cols[i]}">■</span> ${esc(l)}</span>`).join("");
    $("#expTitle").textContent = t.expTitle; $("#eduTitle").textContent = t.eduTitle;
    const li = (e) => `<li><h3>${esc(e.title)} <span>@ ${esc(e.org)}</span></h3><div class="meta">${esc(e.date)} · ${esc(e.place)}</div>${e.desc ? `<p>${esc(e.desc)}</p>` : ""}</li>`;
    $("#expList").innerHTML = S.experience[lang].map(li).join("");
    $("#eduList").innerHTML = S.education[lang].map(li).join("");
    $("#supTitle").textContent = t.supTitle; $("#teachTitle").textContent = t.teachTitle;
    const C = t.supCols;
    $("#supTable").innerHTML = `<thead><tr><th>${C.student}</th><th>${C.title}</th><th>${C.degree}</th><th>${C.inst}</th><th>${C.year}</th><th>${C.role}</th></tr></thead><tbody>` +
      S.supervision.map((s) => `<tr><td data-l="${esc(C.student)}"><b>${esc(s.student)}</b></td><td data-l="${esc(C.title)}">${esc(s.title)}</td><td data-l="${esc(C.degree)}"><span class="status">${esc(t.supDeg[s.degree])}</span></td><td data-l="${esc(C.inst)}">${esc(s.inst)}</td><td data-l="${esc(C.year)}" class="mono">${s.year}</td><td data-l="${esc(C.role)}"><span class="status ${s.role === "sup" ? "s-pub" : ""}">${esc(t.supRoles[s.role])}</span></td></tr>`).join("") + "</tbody>";
    $("#teachList").innerHTML = S.teaching[lang].map((x) => `<li class="reveal">${esc(x)}</li>`).join("");
    $("#awards").innerHTML = S.awards[lang].map(([d, ti, de]) => `<div class="feat-pub reveal"><span class="mono" style="color:var(--amber)">${esc(d)}</span><h3 style="font-size:18px">${esc(ti)}</h3><p style="margin:0;font-size:14px;color:var(--muted);font-weight:500">${esc(de)}</p></div>`).join("");
  }

  function projectSvg(p, pts) {
    const [a, b, c] = p.c;
    const cells = [];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) cells.push(`<rect x="${40 + k * 44}" y="${40 + r * 44}" width="40" height="40" fill="${[a, b, c][(r + k) % 3]}"/>`);
    return `<svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="480" height="360" fill="#071526"/><g opacity=".9">${cells.join("")}</g><polyline points="${pts}" fill="none" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/><line x1="250" y1="300" x2="440" y2="300" stroke="#EDF2F7" stroke-opacity=".2"/></svg>`;
  }
  function renderProjects() {
    const t = T(), L = t.lbl;
    animateText($("#projTitle"), t.projTitle);
    $("#projLede").textContent = t.projLede;
    const pts = ["250,290 280,262 310,270 340,236 370,228 400,250 430,220 440,214", "250,240 290,244 330,252 360,268 390,284 420,292 440,296", "250,280 280,250 310,258 340,230 370,240 400,222 430,232 440,226", "250,270 290,262 330,266 370,250 410,254 440,246"];
    $("#projects").innerHTML = S.projects[lang].map((p, i) => `
      <article class="proj ${p.featured ? "featured" : "half"} reveal">
        ${p.img ? `<button class="fig fig-btn" data-img="${p.img}" aria-label="View figure"><img src="images/projects/${p.img}-thumb.jpg" alt="" loading="lazy"><span class="cap mono" style="font-size:10px">${esc(t.figCap[p.img] || "")}</span></button>` : `<div class="fig">${projectSvg(p, pts[i])}<span class="cap mono" style="font-size:10px">${esc(t.conceptual)}</span></div>`}
        <div class="body">
          <span class="kind">${esc(p.num)} · ${esc(p.area)}</span>
          <h3>${esc(p.title)}</h3>
          <dl>
            <dt>${L.q}</dt><dd>${esc(p.q)}</dd>
            <dt>${L.data}</dt><dd>${esc(p.data)}</dd>
            <dt>${L.approach}</dt><dd>${esc(p.approach)}</dd>
            <dt>${L.contrib}</dt><dd>${esc(p.contrib)}</dd>
            <dt>${L.out}</dt><dd><span class="status s-${p.status === "pub" || p.status === "accepted" ? "pub" : "rev"}">${esc(p.statusLabel || t.statuses[p.status])}</span> ${esc(p.out)}</dd>
          </dl>
          ${p.link ? `<a class="btn ghost" style="align-self:flex-start;margin-top:8px" href="${p.link}" target="_blank" rel="noopener">DOI ↗</a>` : ""}
        </div>
      </article>`).join("");
    $$(".fig-btn").forEach((b) => b.addEventListener("click", () => { const p = S.projects[lang].find((x) => x.img === b.dataset.img); openImage([`projects/${p.img}`], `${p.title} - ${t.figCap[p.img] || ""}`); }));
    observeReveals();
  }

  const filters = { s: "all", th: "all", y: "all" };
  function renderPubs() {
    const t = T();
    animateText($("#pubTitle"), t.pubTitle);
    $("#pubLede").textContent = t.pubLede;
    const chips = (id, label, opts, key) => `<div class="row"><span>${esc(label)}</span>${opts.map(([v, l]) => `<button class="chip" data-f="${key}" data-v="${v}" aria-pressed="${filters[key] === v}">${esc(l)}</button>`).join("")}</div>`;
    $("#filters").innerHTML =
      chips("s", t.fStatus, [["all", t.all], ...Object.entries(t.statuses).filter(([k]) => k !== "rev")], "s") +
      chips("th", t.fTheme, [["all", t.all], ...Object.entries(t.themes)], "th") +
      chips("y", t.fYear, [["all", t.all], ["2027", "2027"], ["2026", "2026"], ["2025", "2025"], ["2024", "2024"]], "y");
    $$("#filters .chip").forEach((b) => b.addEventListener("click", () => { filters[b.dataset.f] = b.dataset.v; renderPubs(); }));
    const row = (p) => `<li class="pub${p.img ? " has-img" : ""}"><span class="yr">${p.y}</span>${p.img ? `<button class="pub-thumb" data-img="${p.img}" aria-label="View graphical abstract"><img src="images/publications/${p.img}-thumb.jpg" alt="" loading="lazy"></button>` : ""}<div><div class="pt">${esc(p.t)}</div><div class="pa">${esc(p.a[0])}<b>S. Oussaoui</b>${esc(p.a[1])}</div><div class="pv">${esc(p.v)}</div>${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" style="font:500 13px var(--mono)">${esc(p.linkLabel)}</a>` : ""}</div><div class="side"><span class="status s-${p.s === "pub" || p.s === "accepted" ? "pub" : "rev"}">${esc(t.statuses[p.s])}</span><span class="status">${esc(t.themes[p.th])}</span></div></li>`;
    const list = S.publications.filter((p) => p.s !== "rev").filter((p) => (filters.s === "all" || p.s === filters.s) && (filters.th === "all" || p.th === filters.th) && (filters.y === "all" || String(p.y) === filters.y));
    $("#pubCount").textContent = `${list.length} ${t.entries}`;
    $("#pubList").innerHTML = list.map(row).join("") || `<li class="pub"><span></span><div class="pa">-</div></li>`;
    $("#featPubs").innerHTML = S.publications.filter((p) => p.featured).map((p) => `<div class="feat-pub reveal">${p.img ? `<button class="pub-thumb feat" data-img="${p.img}" aria-label="View graphical abstract"><img src="images/publications/${p.img}-thumb.jpg" alt="" loading="lazy"></button>` : ""}<span class="mono">${p.y} · <span class="status s-${p.s === "pub" || p.s === "accepted" ? "pub" : "rev"}">${esc(t.statuses[p.s])}</span></span><h3>${esc(p.t)}</h3><p class="pv" style="margin:0">${esc(p.v)}</p>${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" style="font:500 13px var(--mono)">${esc(p.linkLabel)}</a>` : ""}</div>`).join("");
    $$(".pub-thumb").forEach((b) => b.addEventListener("click", () => { const p = S.publications.find((x) => x.img === b.dataset.img); openImage([`publications/${p.img}`], `${p.t} - ${p.v}`); }));
    $("#talksTitle").textContent = t.talksTitle;
    $("#talks").innerHTML = S.talks.map((k) => `<li class="talk"><div><div class="tt">${esc(k.t)}</div><div class="tv">${esc(k.v)}</div></div><span class="tk">${k.y} · ${esc(t.kinds[k.k])}</span></li>`).join("");
    observeReveals();
  }

  let certCat = "all";
  function renderCerts() {
    const t = T();
    animateText($("#certTitle"), t.certTitle);
    $("#certLede").textContent = t.certLede;
    $("#certFilters").innerHTML = Object.entries(t.certCats).map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="${certCat === v}">${esc(l)}</button>`).join("");
    $$("#certFilters .chip").forEach((b) => b.addEventListener("click", () => { certCat = b.dataset.v; renderCerts(); }));
    const list = S.certificates.filter((c) => certCat === "all" || c.cat === certCat).sort((a, b) => b.date.localeCompare(a.date));
    $("#certCount").textContent = `${list.length} ${t.certCount}`;
    $("#certGrid").innerHTML = list.map((c, i) => `
      <button class="cert reveal" data-i="${i}" aria-label="${esc(c[lang])}">
        <span class="cert-img"><img src="images/certificates/${c.slug}-thumb.jpg" alt="" loading="lazy">${c.extra ? `<span class="cert-more">+${c.extra.length}</span>` : ""}</span>
        <span class="cert-body">
          <span class="cert-meta"><span class="status">${esc(t.certCats[c.cat])}</span><span class="mono">${c.date.replace("-", "/")}</span></span>
          <span class="cert-title">${esc(c[lang])}</span>
          <span class="cert-org">${esc(c.org)}</span>
        </span>
      </button>`).join("");
    $$("#certGrid .cert").forEach((b) => b.addEventListener("click", () => openLightbox(list[Number(b.dataset.i)])));
    $("#lbClose").textContent = t.close;
    observeReveals();
  }
  let lbImgs = [], lbIdx = 0, lbCaption = "";
  function showLb() {
    $("#lbImg").src = `images/${lbImgs[lbIdx]}.jpg`;
    $("#lbCap").textContent = lbImgs.length > 1 ? `${lbCaption} (${lbIdx + 1}/${lbImgs.length})` : lbCaption;
    $("#lbPrev").style.display = $("#lbNext").style.display = lbImgs.length > 1 ? "" : "none";
  }
  function openLightbox(c) {
    const lb = $("#lightbox");
    openImage([c.slug].concat(c.extra || []).map((s) => `certificates/${s}`), `${c[lang]} - ${c.org}`);
  }
  function openImage(imgs, caption) {
    const lb = $("#lightbox"); if (!lb) return;
    lbImgs = imgs; lbIdx = 0; lbCaption = caption; $("#lbImg").alt = caption; showLb();
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; $("#lbClose").focus();
  }
  function stepLb(d) { if (lbImgs.length < 2) return; lbIdx = (lbIdx + d + lbImgs.length) % lbImgs.length; showLb(); }
  function closeLightbox() { const lb = $("#lightbox"); lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
  // Every page gets the lightbox so content swapped in by soft navigation can use it.
  if (!$("#lightbox")) {
    document.body.insertAdjacentHTML("beforeend", '<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="lbCap"><figure style="margin:0;display:flex;flex-direction:column;align-items:center;gap:14px;max-width:100%"><div class="lb-stage"><button class="lb-nav" id="lbPrev" aria-label="Previous image">&#8249;</button><img id="lbImg" src="" alt=""><button class="lb-nav" id="lbNext" aria-label="Next image">&#8250;</button></div><figcaption id="lbCap"></figcaption></figure><button class="btn" id="lbClose">Close</button></div>');
  }
  if ($("#lightbox")) {
    $("#lbClose").addEventListener("click", closeLightbox);
    $("#lightbox").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeLightbox(); });
    $("#lbPrev").addEventListener("click", () => stepLb(-1)); $("#lbNext").addEventListener("click", () => stepLb(1));
    document.addEventListener("keydown", (e) => { if (!$("#lightbox").classList.contains("open")) return; if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowLeft") stepLb(-1); if (e.key === "ArrowRight") stepLb(1); });
  }

  function renderEvents() {
    const t = T();
    animateText($("#evTitle"), t.evTitle);
    $("#evLede").textContent = t.evLede;
    const list = (S.events || []).slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!list.length) { $("#evList").innerHTML = `<p class="mono" style="text-align:center">${esc(t.evEmpty)}</p>`; return; }
    $("#evList").innerHTML = list.map((e, i) => `
      <article class="event reveal${i % 2 ? " flip" : ""}${(e.images || []).length ? "" : " noimg"}">
        ${(e.images || []).length ? `<button class="event-img" data-i="${i}" aria-label="${esc(e.title[lang])}">
          <img src="images/events/${e.images[0]}-thumb.jpg" alt="" loading="lazy">
          ${e.images.length > 1 ? `<span class="cert-more">${e.images.length} ${esc(t.evPhotos)}</span>` : ""}
        </button>` : ""}
        <div class="event-body">
          <div class="event-meta"><span class="mono">${e.date.replace("-", "/")}${e.place ? " · " + esc(e.place) : ""}</span>${e.role ? `<span class="status s-pub">${esc(e.role[lang])}</span>` : ""}</div>
          <h3>${esc(e.title[lang])}</h3>
          ${(e.desc[lang] || "").split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}
          ${e.link ? `<a class="btn ghost" style="align-self:flex-start" href="${e.link}" target="_blank" rel="noopener">${lang === "fr" ? "En savoir plus" : "Learn more"} ↗</a>` : ""}
        </div>
      </article>`).join("");
    $$("#evList .event-img").forEach((b) => b.addEventListener("click", () => { const e = list[Number(b.dataset.i)]; openImage(e.images.map((s) => `events/${s}`), `${e.title[lang]}${e.place ? " - " + e.place : ""}`); }));
    observeReveals();
  }

  function renderRefs() {
    const t = T();
    animateText($("#refTitle"), t.refTitle);
    $("#refLede").textContent = t.refLede;
    $("#refGrid").innerHTML = (S.references || []).map((r) => `
      <article class="ref reveal">
        <div class="ref-head">
          ${r.photo ? `<img class="ref-photo" src="images/references/${r.photo}.jpg" alt="${esc(r.name)}" width="88" height="88" loading="lazy">` : ""}
          <div><h3>${esc(r.name)}</h3>${r.status ? `<p class="ref-status">${esc(r.status[lang])}</p>` : ""}</div>
        </div>
        <p class="mono ref-inst">${esc(r.inst)}</p>
        <div class="ref-contact">
          <a href="mailto:${esc(r.email)}?subject=${encodeURIComponent("Reference - Sabir OUSSAOUI")}" aria-label="${esc(t.refEmail)} ${esc(r.name)}">${ICONS.mail}<span>${esc(r.email)}</span></a>
          <a href="tel:${esc(r.phone.replace(/[^+\d]/g, ""))}" aria-label="${esc(t.refPhone)} ${esc(r.name)}">${ICONS.phone}<span>${esc(r.phone)}</span></a>
        </div>
      </article>`).join("");
    observeReveals();
  }

  function renderContact() {
    const t = T();
    animateText($("#ctTitle"), t.ctTitle);
    $("#ctLede").textContent = t.ctLede;
    const pin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
    const uni = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/></svg>';
    const hash = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></svg>';
    $("#ctInfo").innerHTML = `
      <div class="ct-brand"><img src="images/profile/avatar.png" alt="" width="56" height="56"><div><b>Sabir OUSSAOUI</b><span>${lang === "fr" ? "Doctorant · Télédétection, IA et sécheresse" : "PhD Researcher · Remote sensing, AI & drought"}</span></div></div>
      <div class="ct-block"><h4>${uni}${esc(t.ctOffice)}</h4><p>UM6P - International Water Research Institute (IWRI)<br>Ben Guerir, Morocco</p><p>UQTR - Centre de recherche RIVE<br>Trois-Rivières, Québec, Canada</p></div>
      <div class="ct-block"><h4>${ICONS.mail}${esc(t.ctEmail)}</h4><p><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></p></div>
      <div class="ct-block"><h4>${pin}${esc(t.ctLocation)}</h4><p>${esc(t.ctLocVal)}</p></div>
      <div class="ct-block"><h4>${hash}${esc(t.ctSocial)}</h4><div class="ct-social">
        <a href="${S.links.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICONS.linkedin}</a>
        <a href="${S.links.scholar}" target="_blank" rel="noopener" aria-label="Google Scholar">${ICONS.scholar}</a>
        <a href="${S.links.researchgate}" target="_blank" rel="noopener" aria-label="ResearchGate">${ICONS.rg}</a></div></div>
      ${S.cvFile ? `<a class="btn" href="${S.cvFile}" download>${esc(t.ctCv)}</a>` : ""}`;
    const f = (id, label, ph, type, req) => `<label class="ct-field" for="${id}"><span>${esc(label)}${req ? ' <i aria-hidden="true">*</i>' : ""}</span>${type === "textarea" ? `<textarea id="${id}" name="${id}" rows="6" placeholder="${esc(ph)}"${req ? " required" : ""}></textarea>` : `<input id="${id}" name="${id}" type="${type}" placeholder="${esc(ph)}"${req ? " required" : ""}${type === "email" ? ' autocomplete="email"' : ""}>`}</label>`;
    $("#ctForm").innerHTML = `
      <div class="ct-row">${f("first", t.ctFirst, t.ctFirstPh, "text", true)}${f("last", t.ctLast, t.ctLastPh, "text", true)}</div>
      ${f("email", t.ctMail, t.ctMailPh, "email", true)}
      ${f("subject", t.ctSubject, t.ctSubjectPh, "text", false)}
      ${f("message", t.ctMsg, t.ctMsgPh, "textarea", true)}
      <input type="text" name="_honey" class="ct-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="ct-actions"><button class="btn" type="submit">${esc(t.ctSend)}</button><p class="ct-status" role="status" aria-live="polite"></p></div>`;
    const form = $("#ctForm"), status = $(".ct-status", form), btn = $("button", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = Object.fromEntries(new FormData(form));
      if (d._honey) return;
      btn.disabled = true; btn.textContent = t.ctSending; status.className = "ct-status"; status.textContent = "";
      try {
        const r = await fetch(S.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: `${d.first} ${d.last}`.trim(), email: d.email, subject: d.subject || "-", message: d.message,
            _subject: `Portfolio message from ${d.first} ${d.last}${d.subject ? " - " + d.subject : ""}`, _replyto: d.email, _template: "table", _captcha: "false" }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || String(r.status));
        form.reset(); status.classList.add("ok"); status.textContent = t.ctOk;
      } catch (err) {
        const msg = String((err && err.message) || "");
        console.warn("contact form:", msg);
        if (/activat/i.test(msg)) { status.classList.add("warn"); status.textContent = t.ctActivate; }
        else { status.classList.add("err"); status.innerHTML = `${esc(t.ctErr)} <a href="mailto:${esc(S.email)}">${esc(S.email)}</a>.`; }
      } finally { btn.disabled = false; btn.textContent = t.ctSend; }
    });
  }

  function renderAll() {
    renderNav(); renderFooter(); padForHeader();
    ({ home: renderHome, about: renderAbout, projects: renderProjects, pubs: renderPubs, certs: renderCerts, events: renderEvents, refs: renderRefs, contact: renderContact }[page] || (() => {}))();
    observeReveals(); timelineRails();
  }


  /* ---- soft navigation: swap the page content without reloading, so the
     background, cursor and header stay put and nothing flashes ---- */
  const cache = new Map();
  function fetchPage(url) {
    if (!cache.has(url)) cache.set(url, fetch(url, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }).catch((e) => { cache.delete(url); throw e; }));
    return cache.get(url);
  }
  let navigating = false;
  async function softGo(url, push) {
    if (navigating) return;
    navigating = true;
    const main = $("main");
    main.classList.add("page-leave");
    try {
      const [html] = await Promise.all([fetchPage(url), new Promise((r) => setTimeout(r, 180))]);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const next = doc.querySelector("main");
      const nextPage = doc.body.dataset.page;
      if (!next || !nextPage) throw new Error("bad page");
      if (push) history.pushState({ soft: true }, "", url);
      document.title = doc.title;
      document.body.dataset.page = page = nextPage;
      $$(".hireme").forEach((n) => n.remove());
      const hire = doc.querySelector(".hireme");
      main.replaceWith(next);
      if (hire) next.after(hire);
      if ($("#lightbox").classList.contains("open")) closeLightbox();
      document.body.style.overflow = "";
      window.scrollTo(0, 0);
      next.classList.add("page-enter");
      renderAll();
      requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove("page-enter")));
    } catch (e) {
      location.href = url;
    } finally { navigating = false; }
  }
  if (location.protocol !== "file:") {
    history.replaceState({ soft: true }, "");
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname) || url.search.includes("intro")) return;
      e.preventDefault();
      if (url.pathname === location.pathname && !url.hash) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      softGo(url.href, true);
    });
    document.addEventListener("pointerover", (e) => { const a = e.target.closest && e.target.closest("a.nl[href], a.logo[href]"); if (a) fetchPage(new URL(a.href, location.href).href).catch(() => {}); }, { passive: true });
    window.addEventListener("popstate", () => softGo(location.href, false));
  }
  document.documentElement.lang = lang;
  window.addEventListener("scroll", () => { const h = $("#header"); if (h) h.classList.toggle("scrolled", window.scrollY > 8); }, { passive: true });
  const padForHeader = () => { const h = $("#header"); if (h) document.body.style.paddingTop = h.offsetHeight + "px"; };
  window.addEventListener("resize", padForHeader);
  document.addEventListener("DOMContentLoaded", renderAll);
})();
