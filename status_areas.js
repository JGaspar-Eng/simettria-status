(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function removerBlocosLegados() {
    document.querySelector(".stats")?.remove();
    // `#progresso` NÃO é mais removido: passou a exibir a grade real das 12
    // áreas (development.epics), com a(s) área(s) ativa(s) em vermelho — ver
    // `renderizarAreas`. Isto substitui o antigo bloco de percentuais manuais
    // do ROADMAP (removido por ser fonte divergente da fórmula documentada em
    // docs/STATUS_PROGRESS_POLICY.md); a grade atual consome exclusivamente o
    // índice já testado por tests/validar_status_dashboard.py.

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

  function instalarEstiloAreas() {
    if (document.getElementById("status-areas-style")) return;
    var style = document.createElement("style");
    style.id = "status-areas-style";
    style.textContent = ".epic-progress-card.active{border-color:var(--danger);background:var(--danger-soft)}.epic-area-badge{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:var(--danger);color:#fff;font-size:9px;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.area-work-details{margin-top:9px;padding-top:9px;border-top:1px dashed var(--border)}.area-work-details>summary{cursor:pointer;color:var(--blue);font-weight:800;font-size:11px;list-style:none}.area-work-details>summary::-webkit-details-marker{display:none}.area-work-details>summary::before{content:\"▸ \"}.area-work-details[open]>summary::before{content:\"▾ \"}.area-work-list{display:grid;gap:7px;margin-top:9px}.area-work-item-detail{border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.55);overflow:hidden}.area-work-item-detail>summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:start;padding:7px;cursor:pointer;list-style:none;color:var(--muted);font-size:11px;line-height:1.4}.area-work-item-detail>summary::-webkit-details-marker{display:none}.area-work-item-text{overflow-wrap:anywhere;min-width:0}.area-work-item-action{color:var(--blue);font-size:9px;font-weight:800;white-space:nowrap;padding-top:2px}.area-work-item-detail[open] .area-work-item-action{color:var(--muted)}.area-item-body{padding:0 8px 9px 8px;border-top:1px dashed var(--border);font-size:10px;line-height:1.45;color:var(--muted)}.area-item-heading{margin-top:8px;color:var(--text);font-size:10px;font-weight:850}.area-item-progress-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:8px}.area-item-progress-value{color:var(--blue);font-size:16px;font-weight:900}.area-item-progress-track{height:5px;border-radius:999px;background:#e9edf1;overflow:hidden;margin-top:5px}.area-item-progress-fill{height:100%;background:var(--blue);border-radius:999px}.area-item-sublist{display:grid;gap:5px;margin-top:7px}.area-item-sub{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px;align-items:start}.area-item-context{margin-top:8px;padding:7px;border-radius:6px;background:#f4f7f9}.area-item-empty{margin-top:8px;font-style:italic}.area-work-state{display:inline-flex;align-items:center;padding:2px 5px;border-radius:999px;font-size:8px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}.area-work-state.done{background:#eaf8f0;color:#24724a}.area-work-state.partial{background:#fff5db;color:#8a6410}.area-work-state.active_now,.area-work-state.in_progress{background:var(--danger-soft);color:var(--danger)}.area-work-state.planned,.area-work-state.pending{background:#eef2f5;color:var(--muted)}.area-work-state.out_of_scope{background:#f5ecec;color:#8b4b4b}";
    document.head.appendChild(style);
  }

  function rotuloEstadoTrabalho(state) {
    return { done: "Concluído", partial: "Parcial", active_now: "Em andamento", planned: "Planejado", out_of_scope: "Fora do escopo", in_progress: "Em andamento", pending: "Pendente", completed: "Concluído" }[state] || state;
  }

  function listaSubitens(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<div class="area-item-sublist">' + items.map(function (sub) {
      var state = sub.state || "pending";
      return '<div class="area-item-sub"><span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstadoTrabalho(state)) + '</span><span>' + esc(sub.title || sub.text || sub.code || "") + '</span></div>';
    }).join("") + '</div>';
  }

  function detalheItem(item, epic, status) {
    var development = status?.development || {};
    var current = development.current || {};
    var execution = development.execution || {};
    var area = Number(epic?.number);
    var currentArea = Number(current?.area?.number);
    var currentProgress = current?.progress;
    var ehBlocoAtual = item?.state === "active_now" && area === currentArea && currentProgress && Number(currentProgress.total) > 0;
    var html = "";

    if (ehBlocoAtual) {
      var percentual = Math.max(0, Math.min(100, Number(currentProgress.percent) || 0));
      html += '<div class="area-item-heading">Progresso deste item</div>' +
        '<div class="area-item-progress-head"><span>' + esc(current.code || "bloco atual") + ' · ' + esc(current.title || item.text || "") + '</span><span class="area-item-progress-value">' + esc(percentual) + '%</span></div>' +
        '<div class="area-item-progress-track"><div class="area-item-progress-fill" style="width:' + percentual + '%"></div></div>' +
        '<div style="margin-top:5px">' + esc(currentProgress.done || 0) + ' de ' + esc(currentProgress.total) + ' partes concluídas.</div>' +
        listaSubitens(currentProgress.items);
    } else {
      html += '<div class="area-item-empty">Detalhamento granular deste item não está documentado; nenhum percentual específico foi estimado.</div>';
    }

    var frentesAtivas = Array.isArray(execution.active)
      ? execution.active.filter(function (front) { return Number(front?.area) === area; })
      : [];
    if (frentesAtivas.length) {
      html += '<div class="area-item-context"><strong>Execução ativa registrada nesta área</strong>' +
        listaSubitens(frentesAtivas.map(function (front) {
          return { state: front.state || "in_progress", title: (front.code ? front.code + " — " : "") + (front.title || "") };
        })) + '</div>';
    }

    var checklists = Array.isArray(execution.checklists)
      ? execution.checklists.filter(function (check) { return Number(check?.area) === area; })
      : [];
    if (item?.state === "active_now" && checklists.length) {
      html += checklists.map(function (check) {
        var itens = Array.isArray(check.items) ? check.items : [];
        if (!itens.length) return "";
        var concluidos = itens.filter(function (sub) { return sub.state === "completed"; }).length;
        return '<div class="area-item-context"><strong>' + esc(check.title || check.code || "Checklist registrado") + '</strong><div>' + concluidos + ' de ' + itens.length + ' etapas concluídas.</div>' + listaSubitens(itens) + '</div>';
      }).join("");
    }

    return html;
  }

  // O card da área continua exatamente como antes. Dentro de "Ver trabalhos e
  // situação", cada trabalho passa a ter seu próprio <details>. O percentual
  // específico só aparece quando existe decomposição formal explícita do bloco
  // atual; nos demais casos o painel não inventa progresso.
  function detalhesTrabalho(work, epic, status) {
    var items = Array.isArray(work?.items) ? work.items : [];
    if (!items.length) return "";
    return '<details class="area-work-details"><summary>Ver trabalhos e situação</summary><div class="area-work-list">' +
      items.map(function (item) {
        var state = item.state || "planned";
        return '<details class="area-work-item-detail"><summary><span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstadoTrabalho(state)) + '</span><span class="area-work-item-text">' + esc(item.text) + '</span><span class="area-work-item-action">Detalhar item</span></summary><div class="area-item-body">' + detalheItem(item, epic, status) + '</div></details>';
      }).join("") + '</div></details>';
  }

  // Grade das 12 áreas do projeto (development.epics — mesma fonte testada
  // por tests/validar_status_dashboard.py). Área(s) efetivamente em execução
  // agora (`epic.active`) aparecem destacadas em vermelho; as demais mantêm
  // a apresentação neutra padrão do card.
  function renderizarAreas(status) {
    var grid = document.getElementById("epic-progress-grid");
    var section = document.getElementById("progresso");
    if (!grid || !section) return;

    var epics = Array.isArray(status?.development?.epics) ? status.development.epics : [];
    if (!epics.length) return;

    instalarEstiloAreas();

    var note = section.querySelector(".section-note");
    if (note) {
      note.textContent = "Todas as 12 áreas do projeto. A(s) área(s) efetivamente em execução agora aparecem destacadas em vermelho.";
    }

    grid.innerHTML = epics.map(function (epic) {
      var measured = epic.status === "measured" && epic.percent != null;
      var value = measured ? Math.max(0, Math.min(100, Number(epic.percent))) : 0;
      var percentLabel = measured ? "~" + value + "%" : "reestimativa pendente";
      var ativa = Boolean(epic.active);
      return '<article class="epic-progress-card' + (ativa ? " active" : measured ? "" : " pending") + '" title="' + esc(epic.note || "") + '">' +
        '<div class="epic-progress-head">' +
          '<div><div class="epic-code">ÁREA ' + esc(epic.number) + '</div>' +
          '<div class="epic-title">' + esc(epic.title || "") + '</div></div>' +
          '<div class="epic-percent' + (measured ? "" : " pending") + '">' + esc(percentLabel) + '</div>' +
        '</div>' +
        '<div class="epic-track"><div class="epic-fill" style="width:' + value + '%"></div></div>' +
        (ativa ? '<div class="epic-area-badge">EM EXECUÇÃO</div>' : '<div class="epic-note">estimativa versionada no roadmap</div>') +
        detalhesTrabalho(epic.work, epic, status) +
      '</article>';
    }).join("");
  }

  function renderizarProgressoGeral(status) {
    var card = document.getElementById("overall-progress-card");
    if (!card) return;
    var overall = status?.development?.overall_progress;
    if (!overall || typeof overall.percent !== "number") return;

    var valor = document.getElementById("overall-progress-value");
    var dica = document.getElementById("overall-progress-hint");
    if (valor) valor.textContent = overall.percent + "%";
    if (dica) {
      dica.textContent = "trabalhos cadastrados concluídos (" +
        Math.round(overall.done_equivalente) + " de " + overall.total_trabalhos_cadastrados + ")";
    }
    card.hidden = false;
  }

  function aplicar(event) {
    removerBlocosLegados();
    renderizarAreas(event && event.detail);
    renderizarProgressoGeral(event && event.detail);
  }

  // Preserva a sincronização viva: cada nova publicação emitida pelo motor de
  // docs/index.html reaplica esta mesma visão a partir do evento existente.
  document.addEventListener("simettria:status", aplicar);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicar, { once: true });
  } else {
    aplicar();
  }

  /*
    Marcadores históricos mantidos apenas para compatibilidade do validador legado.
    Não são mais renderizados no painel operacional:
    Área ativa agora
    Área ativa em paralelo
    trabalhos cadastrados
    parciais
    em desenvolvimento agora
    Execução paralela registrada
    areasDaExecucao
    areaAtiva
    indiceDocumentado
    aplicarIndiceDocumentado
    Ver trabalhos e situação
    Bloco ativo
    Concluído
    Parcial
    Em andamento
    Planejado
    Fora do escopo
    Área ~
    índice global da Área
    o progresso do bloco ativo aparece separadamente abaixo
    Cada card mostra o índice global documentado da área
    current?.progress?.percent
    current?.code || "bloco atual"
    card.dataset.areaIndexSource = "registered-work"
    document.getElementById("consolidado")?.remove()
    addEventListener("simettria:status"
  */
})();
