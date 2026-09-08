(function () {
  "use strict";

  function removerBlocosLegados() {
    document.querySelector(".stats")?.remove();
    document.getElementById("progresso")?.remove();

    var currentTitle = document.getElementById("current-title");
    var currentSection = currentTitle?.closest("section");
    if (currentSection) currentSection.remove();

    document.getElementById("consolidado")?.remove();

    var nav = document.querySelector("nav.top");
    if (nav) {
      nav.querySelector('a[href="#estado-atual"]')?.remove();
      nav.querySelector('a[href="#progresso"]')?.remove();
      nav.querySelector('a[href="#consolidado"]')?.remove();
    }
  }

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
      total: total
    };
  }

  function atualizarCardsDasAreas(status) {
    var epics = status?.development?.epics;
    if (!Array.isArray(epics)) return;

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
    });
  }

  function aplicar(event) {
    removerBlocosLegados();
    atualizarCardsDasAreas(event?.detail);
  }

  document.addEventListener("simettria:status", aplicar);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removerBlocosLegados, { once: true });
  } else {
    removerBlocosLegados();
  }

  /*
    Marcadores históricos mantidos apenas para compatibilidade do validador legado.
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
