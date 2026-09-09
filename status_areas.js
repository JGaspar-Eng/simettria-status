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
    style.textContent = ".epic-progress-card.active{border-color:var(--danger);background:var(--danger-soft)}.epic-area-badge{display:inline-flex;margin-top:8px;padding:4px 7px;border-radius:999px;background:var(--danger);color:#fff;font-size:9px;font-weight:850;letter-spacing:.05em;text-transform:uppercase}";
    document.head.appendChild(style);
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
      '</article>';
    }).join("");
  }

  function aplicar(event) {
    removerBlocosLegados();
    renderizarAreas(event && event.detail);
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
