(function () {
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function instalarEstilos() {
    if (document.getElementById("status-areas-style")) return;
    var style = document.createElement("style");
    style.id = "status-areas-style";
    style.textContent = `
      @media (min-width: 961px) {
        .stats { grid-template-columns: repeat(5, minmax(0,1fr)); }
      }
      .current-area-context {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 9px;
        padding: 6px 9px;
        border-radius: 999px;
        background: var(--blue-soft);
        color: var(--blue);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .epic-progress-card.active-area {
        border-color: #86c7bf;
        box-shadow: 0 0 0 2px rgba(15,118,110,.08);
        background: #f5fbfa;
      }
      .area-active-badge {
        display: inline-flex;
        margin-top: 8px;
        padding: 4px 7px;
        border-radius: 999px;
        background: var(--accent);
        color: white;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      .area-work-summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 6px 10px;
        margin-top: 12px;
        padding-top: 11px;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 10px;
        line-height: 1.35;
      }
      .area-work-summary strong {
        color: var(--text);
        font-family: var(--mono);
      }
      .area-work-total {
        grid-column: 1 / -1;
        color: var(--text);
        font-size: 11px;
        font-weight: 750;
      }
    `;
    document.head.appendChild(style);
  }

  function resumoTrabalhos(work) {
    work = work || {};
    var total = Number(work.total || 0);
    var done = Number(work.done || 0);
    var inProgress = Number(work.in_progress || 0);
    var planned = Number(work.planned || 0);
    var out = Number(work.out_of_scope || 0);
    return '<div class="area-work-summary">' +
      '<div class="area-work-total"><strong>' + total + '</strong> trabalhos cadastrados</div>' +
      '<div><strong>' + done + '</strong> concluídos</div>' +
      '<div><strong>' + inProgress + '</strong> em andamento</div>' +
      '<div><strong>' + planned + '</strong> planejados</div>' +
      '<div><strong>' + out + '</strong> fora do escopo</div>' +
    '</div>';
  }

  function aplicar(status) {
    instalarEstilos();
    var development = status.development || {};
    var current = development.current || {};
    var area = current.area || {};
    var epics = Array.isArray(development.epics) ? development.epics : [];

    var stats = document.querySelector(".stats");
    if (stats && !document.getElementById("stat-active-area")) {
      var card = document.createElement("div");
      card.className = "stat";
      card.innerHTML = '<div class="stat-label">Área ativa</div>' +
        '<div class="stat-value" id="stat-active-area">—</div>' +
        '<div class="stat-hint" id="stat-active-area-hint">domínio em desenvolvimento</div>';
      stats.insertBefore(card, stats.firstChild);
    }
    var statArea = document.getElementById("stat-active-area");
    var statAreaHint = document.getElementById("stat-active-area-hint");
    if (statArea) statArea.textContent = area.number ? "Área " + area.number : "—";
    if (statAreaHint) statAreaHint.textContent = area.title || "domínio em desenvolvimento";

    var currentTitle = document.getElementById("current-title");
    if (currentTitle && !document.getElementById("current-area-context")) {
      var context = document.createElement("div");
      context.id = "current-area-context";
      context.className = "current-area-context";
      currentTitle.parentNode.insertBefore(context, currentTitle);
    }
    var currentArea = document.getElementById("current-area-context");
    if (currentArea) {
      currentArea.textContent = area.number
        ? "Área " + area.number + " · " + (area.title || area.code || "")
        : "Área não identificada";
    }

    var sectionNote = document.querySelector("#progresso .section-note");
    if (sectionNote) {
      sectionNote.textContent = "Cada área mostra o percentual documentado, a quantidade de trabalhos cadastrados e seus estados. A área em desenvolvimento fica destacada.";
    }

    var cards = document.querySelectorAll("#epic-progress-grid .epic-progress-card");
    if (cards.length !== epics.length) return false;
    cards.forEach(function (card, index) {
      var epic = epics[index] || {};
      card.classList.toggle("active-area", Boolean(epic.active));
      card.querySelector(".area-active-badge")?.remove();
      card.querySelector(".area-work-summary")?.remove();
      var title = card.querySelector(".epic-title");
      if (epic.active && title) {
        title.insertAdjacentHTML("afterend", '<div class="area-active-badge">Área ativa agora</div>');
      }
      card.insertAdjacentHTML("beforeend", resumoTrabalhos(epic.work));
    });
    return true;
  }

  function aguardarBase(status, tentativa) {
    if (aplicar(status)) return;
    if (tentativa >= 120) return;
    requestAnimationFrame(function () { aguardarBase(status, tentativa + 1); });
  }

  fetch("status.json?v=" + Date.now(), { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (status) { aguardarBase(status, 0); })
    .catch(function () { /* o painel base já trata erros de status */ });
})();
