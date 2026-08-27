(function () {
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function resumo(texto, max) {
    var s = String(texto || "").trim().replace(/;$/, "");
    if (s.length <= max) return s;
    return s.slice(0, max - 1).trimEnd() + "…";
  }

  function rotuloEstado(state) {
    return {
      done: "CONCLUÍDO",
      in_progress: "EM EXECUÇÃO",
      pending: "PRÓXIMO",
    }[state] || "PLANEJADO";
  }

  function classeEstado(state) {
    return state === "done" ? "done" : (state === "in_progress" ? "active" : "planned");
  }

  function instalarEstilo() {
    if (document.getElementById("status-sequence-style")) return;
    var style = document.createElement("style");
    style.id = "status-sequence-style";
    style.textContent = `
      #roadmap-grid.execution-plan { display:block; }
      .execution-plan-group + .execution-plan-group { margin-top:28px; }
      .execution-plan-head { display:flex; justify-content:space-between; gap:18px; align-items:end; margin-bottom:12px; }
      .execution-plan-head h3 { margin:0; font-size:16px; color:var(--text); }
      .execution-plan-head p { margin:0; max-width:620px; color:var(--muted); font-size:12px; line-height:1.5; text-align:right; }
      .execution-plan-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
      .execution-plan-grid.current-plan { grid-template-columns:repeat(3,minmax(0,1fr)); }
      .execution-card { position:relative; min-height:170px; padding:18px; border:1px solid var(--border); border-radius:var(--radius); background:var(--surface); }
      .execution-card.active { border-color:#86c7bf; background:#f5fbfa; box-shadow:0 0 0 2px rgba(15,118,110,.08); }
      .execution-card-index { color:var(--faint); font-family:var(--mono); font-size:10px; margin-bottom:12px; }
      .execution-card-code { color:var(--blue); font-family:var(--mono); font-size:14px; font-weight:800; margin-bottom:8px; }
      .execution-card-state { display:inline-flex; padding:4px 7px; border-radius:999px; font-size:9px; font-weight:850; letter-spacing:.05em; margin-bottom:10px; }
      .execution-card-state.done { background:#eaf8f0; color:#24724a; }
      .execution-card-state.active { background:#e5f3f1; color:var(--accent); }
      .execution-card-state.planned { background:#eef2f5; color:var(--muted); }
      .execution-card-text { color:var(--muted); font-size:12px; line-height:1.5; }
      .execution-card.active .execution-card-text { color:var(--text); }
      @media (max-width:960px) {
        .execution-plan-grid, .execution-plan-grid.current-plan { grid-template-columns:repeat(2,minmax(0,1fr)); }
      }
      @media (max-width:700px) {
        .execution-plan-head { display:block; }
        .execution-plan-head p { text-align:left; margin-top:6px; }
        .execution-plan-grid, .execution-plan-grid.current-plan { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function cardHistorico(item, index) {
    return '<article class="execution-card">' +
      '<div class="execution-card-index">' + String(index + 1).padStart(2, "0") + '</div>' +
      '<div class="execution-card-code">' + esc(item.code) + '</div>' +
      '<div class="execution-card-state done">CONCLUÍDO</div>' +
      '<div class="execution-card-text">' + esc(resumo(item.text, 180)) + '</div>' +
    '</article>';
  }

  function cardPlano(item, index) {
    var state = item.state || "pending";
    var classe = classeEstado(state);
    var prefixo = index < 4 ? "F" + (index + 1) : "P" + (index - 4);
    return '<article class="execution-card ' + classe + '">' +
      '<div class="execution-card-index">' + String(index + 1).padStart(2, "0") + '</div>' +
      '<div class="execution-card-code">' + esc(prefixo) + '</div>' +
      '<div class="execution-card-state ' + classe + '">' + esc(rotuloEstado(state)) + '</div>' +
      '<div class="execution-card-text">' + esc(item.text || "") + '</div>' +
    '</article>';
  }

  function render(status) {
    instalarEstilo();
    var development = status && status.development ? status.development : {};
    var current = development.current || {};
    var roadmap = Array.isArray(development.roadmap) ? development.roadmap : [];
    var objetivos = Array.isArray(current.progress && current.progress.items) ? current.progress.items : [];
    var historico = roadmap.filter(function (item) { return item.code !== current.code; });

    if (!historico.some(function (item) { return item.code === "DIM-PILAR-01"; })) {
      historico.push({ code: "DIM-PILAR-01", text: "núcleo normativo inicial de pilares concluído e incorporado antes da abertura do DIM-FUND-01" });
    }

    var secao = document.getElementById("roadmap");
    var grid = document.getElementById("roadmap-grid");
    if (!secao || !grid || !objetivos.length) return;

    var kicker = secao.querySelector(".section-kicker");
    var titulo = secao.querySelector("h2");
    var nota = secao.querySelector(".section-note");
    if (kicker) kicker.textContent = "Feito → agora → próximos passos";
    if (titulo) titulo.textContent = "Linha real de execução";
    if (nota) nota.textContent = "A sequência abaixo separa a base estrutural já incorporada do plano funcional que está sendo executado agora. Ela acompanha os mesmos 10 objetivos usados no progresso do bloco ativo.";

    var html = '<div class="execution-plan-group">' +
      '<div class="execution-plan-head"><h3>Base estrutural já incorporada</h3><p>Blocos concluídos antes do plano funcional atual. Permanecem como fundação técnica do trabalho em andamento.</p></div>' +
      '<div class="execution-plan-grid">' + historico.map(cardHistorico).join("") + '</div>' +
    '</div>' +
    '<div class="execution-plan-group">' +
      '<div class="execution-plan-head"><h3>Plano funcional atual · ' + esc(current.code || "bloco ativo") + '</h3><p>Os quatro primeiros itens já foram entregues. O primeiro item não concluído é o trabalho em execução; os demais seguem na ordem planejada.</p></div>' +
      '<div class="execution-plan-grid current-plan">' + objetivos.map(cardPlano).join("") + '</div>' +
    '</div>';

    grid.classList.add("execution-plan");
    grid.dataset.executionPlan = "1";
    grid.innerHTML = html;
  }

  function iniciar() {
    var grid = document.getElementById("roadmap-grid");
    var ultimoStatus = null;
    var aplicando = false;

    function aplicar() {
      if (!ultimoStatus || aplicando) return;
      aplicando = true;
      render(ultimoStatus);
      aplicando = false;
    }

    if (grid && typeof MutationObserver !== "undefined") {
      new MutationObserver(function () {
        if (!grid.dataset.executionPlan) aplicar();
      }).observe(grid, { childList:true, subtree:false });
    }

    fetch("status.json?v=" + Date.now(), { cache:"no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (status) {
        ultimoStatus = status;
        setTimeout(aplicar, 80);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once:true });
  else iniciar();
})();
