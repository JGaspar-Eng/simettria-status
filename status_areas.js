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
      .area-work-active {
        color: var(--accent);
        font-weight: 700;
      }
      .area-work-details {
        grid-column: 1 / -1;
        margin-top: 5px;
        padding-top: 8px;
        border-top: 1px dashed var(--border);
      }
      .area-work-details summary {
        cursor: pointer;
        color: var(--blue);
        font-weight: 800;
        list-style: none;
      }
      .area-work-details summary::-webkit-details-marker { display:none; }
      .area-work-details summary::before { content: "▸ "; }
      .area-work-details[open] summary::before { content: "▾ "; }
      .area-work-list {
        display: grid;
        gap: 7px;
        margin-top: 9px;
      }
      .area-work-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 7px;
        align-items: start;
        color: var(--muted);
        line-height: 1.4;
      }
      .area-work-state {
        display: inline-flex;
        align-items: center;
        padding: 2px 5px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 850;
        letter-spacing: .04em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .area-work-state.done { background:#eaf8f0; color:#24724a; }
      .area-work-state.partial { background:#fff5db; color:#8a6410; }
      .area-work-state.active_now { background:#e5f3f1; color:var(--accent); }
      .area-work-state.planned { background:#eef2f5; color:var(--muted); }
      .area-work-state.out_of_scope { background:#f5ecec; color:#8b4b4b; }
      .area-current-objectives {
        grid-column: 1 / -1;
        margin-top: 7px;
        padding: 8px;
        border-radius: 8px;
        background: rgba(15,118,110,.05);
      }
      .area-current-objectives-title {
        color: var(--text);
        font-weight: 800;
        margin-bottom: 6px;
      }
      .area-current-block-progress {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 7px;
        padding-bottom: 7px;
        border-bottom: 1px solid rgba(15,118,110,.12);
      }
      .area-current-block-progress strong {
        color: var(--accent-strong);
        font-size: 13px;
      }
      .area-current-objective { margin-top: 4px; }
      .area-current-objective strong { font-family: inherit; }
      .roadmap-state-badge {
        display: inline-flex;
        align-items: center;
        width: max-content;
        margin-bottom: 8px;
        padding: 4px 7px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: .05em;
        text-transform: uppercase;
      }
      .roadmap-state-badge.done { background: #eaf8f0; color: #24724a; }
      .roadmap-state-badge.active { background: #e5f3f1; color: var(--accent); }
      .roadmap-state-badge.planned { background: #eef2f5; color: var(--muted); }
      .roadmap-explain { display:block; color: var(--muted); line-height:1.45; }
      .roadmap-explain strong { color: var(--text); font-weight: 750; }
      .roadmap-item.current .roadmap-explain strong { color: var(--accent); }
    `;
    document.head.appendChild(style);
  }

  function removerConsolidadoEAtalho() {
    document.getElementById("consolidado")?.remove();
    document.querySelector('nav.top a[href="#consolidado"]')?.remove();
  }

  function rotuloEstado(state) {
    return {
      done: "Concluído",
      partial: "Parcial",
      active_now: "Em andamento",
      planned: "Planejado",
      out_of_scope: "Fora do escopo",
    }[state] || state;
  }

  function detalhesTrabalhos(work) {
    var items = Array.isArray(work?.items) ? work.items : [];
    if (!items.length) return "";
    return '<details class="area-work-details"><summary>Ver trabalhos e situação</summary>' +
      '<div class="area-work-list">' + items.map(function (item) {
        var state = item.state || "planned";
        return '<div class="area-work-item">' +
          '<span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstado(state)) + '</span>' +
          '<span>' + esc(item.text) + '</span>' +
        '</div>';
      }).join("") + '</div></details>';
  }

  function objetivosAtuais(current) {
    var items = Array.isArray(current?.progress?.items) ? current.progress.items : [];
    if (!items.length) return "";
    var atual = items.find(function (item) { return item.state === "in_progress"; });
    var proximo = items.find(function (item) { return item.state === "pending"; });
    var percentual = Math.max(0, Math.min(100, Number(current?.progress?.percent || 0)));
    var html = '<div class="area-current-objectives"><div class="area-current-objectives-title">Bloco ativo</div>' +
      '<div class="area-current-block-progress"><span>' + esc(current?.code || "bloco atual") + '</span><strong>' + percentual + '%</strong></div>';
    if (atual) html += '<div class="area-current-objective"><strong>Agora:</strong> ' + esc(atual.text) + '</div>';
    if (proximo) html += '<div class="area-current-objective"><strong>Depois:</strong> ' + esc(proximo.text) + '</div>';
    html += '</div>';
    return html;
  }

  function resumoTrabalhos(work, active, current) {
    work = work || {};
    var total = Number(work.total || 0);
    var done = Number(work.done || 0);
    var partial = Number(work.partial != null ? work.partial : (work.in_progress || 0));
    var activeNow = Number(work.active_now || 0);
    var planned = Number(work.planned || 0);
    var out = Number(work.out_of_scope || 0);
    var activeHtml = active
      ? '<div class="area-work-active"><strong>' + activeNow + '</strong> em desenvolvimento agora</div>'
      : '';
    return '<div class="area-work-summary">' +
      '<div class="area-work-total"><strong>' + total + '</strong> trabalhos cadastrados</div>' +
      '<div><strong>' + done + '</strong> concluídos</div>' +
      '<div><strong>' + partial + '</strong> parciais</div>' +
      activeHtml +
      '<div><strong>' + planned + '</strong> planejados</div>' +
      '<div><strong>' + out + '</strong> fora do escopo</div>' +
      (active ? objetivosAtuais(current) : '') +
      detalhesTrabalhos(work) +
    '</div>';
  }

  function indiceDocumentado(epic, current) {
    var work = epic?.work || {};
    var total = Number(work.total || 0);
    if (!(total > 0)) return null;
    var done = Number(work.done || 0);
    var activeNow = Number(work.active_now || 0);
    var progressoBloco = epic?.active
      ? Math.max(0, Math.min(100, Number(current?.progress?.percent || 0))) / 100
      : 0;
    var bruto = ((done + (activeNow * progressoBloco)) / total) * 100;
    return Math.max(0, Math.min(100, Math.round(bruto / 5) * 5));
  }

  function aplicarIndiceDocumentado(card, epic, current) {
    var indice = indiceDocumentado(epic, current);
    if (indice == null) return;
    var percent = card.querySelector(".epic-percent");
    var fill = card.querySelector(".epic-fill");
    var note = card.querySelector(".epic-note");
    card.classList.remove("pending");
    if (percent) {
      percent.classList.remove("pending");
      percent.textContent = "Área ~" + indice + "%";
    }
    if (fill) fill.style.width = indice + "%";
    if (note) {
      note.textContent = epic?.active
        ? "índice global da Área " + epic.number + "; o progresso do bloco ativo aparece separadamente abaixo"
        : "índice global documentado da área, calculado sobre os trabalhos cadastrados";
    }
    card.dataset.areaIndex = String(indice);
    card.dataset.areaIndexSource = "registered-work";
  }

  function limparTextoSequencia(texto) {
    return String(texto || "")
      .replace(/^bloco estrutural ativo:\s*/i, "")
      .replace(/^concluído\s*[—-]\s*/i, "")
      .trim();
  }

  function enriquecerSequencia(status) {
    var development = status.development || {};
    var current = development.current || {};
    var roadmap = Array.isArray(development.roadmap) ? development.roadmap : [];
    var cards = Array.from(document.querySelectorAll("#roadmap-grid .roadmap-item"));
    if (!roadmap.length || cards.length !== roadmap.length) return;

    var currentIndex = roadmap.findIndex(function (item) { return item.code === current.code; });
    var objetivos = current.progress?.items || [];
    var proximoObjetivo = objetivos.find(function (item) { return item.state !== "done"; });

    cards.forEach(function (card, index) {
      var item = roadmap[index] || {};
      var texto = limparTextoSequencia(item.text);
      var isCurrent = item.code === current.code;
      var concluido = currentIndex >= 0 && index < currentIndex;
      var estado = isCurrent ? "EM DESENVOLVIMENTO" : (concluido ? "CONCLUÍDO" : "PLANEJADO");
      var classe = isCurrent ? "active" : (concluido ? "done" : "planned");
      var explicacao;

      if (isCurrent) {
        var agora = proximoObjetivo?.text || "Objetivos do bloco estão sendo consolidados.";
        explicacao = '<strong>' + esc(current.title || texto) + '</strong><br>Agora: ' + esc(agora);
      } else if (concluido) {
        explicacao = '<strong>Resultado:</strong> ' + esc(texto || "etapa concluída e incorporada ao SIMETTRIA.");
      } else {
        explicacao = '<strong>Previsto:</strong> ' + esc(texto || "etapa ainda não iniciada.");
      }

      var box = card.querySelector(".roadmap-text");
      if (box) {
        box.innerHTML = '<span class="roadmap-state-badge ' + classe + '">' + estado + '</span>' +
          '<span class="roadmap-explain">' + explicacao + '</span>';
      }
      card.dataset.sequenceState = classe;
    });

    var note = document.querySelector("#roadmap .section-note");
    if (note) {
      note.textContent = "Cada card informa o que já foi concluído, o resultado incorporado ao projeto e o que está sendo executado agora.";
    }
  }

  function aplicar(status) {
    instalarEstilos();
    removerConsolidadoEAtalho();
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
      sectionNote.textContent = "Cada card mostra o índice global documentado da área. Quando houver bloco ativo, o progresso desse bloco aparece separadamente dentro do próprio card para evitar confusão entre os dois níveis.";
    }

    var cards = document.querySelectorAll("#epic-progress-grid .epic-progress-card");
    if (cards.length !== epics.length) return false;
    cards.forEach(function (card, index) {
      var epic = epics[index] || {};
      var active = Boolean(epic.active);
      card.classList.toggle("active-area", active);
      card.querySelector(".area-active-badge")?.remove();
      card.querySelector(".area-work-summary")?.remove();
      aplicarIndiceDocumentado(card, epic, current);
      var title = card.querySelector(".epic-title");
      if (active && title) {
        title.insertAdjacentHTML("afterend", '<div class="area-active-badge">Área ativa agora</div>');
      }
      card.insertAdjacentHTML("beforeend", resumoTrabalhos(epic.work, active, current));
    });
    enriquecerSequencia(status);
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