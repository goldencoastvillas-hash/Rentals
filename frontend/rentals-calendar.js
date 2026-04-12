/**
 * Calendario (1 mes por defecto), rango con dos clics, días bloqueados en gris.
 * Rangos bloqueados: medio abierto [start, end) en fechas ISO locales (YYYY-MM-DD).
 */
(function (global) {
  var ES_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function ymdFromDate(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function ymdToday() {
    return ymdFromDate(new Date());
  }

  function parseYmd(s) {
    if (!s || typeof s !== "string") return null;
    var p = s.split("-");
    if (p.length !== 3) return null;
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) - 1;
    var day = parseInt(p[2], 10);
    var d = new Date(y, m, day);
    if (d.getFullYear() !== y || d.getMonth() !== m || d.getDate() !== day) return null;
    return d;
  }

  function cmpYmd(a, b) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }

  /** día ymd está en [rangeStart, rangeEnd) ? */
  function dayInHalfOpen(ymd, start, end) {
    return cmpYmd(ymd, start) >= 0 && cmpYmd(ymd, end) < 0;
  }

  function overlapsHalfOpen(a0, a1, b0, b1) {
    return cmpYmd(a0, b1) < 0 && cmpYmd(b0, a1) < 0;
  }

  /** ¿[s,e) válido respecto a bloqueos? */
  function rangeIsFree(s, e, blocked) {
    for (var i = 0; i < blocked.length; i++) {
      var b = blocked[i];
      if (!b || !b.start || !b.end) continue;
      if (overlapsHalfOpen(s, e, b.start, b.end)) return false;
    }
    return true;
  }

  function mount(container, opts) {
    if (!container) return { destroy: function () {} };
    opts = opts || {};
    var blockedRanges = opts.blockedRanges || [];
    var minYmd = opts.minDate || ymdToday();
    var onChange = opts.onChange || function () {};
    var monthsToShow = Math.min(3, Math.max(1, opts.monthsToShow || 1));

    var selStart = null;
    var selEnd = null;
    var viewYear;
    var viewMonth;

    var t = parseYmd(minYmd) || new Date();
    viewYear = t.getFullYear();
    viewMonth = t.getMonth();

    var root = document.createElement("div");
    root.className = "rentals-cal-root";
    root.innerHTML =
      '<div class="rentals-cal-toolbar">' +
      '<button type="button" class="rentals-cal-nav" data-dir="-1" aria-label="Mes anterior">‹</button>' +
      '<span class="rentals-cal-caption"></span>' +
      '<button type="button" class="rentals-cal-nav" data-dir="1" aria-label="Mes siguiente">›</button>' +
      "</div>" +
      '<div class="rentals-cal-months"></div>' +
      '<p class="rentals-cal-hint">Elige la fecha de entrada y luego la de salida (checkout).</p>';

    container.innerHTML = "";
    container.appendChild(root);

    var cap = root.querySelector(".rentals-cal-caption");
    var monthsEl = root.querySelector(".rentals-cal-months");

    function isBlockedDay(ymd) {
      if (cmpYmd(ymd, minYmd) < 0) return true;
      for (var i = 0; i < blockedRanges.length; i++) {
        var b = blockedRanges[i];
        if (b && dayInHalfOpen(ymd, b.start, b.end)) return true;
      }
      return false;
    }

    function paint() {
      monthsEl.innerHTML = "";
      var labels = [];
      for (var m = 0; m < monthsToShow; m++) {
        var dt = new Date(viewYear, viewMonth + m, 1);
        labels.push(
          dt.toLocaleString("es", { month: "long", year: "numeric" }).replace(/^\w/, function (c) {
            return c.toUpperCase();
          })
        );
      }
      if (cap) cap.textContent = labels.join(" · ");

      for (var mi = 0; mi < monthsToShow; mi++) {
        var cur = new Date(viewYear, viewMonth + mi, 1);
        var y = cur.getFullYear();
        var mo = cur.getMonth();
        var first = new Date(y, mo, 1);
        var startPad = (first.getDay() + 6) % 7;
        var dim = new Date(y, mo + 1, 0).getDate();

        var wrap = document.createElement("div");
        wrap.className = "rentals-cal-month";
        var h = document.createElement("div");
        h.className = "rentals-cal-weekdays";
        for (var w = 0; w < 7; w++) {
          var wd = document.createElement("span");
          wd.textContent = ES_DAYS[w];
          h.appendChild(wd);
        }
        wrap.appendChild(h);

        var grid = document.createElement("div");
        grid.className = "rentals-cal-grid";
        var dayNum = 1;
        var nextTail = 1;
        for (var i = 0; i < 42; i++) {
          var cell = document.createElement("button");
          cell.type = "button";
          cell.className = "rentals-cal-day";

          if (i < startPad) {
            var prevDim = new Date(y, mo, 0).getDate();
            var pday = prevDim - (startPad - i - 1);
            cell.textContent = String(pday);
            cell.classList.add("rentals-cal-day--muted");
            cell.disabled = true;
          } else if (dayNum <= dim) {
            var ymd = y + "-" + pad2(mo + 1) + "-" + pad2(dayNum);
            cell.textContent = String(dayNum);
            cell.dataset.ymd = ymd;

            if (cmpYmd(ymd, minYmd) < 0) {
              cell.classList.add("rentals-cal-day--past");
              cell.disabled = true;
            } else if (isBlockedDay(ymd)) {
              cell.classList.add("rentals-cal-day--blocked");
              cell.disabled = true;
              cell.title = "No disponible";
            } else {
              if (selStart && selEnd && dayInHalfOpen(ymd, selStart, selEnd)) {
                cell.classList.add("rentals-cal-day--inrange");
              }
              if (ymd === selStart) cell.classList.add("rentals-cal-day--start");
              if (selStart && selEnd && ymd === selEnd) cell.classList.add("rentals-cal-day--end");
              cell.addEventListener("click", onDayClick);
            }
            dayNum++;
          } else {
            cell.textContent = String(nextTail);
            nextTail++;
            cell.classList.add("rentals-cal-day--muted");
            cell.disabled = true;
          }
          grid.appendChild(cell);
        }
        wrap.appendChild(grid);
        monthsEl.appendChild(wrap);
      }
    }

    function onDayClick(ev) {
      var btn = ev.currentTarget;
      var ymd = btn.dataset.ymd;
      if (!ymd || btn.disabled) return;

      if (!selStart || (selStart && selEnd)) {
        selStart = ymd;
        selEnd = null;
        paint();
        return;
      }

      var a = selStart;
      var b = ymd;
      if (cmpYmd(b, a) < 0) {
        var t = a;
        a = b;
        b = t;
      }
      var e = b;
      if (cmpYmd(e, a) <= 0) {
        selStart = ymd;
        selEnd = null;
        paint();
        onChange(null, null, "La salida debe ser después del ingreso.");
        return;
      }
      if (!rangeIsFree(a, e, blockedRanges)) {
        selEnd = null;
        paint();
        onChange(null, null, "Hay fechas no disponibles en ese rango. Elige otras.");
        return;
      }
      selStart = a;
      selEnd = e;
      paint();
      onChange(selStart, selEnd, null);
    }

    function setBlockedRanges(ranges) {
      blockedRanges = ranges || [];
      paint();
    }

    function setSelection(startYmd, endYmdExclusive) {
      selStart = startYmd || null;
      selEnd = endYmdExclusive || null;
      paint();
    }

    root.querySelectorAll(".rentals-cal-nav").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.getAttribute("data-dir"), 10) || 0;
        viewMonth += dir;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        } else if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        paint();
      });
    });

    paint();

    return {
      destroy: function () {
        container.innerHTML = "";
      },
      setBlockedRanges: setBlockedRanges,
      setSelection: setSelection,
      getRange: function () {
        return { start: selStart, end: selEnd };
      },
    };
  }

  function mergeHalfOpenRanges(list) {
    var flat = (list || []).filter(function (r) {
      return r && r.start && r.end && cmpYmd(r.start, r.end) < 0;
    });
    flat.sort(function (a, b) {
      return cmpYmd(a.start, b.start);
    });
    var out = [];
    flat.forEach(function (r) {
      if (!out.length) {
        out.push({ start: r.start, end: r.end });
        return;
      }
      var L = out[out.length - 1];
      if (cmpYmd(r.start, L.end) <= 0) {
        if (cmpYmd(r.end, L.end) > 0) L.end = r.end;
      } else {
        out.push({ start: r.start, end: r.end });
      }
    });
    return out;
  }

  global.RentalsCalendar = {
    mount: mount,
    ymdToday: ymdToday,
    overlapsHalfOpen: overlapsHalfOpen,
    rangeIsFree: rangeIsFree,
    mergeHalfOpenRanges: mergeHalfOpenRanges,
  };
})(typeof window !== "undefined" ? window : globalThis);
