(function () {
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c];
    });
  }

  // Compatibilidade semântica histórica do renderer: "Atividade recente", "Próxima etapa", "PRÓXIMO".
  // O painel operacional vigente, porém, renderiza exclusivamente EM EXECUÇÃO e PLANEJADO.
  function stateLabel(state) {
    return {completed:"CONCLUÍDO", in_progress:"EM EXECUÇÃO", planned:"PLANEJADO", pending:"PRÓXIMO"}[state] || "REGISTRADO";
  }

  function card(item, index) {
    var state = item.state || "planned";
    var klass = state === "in_progress" ? "active" : "planned";
    return '<article class="execution-card ' + klass + '"><div class="execution-card-index">' + String(index + 1).padStart(2, "0") + '</div>' +
      '<div class="execution-card-code">' + esc(item.code) + '</div><div class="execution-card-state ' + klass + '">' + esc(stateLabel(state)) + '</div>' +
      '<div class="execution-card-text">' + esc(item.title || item.text || "") + '</div>' + (item.source ? '<div class="execution-card-source">Fonte: ' + esc(item.source) + '</div>' : '') + '</article>';
  }

  function group(title, note, items) {
    if (!Array.isArray(items) || !items.length) {
      return '<div class="execution-plan-group"><div class="execution-plan-head"><h3>' + esc(title) + '</h3><p>' + esc(note) + '</p></div><div class="execution-empty">Nenhuma frente.</div></div>';
    }
    return '<div class="execution-plan-group"><div class="execution-plan-head"><h3>' + esc(title) + '</h3><p>' + esc(note) + '</p></div><div class="execution-plan-grid">' + items.map(card).join("") + '</div></div>';
  }

  function instalarEstilo() {
    if (document.getElementById("status-sequence-style")) return;
    var style = document.createElement("style");
    style.id = "status-sequence-style";
    style.textContent = ".execution-plan{display:block}.execution-plan-group+ .execution-plan-group{margin-top:28px}.execution-plan-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:12px}.execution-plan-head h3{margin:0;font-size:16px}.execution-plan-head p{margin:0;max-width:620px;color:var(--muted);font-size:12px;line-height:1.5;text-align:right}.execution-plan-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.execution-card{min-height:150px;padding:18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.execution-card.active{border-color:#86c7bf;background:#f5fbfa}.execution-card-index{color:var(--faint);font-family:var(--mono);font-size:10px;margin-bottom:12px}.execution-card-code{color:var(--blue);font-family:var(--mono);font-size:14px;font-weight:800;margin-bottom:8px}.execution-card-state{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:850;letter-spacing:.05em;margin-bottom:10px}.execution-card-state.active{background:#e5f3f1;color:var(--accent)}.execution-card-state.planned{background:#eef2f5;color:var(--muted)}.execution-card-text{color:var(--muted);font-size:12px;line-height:1.5}.execution-card-source{margin-top:12px;color:var(--faint);font:10px var(--mono);overflow-wrap:anywhere}.execution-empty{padding:18px;border:1px dashed var(--border);border-radius:var(--radius);color:var(--muted);font-size:12px;background:var(--surface)}@media(max-width:960px){.execution-plan-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.execution-plan-head{display:block}.execution-plan-head p{text-align:left;margin-top:6px}.execution-plan-grid{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  }

  function render(status) {
    var development = status && status.development || {};
    var execution = development.execution || {};
    var panel = execution.panel || {active: execution.active || [], planned: execution.next || []};
    var grid = document.getElementById("roadmap-grid");
    var section = document.getElementById("roadmap");
    if (!grid || !section) return;

    instalarEstilo();

    var kicker = section.querySelector(".section-kicker");
    var title = section.querySelector("h2");
    var note = section.querySelector(".section-note");
    if (kicker) kicker.textContent = "Painel operacional";
    if (title) title.textContent = "Linha real de execução";
    if (note) note.textContent = "Somente frentes abertas. Trabalhos concluídos permanecem no histórico técnico e não aparecem neste painel.";

    grid.classList.add("execution-plan");
    grid.dataset.executionPlan = "1";
    grid.innerHTML = group("Em execução", "Frentes efetivamente ativas neste momento.", panel.active) +
      group("Planejado", "Próximas frentes ainda abertas, em ordem técnica de execução.", panel.planned);
  }

  function iniciar() {
    var ultimoStatus = null;
    document.addEventListener("simettria:status", function (event) {
      ultimoStatus = event && event.detail;
      if (ultimoStatus) setTimeout(function () { render(ultimoStatus); }, 80);
    });
    fetch("status.json?v=" + Date.now(), {cache:"no-store"})
      .then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); })
      .then(function (status) { ultimoStatus = status; setTimeout(function () { render(ultimoStatus); }, 80); })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, {once:true}); else iniciar();
})();
