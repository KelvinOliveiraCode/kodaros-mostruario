/* Kodaros — hub do mostruário.
   Carrega o manifesto, pré-carrega as miniaturas, filtra, busca e abre o site
   dentro de um iframe (com barra de contexto e link para abrir em nova aba). */

(function () {
  "use strict";

  var SITES = (window.KODAROS_SITES || []).filter(function (s) {
    return s && s.slug && s.pal;
  });

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var state = {
    query: "",
    cats: new Set(),
    sort: "default"
  };

  var bySlug = {};
  SITES.forEach(function (s) { bySlug[s.slug] = s; });

  /* Tinta legível sobre a cor de destaque de cada site (AA em texto pequeno). */
  function onAccent(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "#14090a";
    var n = parseInt(m[1], 16);
    var ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (c) {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    var lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    return lum < 0.18 ? "#ffffff" : "#14090a";
  }

  /* ------------------------------------------------------------- ícones */

  var ICON = {
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>',
    external:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
  };

  /* -------------------------------------------------------- normalização */

  function norm(s) {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function haystack(site) {
    return norm(
      [site.brand, site.niche, site.cat, site.city, site.tagline, site.blurb, site.price, site.slug].join(" ")
    );
  }

  var SEARCH_INDEX = {};
  SITES.forEach(function (s) { SEARCH_INDEX[s.slug] = haystack(s); });

  /* ------------------------------------------------------------- filtros */

  function matches(site) {
    if (state.cats.size && !state.cats.has(site.cat)) return false;
    if (state.query) {
      var terms = norm(state.query).split(/\s+/).filter(Boolean);
      var hay = SEARCH_INDEX[site.slug];
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) === -1) return false;
      }
    }
    return true;
  }

  function visibleSites() {
    var list = SITES.filter(matches);
    if (state.sort === "az") {
      list.sort(function (a, b) { return a.brand.localeCompare(b.brand, "pt-BR"); });
    } else if (state.sort === "cat") {
      list.sort(function (a, b) {
        return a.cat.localeCompare(b.cat, "pt-BR") || a.brand.localeCompare(b.brand, "pt-BR");
      });
    }
    return list;
  }

  /* --------------------------------------------------------------- cards */

  function cardMarkup(site, index) {
    var wide = index % 7 === 3;
    return (
      '<button class="card' + (wide ? " card--wide" : "") + '" type="button" data-slug="' + site.slug + '"' +
      ' style="--site-accent:' + site.pal.acc + ';--site-on-accent:' + onAccent(site.pal.acc) + '">' +
        '<div class="card__thumb">' +
          '<img src="sites/' + site.slug + '/assets/hero.svg" alt="Composição visual da ' + site.brand + '" loading="lazy" width="1200" height="900">' +
          '<span class="card__cat">' + site.cat + '</span>' +
          '<span class="card__go" aria-hidden="true">' + ICON.arrow + '</span>' +
        '</div>' +
        '<div class="card__body">' +
          '<span class="card__brand">' + site.brand + '</span>' +
          '<span class="card__niche">' + site.niche + '</span>' +
          '<span class="card__meta">' +
            '<span>' + site.city + '</span>' +
            '<span>' + site.price + '</span>' +
          '</span>' +
        '</div>' +
      '</button>'
    );
  }

  function render() {
    var list = visibleSites();
    var grid = $("#grid");
    grid.innerHTML = list.map(cardMarkup).join("");

    $("#count").textContent = list.length === SITES.length
      ? String(list.length)
      : list.length + " de " + SITES.length;

    var empty = $("#empty");
    if (!list.length) {
      empty.hidden = false;
      grid.innerHTML = "";
    } else {
      empty.hidden = true;
    }

    $("#reset").hidden = !(state.query || state.cats.size);
  }

  /* --------------------------------------------------------------- chips */

  function buildChips() {
    var counts = {};
    SITES.forEach(function (s) { counts[s.cat] = (counts[s.cat] || 0) + 1; });
    var cats = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b, "pt-BR");
    });

    $("#chips").innerHTML = cats
      .map(function (c) {
        return (
          '<button class="chip" type="button" data-cat="' + c + '" aria-pressed="false">' +
          c + '<span class="chip__n">' + counts[c] + "</span></button>"
        );
      })
      .join("");

    $$("#chips .chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-cat");
        if (state.cats.has(cat)) {
          state.cats.delete(cat);
          btn.setAttribute("aria-pressed", "false");
        } else {
          state.cats.add(cat);
          btn.setAttribute("aria-pressed", "true");
        }
        render();
      });
    });
  }

  /* -------------------------------------------------------------- viewer */

  var viewer, frame, loading, lastFocus = null;

  function openSite(slug, push) {
    var site = bySlug[slug];
    if (!site) return;

    lastFocus = document.activeElement;

    $("#viewer__name").textContent = site.brand;
    $("#viewer__meta").textContent = site.niche + " · " + site.city;
    $("#viewer__link").href = "sites/" + site.slug + "/index.html";
    $("#opennew").href = "sites/" + site.slug + "/index.html";

    viewer.style.setProperty("--site-accent", site.pal.acc);
    viewer.style.setProperty("--site-on-accent", onAccent(site.pal.acc));

    loading.hidden = false;
    frame.src = "sites/" + site.slug + "/index.html";

    viewer.hidden = false;
    requestAnimationFrame(function () {
      viewer.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });

    if (push !== false) {
      try { history.pushState({ slug: slug }, "", "#" + slug); } catch (e) {}
    }
    $("#closeviewer").focus();
  }

  function closeSite(pop) {
    viewer.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(function () {
      viewer.hidden = true;
      frame.src = "about:blank";
    }, 220);
    if (pop !== false) {
      try { history.pushState({}, "", location.pathname + location.search); } catch (e) {}
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------- splash */

  function runSplash(done) {
    var fill = $("#splash-fill");
    var status = $("#splash-status");
    var total = SITES.length;
    var loaded = 0;
    var fontsReady = false;
    var finished = false;

    function tick() {
      var p = Math.min(100, Math.round(((loaded / total) * 0.75 + (fontsReady ? 0.25 : 0)) * 100));
      fill.style.width = p + "%";
      status.querySelector("b").textContent = loaded + "/" + total + " páginas";
      if (loaded >= total && fontsReady && !finished) {
        finished = true;
        setTimeout(done, 320);
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        fontsReady = true;
        tick();
      });
    } else {
      fontsReady = true;
    }

    // pré-carrega as miniaturas para a grade abrir sem atraso
    SITES.forEach(function (site) {
      var img = new Image();
      img.onload = img.onerror = function () {
        loaded++;
        tick();
      };
      img.src = "sites/" + site.slug + "/assets/hero.svg";
    });

    // rede de segurança: nunca deixa o splash travado
    setTimeout(function () {
      fontsReady = true;
      loaded = Math.max(loaded, total);
      tick();
    }, 4000);
  }

  /* --------------------------------------------------------------- init */

  function init() {
    viewer = $("#viewer");
    frame = $("#viewer-frame");
    loading = $("#viewer-loading");

    buildChips();
    render();

    $("#search").addEventListener("input", function (e) {
      state.query = e.target.value.trim();
      render();
    });

    $("#sort").addEventListener("change", function (e) {
      state.sort = e.target.value;
      render();
    });

    $("#reset").addEventListener("click", function () {
      state.query = "";
      state.cats.clear();
      $("#search").value = "";
      $$("#chips .chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      render();
    });

    $("#grid").addEventListener("click", function (e) {
      var card = e.target.closest(".card");
      if (card) openSite(card.getAttribute("data-slug"));
    });

    $("#closeviewer").addEventListener("click", function () { closeSite(); });

    // O chip "Voltar ao mostruário" dentro da página, quando ela roda no iframe,
    // deve fechar o visualizador em vez de carregar o hub dentro do próprio iframe.
    frame.addEventListener("load", function () {
      loading.hidden = true;
      try {
        var doc = frame.contentDocument;
        if (!doc) return;
        doc.addEventListener("click", function (ev) {
          var chip = ev.target.closest && ev.target.closest(".demo-chip");
          if (chip) {
            ev.preventDefault();
            closeSite();
          }
        });
      } catch (err) {
        /* origem diferente (file://) — o link funciona como fallback */
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !viewer.hidden) closeSite();
    });

    window.addEventListener("popstate", function (e) {
      var slug = (e.state && e.state.slug) || location.hash.replace("#", "");
      if (slug && bySlug[slug]) openSite(slug, false);
      else if (!viewer.hidden) closeSite(false);
    });

    runSplash(function () {
      var s = $("#splash");
      s.classList.add("is-done");
      setTimeout(function () { s.hidden = true; }, 420);

      var slug = location.hash.replace("#", "");
      if (slug && bySlug[slug]) openSite(slug, false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
