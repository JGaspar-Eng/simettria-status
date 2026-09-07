(function () {
  "use strict";

  function removerOverlayCoordenacao() {
    document.getElementById("estado-vivo")?.remove();
    document.querySelector('nav.top a[href="#estado-vivo"]')?.remove();
  }

  removerOverlayCoordenacao();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removerOverlayCoordenacao, { once: true });
  }

  // A issue #231 permanece como fonte técnica de coordenação, mas seu histórico
  // não é mais renderizado no painel operacional. O painel mostra somente
  // EM EXECUÇÃO e PLANEJADO, via status_sequence.js.
  window.__simettriaCoordenacaoPainel = {
    verificar: removerOverlayCoordenacao,
    intervaloMs: 0,
  };
})();
