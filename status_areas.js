(function () {
  "use strict";

  function removerBlocosLegados() {
    document.querySelector(".stats")?.remove();

    var currentTitle = document.getElementById("current-title");
    var currentSection = currentTitle?.closest("section");
    if (currentSection) currentSection.remove();

    document.getElementById("consolidado")?.remove();

    var nav = document.querySelector("nav.top");
    if (nav) {
      nav.querySelector('a[href="#estado-atual"]')?.remove();
      nav.querySelector('a[href="#consolidado"]')?.remove();
    }
  }

  // Estilos do detalhamento por área. Restaurados de d5e7311 sem os seletores
  // dos blocos legados (`.stats`, `.current-area-context`, `.roadmap-*`), que
  // não existem mais no DOM depois de `removerBlocosLegados`.
  function instalarEstilos() {
    if (document.getElementById("status-areas-style")) return;
    var style = document.createElement("style");
    style.id = "status-areas-style";
    style.textContent = [
      ".epic-progress-card.active-area { border-color:#d96b6b;box-shadow:0 0 0 2px rgba(164,56,56,.10);background:#fff7f7; }",
      ".area-active-badge { display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:#b42318;color:#fff;font-size:9px;font-weight:850;letter-spacing:.06em;text-transform:uppercase; }",
      ".area-work-summary { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px;margin-top:12px;padding-top:11px;border-top:1px solid var(--border);color:var(--muted);font-size:10px;line-height:1.35; }",
      ".area-work-summary strong { color:var(--text);font-family:var(--mono); }",
      ".area-work-total { grid-column:1/-1;color:var(--text);font-size:11px;font-weight:750; }",
      ".area-work-active { color:#a43838;font-weight:800; }",
      ".area-work-details { grid-column:1/-1;margin-top:5px;padding-top:8px;border-top:1px dashed var(--border); }",
      ".area-work-details summary { cursor:pointer;color:var(--blue);font-weight:800;list-style:none; }",
      ".area-work-details summary::-webkit-details-marker { display:none; }",
      '.area-work-details summary::before { content:"\\25B8 "; }',
      '.area-work-details[open] summary::before { content:"\\25BE "; }',
      ".area-work-list { display:grid;gap:7px;margin-top:9px; }",
      ".area-work-item { display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:start;color:var(--muted);line-height:1.4; }",
      ".area-work-state { display:inline-flex;align-items:center;padding:2px 5px;border-radius:999px;font-size:8px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap; }",
      ".area-work-state.done { background:#eaf8f0;color:#24724a; }",
      ".area-work-state.partial { background:#fff5db;color:#8a6410; }",
      ".area-work-state.active_now { background:#fbefef;color:#a43838; }",
      ".area-work-state.planned { background:#eef2f5;color:var(--muted); }",
      ".area-work-state.out_of_scope { background:#f5ecec;color:#8b4b4b; }",
      ".area-current-objectives { grid-column:1/-1;margin-top:7px;padding:8px;border-radius:8px;background:rgba(164,56,56,.05); }",
      ".area-current-objectives-title { color:var(--text);font-weight:800;margin-bottom:6px; }",
      ".area-current-block-progress { display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid rgba(164,56,56,.16); }",
      ".area-current-block-progress strong { color:#a43838;font-size:13px; }",
      ".area-current-objective { margin-top:4px; }",
      "@media (max-width: 640px) { .area-work-summary { grid-template-columns:1fr; } }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rotuloEstado(state) {
    return {
      done: "Concluído",
      partial: "Parcial",
      active_now: "Em andamento",
      planned: "Planejado",
      out_of_scope: "Fora do escopo"
    }[state] || state;
  }

  function areasDaExecucao(status) {
    var itens = status?.development?.execution?.active || [];
    return new Set(itens.map(function (item) { return Number(item.area); }).filter(Boolean));
  }

  function areaAtiva(epic, areasAtivas) {
    return Boolean(epic?.active || areasAtivas.has(Number(epic?.number)));
  }

  function areaParalela(epic, areasAtivas) {
    return !epic?.active && areasAtivas.has(Number(epic?.number));
  }

  // Índice derivado EXCLUSIVAMENTE dos trabalhos cadastrados no status gerado.
  // Não usa `epic.percent` (estimativa histórica do ROADMAP).
  function indiceDoTrabalho(epic) {
    var work = epic && epic.work ? epic.work : {};
    var done = Number(work.done) || 0;
    var partial = Number(work.partial) || 0;
    var activeNow = Number(work.active_now) || 0;
    var planned = Number(work.planned) || 0;
    var total = Number(work.total) || (done + partial + activeNow + planned);

    if (!total) return null;

    return {
      percent: Math.round(((done + 0.5 * partial + 0.5 * activeNow) / total) * 100),
      done: done,
      partial: partial,
      activeNow: activeNow,
      planned: planned,
      outOfScope: Number(work.out_of_scope) || 0,
      total: total
    };
  }

  // Lista item a item, com o estado real gravado em `work.items[].state`.
  // Nada é inferido: item sem estado declarado é apresentado como planejado.
  function detalhesTrabalhos(work) {
    var items = Array.isArray(work?.items) ? work.items : [];
    if (!items.length) return "";
    return '<details class="area-work-details"><summary>Ver trabalhos e situação</summary><div class="area-work-list">' +
      items.map(function (item) {
        var state = item.state || "planned";
        return '<div class="area-work-item">' +
          '<span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstado(state)) + "</span>" +
          "<span>" + esc(item.text) + "</span></div>";
      }).join("") + "</div></details>";
  }

  function objetivosAtuais(current) {
    var items = Array.isArray(current?.progress?.items) ? current.progress.items : [];
    if (!items.length) return "";
    var atual = items.find(function (item) { return item.state === "in_progress"; });
    var proximo = items.find(function (item) { return item.state === "pending"; });
    var percentual = Math.max(0, Math.min(100, Number(current?.progress?.percent || 0)));
    var html = '<div class="area-current-objectives"><div class="area-current-objectives-title">Bloco ativo</div>' +
      '<div class="area-current-block-progress"><span>' + esc(current?.code || "bloco atual") + "</span><strong>" + percentual + "%</strong></div>";
    if (atual) html += '<div class="area-current-objective"><strong>Agora:</strong> ' + esc(atual.text) + "</div>";
    if (proximo) html += '<div class="area-current-objective"><strong>Depois:</strong> ' + esc(proximo.text) + "</div>";
    return html + "</div>";
  }

  function resumoTrabalhos(indice, work, active, current, parallel) {
    var activeHtml = "";
    if (parallel) activeHtml = '<div class="area-work-active">Execução paralela registrada</div>';
    else if (active) activeHtml = '<div class="area-work-active"><strong>' + indice.activeNow + "</strong> em desenvolvimento agora</div>";
    else activeHtml = "<div><strong>" + indice.activeNow + "</strong> em andamento</div>";

    return '<div class="area-work-summary">' +
      '<div class="area-work-total"><strong>' + indice.total + "</strong> trabalhos cadastrados</div>" +
      "<div><strong>" + indice.done + "</strong> concluídos</div>" +
      "<div><strong>" + indice.partial + "</strong> parciais</div>" +
      activeHtml +
      "<div><strong>" + indice.planned + "</strong> planejados</div>" +
      "<div><strong>" + indice.outOfScope + "</strong> fora do escopo</div>" +
      (active && !parallel ? objetivosAtuais(current) : "") +
      detalhesTrabalhos(work) +
      "</div>";
  }

  function atualizarCardsDasAreas(status) {
    var epics = status?.development?.epics;
    if (!Array.isArray(epics)) return;

    var current = status?.development?.current || {};
    var areasAtivas = areasDaExecucao(status);

    var porNumero = new Map(epics.map(function (epic) {
      return [Number(epic.number), epic];
    }));

    document.querySelectorAll(".epic-progress-card").forEach(function (card) {
      var code = card.querySelector(".epic-code")?.textContent || "";
      var match = code.match(/ÁREA\s+(\d+)/i);
      if (!match) return;

      var epic = porNumero.get(Number(match[1]));
      var indice = indiceDoTrabalho(epic);
      if (!indice) return;

      var percent = Math.max(0, Math.min(100, indice.percent));
      var percentNode = card.querySelector(".epic-percent");
      var fill = card.querySelector(".epic-fill");
      var note = card.querySelector(".epic-note");

      card.classList.remove("pending");
      card.dataset.areaIndexSource = "registered-work";
      card.title = "Índice operacional calculado a partir dos trabalhos cadastrados no status gerado. Não representa cobertura normativa ou validação integral do domínio.";

      if (percentNode) {
        percentNode.classList.remove("pending");
        percentNode.textContent = "~" + percent + "%";
      }
      if (fill) fill.style.width = percent + "%";
      if (note) {
        note.textContent = "índice do trabalho cadastrado · " +
          indice.done + " concluídos · " +
          indice.partial + " parciais · " +
          indice.activeNow + " em execução · " +
          indice.planned + " planejados";
      }

      // Reaplicação idempotente: o painel repinta a cada sincronização.
      var active = areaAtiva(epic, areasAtivas);
      var parallel = areaParalela(epic, areasAtivas);
      card.classList.toggle("active-area", active);
      card.querySelector(".area-active-badge")?.remove();
      card.querySelector(".area-work-summary")?.remove();

      var title = card.querySelector(".epic-title");
      if (active && title) {
        title.insertAdjacentHTML(
          "afterend",
          '<div class="area-active-badge">' + (parallel ? "Área ativa em paralelo" : "Área ativa agora") + "</div>"
        );
      }
      card.insertAdjacentHTML("beforeend", resumoTrabalhos(indice, epic.work, active, current, parallel));
    });
  }

  function aplicar(event) {
    instalarEstilos();
    removerBlocosLegados();
    atualizarCardsDasAreas(event?.detail);
  }

  document.addEventListener("simettria:status", aplicar);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removerBlocosLegados, { once: true });
  } else {
    removerBlocosLegados();
  }
})();
