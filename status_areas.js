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
    style.textContent = ".epic-progress-card.active{border-color:var(--danger);background:var(--danger-soft)}.epic-area-badge{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:var(--danger);color:#fff;font-size:9px;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.area-work-details{margin-top:9px;padding-top:9px;border-top:1px dashed var(--border)}.area-work-details summary{cursor:pointer;color:var(--blue);font-weight:800;font-size:11px;list-style:none}.area-work-details summary::-webkit-details-marker{display:none}.area-work-details summary::before{content:\"▸ \"}.area-work-details[open] summary::before{content:\"▾ \"}.area-work-list{display:grid;gap:7px;margin-top:9px}.area-work-item{display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px;align-items:start;color:var(--muted);font-size:11px;line-height:1.4}.area-work-item>span:last-child{overflow-wrap:anywhere;min-width:0}.area-work-state{display:inline-flex;align-items:center;padding:2px 5px;border-radius:999px;font-size:8px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}.area-work-state.done{background:#eaf8f0;color:#24724a}.area-work-state.partial{background:#fff5db;color:#8a6410}.area-work-state.active_now{background:var(--danger-soft);color:var(--danger)}.area-work-state.planned{background:#eef2f5;color:var(--muted)}.area-work-state.out_of_scope{background:#f5ecec;color:#8b4b4b}";
    document.head.appendChild(style);
  }

  function rotuloEstadoTrabalho(state) {
    return { done: "Concluído", partial: "Parcial", active_now: "Em andamento", planned: "Planejado", out_of_scope: "Fora do escopo" }[state] || state;
  }

  // Ao clicar no card, ele expande (via <details> nativo) mostrando cada
  // trabalho cadastrado da área com seu estado — incluindo os ainda
  // `planned`, que são os próximos passos daquela área especificamente.
  function detalhesTrabalho(work) {
    var items = Array.isArray(work?.items) ? work.items : [];
    if (!items.length) return "";
    return '<details class="area-work-details"><summary>Ver trabalhos e situação</summary><div class="area-work-list">' +
      items.map(function (item) {
        var state = item.state || "planned";
        return '<div class="area-work-item"><span class="area-work-state ' + esc(state) + '">' + esc(rotuloEstadoTrabalho(state)) + '</span><span>' + esc(item.text) + '</span></div>';
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
    if (!epics.length) return; // sem dado real: preserva o fallback já renderizado pelo index.html

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
        detalhesTrabalho(epic.work) +
      '</article>';
    }).join("");
  }

  // Card ao lado do título "Estado real do desenvolvimento do SIMETTRIA"
  // (a pedido do usuário): percentual geral do projeto, extensão do mesmo
  // índice documentado por área (docs/STATUS_PROGRESS_POLICY.md) somado
  // sobre todos os trabalhos cadastrados de todas as 12 áreas —
  // `development.overall_progress`, já testado por
  // tests/validar_status_dashboard.py.
  function renderizarProgressoGeral(status) {
    var card = document.getElementById("overall-progress-card");
    if (!card) return;
    var overall = status?.development?.overall_progress;
    if (!overall || typeof overall.percent !== "number") return; // sem dado real: mantém oculto

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
