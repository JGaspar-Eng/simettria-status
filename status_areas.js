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

  function aplicar() {
    removerBlocosLegados();
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
