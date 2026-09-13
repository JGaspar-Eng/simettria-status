(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

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

  function instalarEstiloAreas() {
    if (document.getElementById("status-areas-style")) return;
    var style = document.createElement("style");
    style.id = "status-areas-style";
    style.textContent = ".epic-progress-card.active{border-color:var(--danger);background:var(--danger-soft)}.epic-progress-card.area-expanded{grid-column:1/-1}.epic-area-badge{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:var(--danger);color:#fff;font-size:9px;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.area-work-details{margin-top:9px;padding-top:9px;border-top:1px dashed var(--border)}.area-work-details>summary{cursor:pointer;color:var(--blue);font-weight:800;font-size:11px;list-style:none}.area-work-details>summary::-webkit-details-marker{display:none}.area-work-details>summary::before{content:\"▸ \"}.area-work-details[open]>summary::before{content:\"▾ \"}.area-work-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.area-work-item-detail{border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,.55);overflow:hidden}.area-work-item-detail>summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:start;padding:7px;cursor:pointer;list-style:none;color:var(--muted);font-size:11px;line-height:1.4}.area-work-item-detail>summary::-webkit-details-marker{display:none}.area-work-item-text{overflow-wrap:break-word;min-width:0}.area-work-item-action{color:var(--blue);font-size:9px;font-weight:800;white-space:nowrap;padding-top:2px}.area-item-body{padding:0 8px 9px;border-top:1px dashed var(--border);font-size:10px;line-height:1.45;color:var(--muted)}.area-item-context{margin-top:9px;padding:8px;border-radius:7px;background:#f4f7f9;font-size:10px;line-height:1.45;color:var(--muted)}.area-item-context-title{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.area-source{margin-top:4px;font-family:var(--mono);font-size:9px;color:var(--faint);overflow-wrap:break-word}.area-item-empty{margin-top:7px;font-style:italic}.area-item-sublist{display:grid;gap:5px;margin-top:7px}.area-item-sub{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px;align-items:start}.area-work-state{display:inline-flex;align-items:center;padding:2px 5px;border-radius:999px;font-size:8px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}.area-work-state.done,.area-work-state.completed{background:#eaf8f0;color:#24724a}.area-work-state.partial{background:#fff5db;color:#8a6410}.area-work-state.active_now,.area-work-state.in_progress{background:var(--danger-soft);color:var(--danger)}.area-work-state.planned,.area-work-state.pending{background:#eef2f5;color:var(--muted)}.area-work-state.out_of_scope{background:#f5ecec;color:#8b4b4b}@media(max-width:760px){.area-work-list{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  }

  function rotuloEstado(state) {
    return { done: "Concluído", completed: "Concluído", partial: "Parcial", active_now: "Em andamento", in_progress: "Em andamento", planned: "Planejado", pending: "Pendente", out_of_scope: "Fora do escopo" }[state] || state;
  }

  function listaSubitens(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<div class="area-item-sublist">' + items.map(function (sub) {
      var state = sub.state || "pending";
      var fonte = sub.source ? '<div class="area-source">' + esc(sub.source) + '</div>' : "";
      return '<div class="area-item-sub"><span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstado(state)) + '</span><span>' + esc(sub.title || sub.text || sub.code || "") + fonte + '</span></div>';
    }).join("") + '</div>';
  }

  function detalheItem(item) {
    var state = item?.state || "planned";
    var html = '<div style="margin-top:8px"><span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstado(state)) + '</span></div>';
    if (item?.raw_text && item.raw_text !== item.text) html += '<div class="area-source">Registro original: ' + esc(item.raw_text) + '</div>';
    return html + '<div class="area-item-empty">Este detalhe pertence somente a este trabalho. O bloco ativo e os checklists da área aparecem uma única vez abaixo, fora dos itens do ROADMAP.</div>';
  }

  function coletarFrentesArea(area, execution) {
    var grupos = [
      { nome: "Em execução", lista: execution.active || [] },
      { nome: "Próximas", lista: execution.next || [] },
      { nome: "Concluídas", lista: execution.completed || [] },
      { nome: "Recentes", lista: execution.recent || [] }
    ];
    var mapa = new Map();
    grupos.forEach(function (grupo) {
      grupo.lista.forEach(function (front) {
        if (Number(front?.area) !== area || !front?.code) return;
        var prioridade = front.state === "in_progress" ? 4 : front.state === "planned" ? 3 : front.state === "completed" ? 2 : 1;
        var anterior = mapa.get(front.code);
        if (!anterior || prioridade > anterior.prioridade) mapa.set(front.code, { front: front, grupo: grupo.nome, prioridade: prioridade });
      });
    });
    return Array.from(mapa.values()).sort(function (a, b) {
      return b.prioridade - a.prioridade || String(a.front.code).localeCompare(String(b.front.code));
    });
  }

  function frentesArea(epic, status) {
    var execution = status?.development?.execution || {};
    var registros = coletarFrentesArea(Number(epic?.number), execution);
    if (!registros.length) return '<div class="area-item-context"><strong>Frentes registradas</strong><div class="area-item-empty">Nenhuma frente operacional específica registrada nesta área.</div></div>';
    return '<div class="area-item-context"><div class="area-item-context-title"><strong>Frentes operacionais registradas</strong><span>' + esc(registros.length) + '</span></div>' + registros.map(function (registro) {
      var front = registro.front;
      return '<div style="margin-top:8px;padding-top:7px;border-top:1px dashed var(--border)"><div class="area-item-context-title"><strong>' + esc(front.code) + '</strong><span class="area-work-state ' + esc(front.state || "pending") + '">' + esc(rotuloEstado(front.state || "pending")) + '</span></div><div style="margin-top:3px">' + esc(front.title || "") + '</div><div class="area-source">' + esc(registro.grupo) + (front.source ? ' · ' + esc(front.source) : '') + '</div></div>';
    }).join("") + '</div>';
  }

  function checklistsArea(epic, status) {
    var execution = status?.development?.execution || {};
    var area = Number(epic?.number);
    var checklists = Array.isArray(execution.checklists) ? execution.checklists.filter(function (check) { return Number(check?.area) === area; }) : [];
    if (!checklists.length) return "";
    return checklists.map(function (check) {
      var items = Array.isArray(check.items) ? check.items : [];
      var concluidos = items.filter(function (item) { return item.state === "completed" || item.state === "done"; }).length;
      return '<div class="area-item-context"><div class="area-item-context-title"><strong>' + esc(check.title || check.code || "Checklist") + '</strong><span>' + esc(concluidos) + ' de ' + esc(items.length) + ' concluídos</span></div><div class="area-source">' + esc(check.code || "") + '</div>' + listaSubitens(items) + '</div>';
    }).join("");
  }

  function trabalhosRoadmap(work) {
    var items = Array.isArray(work?.items) ? work.items : [];
    if (!items.length) return "";
    return '<div class="area-item-context"><div class="area-item-context-title"><strong>Trabalhos do ROADMAP</strong><span>' + esc(items.length) + '</span></div><div class="area-work-list">' + items.map(function (item) {
      var state = item.state || "planned";
      return '<details class="area-work-item-detail"><summary><span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstado(state)) + '</span><span class="area-work-item-text">' + esc(item.text || "") + '</span><span class="area-work-item-action">Detalhar</span></summary><div class="area-item-body">' + detalheItem(item) + '</div></details>';
    }).join("") + '</div></div>';
  }

  function detalhesArea(epic, status) {
    return '<details class="area-work-details"><summary>Ver frentes, checklists e trabalhos</summary>' + frentesArea(epic, status) + checklistsArea(epic, status) + trabalhosRoadmap(epic?.work) + '</details>';
  }

  function renderizarAreas(status) {
    var grid = document.getElementById("epic-progress-grid");
    var section = document.getElementById("progresso");
    if (!grid || !section) return;
    var epics = Array.isArray(status?.development?.epics) ? status.development.epics : [];
    if (!epics.length) return;
    instalarEstiloAreas();
    var note = section.querySelector(".section-note");
    if (note) note.textContent = "Todas as 12 áreas. Frentes ativas, próximas, concluídas e checklists vêm do status versionado; nenhum percentual específico é inventado.";
    grid.innerHTML = epics.map(function (epic) {
      var measured = epic.status === "measured" && epic.percent != null;
      var value = measured ? Math.max(0, Math.min(100, Number(epic.percent))) : 0;
      var ativa = Boolean(epic.active);
      return '<article class="epic-progress-card area-expanded' + (ativa ? ' active' : measured ? '' : ' pending') + '">' +
        '<div class="epic-progress-head"><div><div class="epic-code">ÁREA ' + esc(epic.number) + '</div><div class="epic-title">' + esc(epic.title || "") + '</div></div><div class="epic-percent' + (measured ? '' : ' pending') + '">' + esc(measured ? '~' + value + '%' : 'reestimativa pendente') + '</div></div>' +
        '<div class="epic-track"><div class="epic-fill" style="width:' + value + '%"></div></div>' +
        (ativa ? '<div class="epic-area-badge">EM EXECUÇÃO</div>' : '<div class="epic-note">estado versionado da área</div>') +
        detalhesArea(epic, status) + '</article>';
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
    if (dica) dica.textContent = "trabalhos cadastrados concluídos (" + Math.round(overall.done_equivalente) + " de " + overall.total_trabalhos_cadastrados + ")";
    card.hidden = false;
  }

  function aplicar(event) {
    removerBlocosLegados();
    renderizarAreas(event && event.detail);
    renderizarProgressoGeral(event && event.detail);
  }

  document.addEventListener("simettria:status", aplicar);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aplicar, { once: true });
  else aplicar();
})();
