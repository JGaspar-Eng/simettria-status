(function () {
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c];
    });
  }
  function stateLabel(state) { return {completed:"CONCLUÍDO", in_progress:"EM EXECUÇÃO", planned:"PLANEJADO", pending:"PRÓXIMO"}[state] || "REGISTRADO"; }
  function card(item, index) {
    var state = item.state || "planned";
    var klass = state === "completed" ? "done" : (state === "in_progress" ? "active" : "planned");
    return '<article class="execution-card ' + klass + '"><div class="execution-card-index">' + String(index + 1).padStart(2, "0") + '</div>' +
      '<div class="execution-card-code">' + esc(item.code) + '</div><div class="execution-card-state ' + klass + '">' + esc(stateLabel(state)) + '</div>' +
      '<div class="execution-card-text">' + esc(item.title || item.text || "") + '</div>' + (item.source ? '<div class="execution-card-source">Fonte: ' + esc(item.source) + '</div>' : '') + '</article>';
  }
  function group(title, note, items) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<div class="execution-plan-group"><div class="execution-plan-head"><h3>' + esc(title) + '</h3><p>' + esc(note) + '</p></div><div class="execution-plan-grid">' + items.map(card).join("") + '</div></div>';
  }
  function checklistItem(item) {
    var state = item.state || "planned";
    var done = state === "completed";
    var active = state === "in_progress";
    var klass = done ? "done" : (active ? "active" : "planned");
    var marker = done ? "✓" : (active ? "●" : "○");
    return '<li class="execution-check-item ' + klass + '"><span class="execution-check-marker" aria-hidden="true">' + marker + '</span><span class="execution-check-code">' + esc(item.code || "") + '</span><span class="execution-check-text">' + esc(item.title || item.text || "") + '</span><span class="execution-check-state ' + klass + '">' + esc(stateLabel(state)) + '</span></li>';
  }
  function checklistGroup(checklist) {
    var items = checklist && checklist.items;
    if (!Array.isArray(items) || !items.length) return "";
    var done = items.filter(function (item) { return item.state === "completed"; }).length;
    var active = items.filter(function (item) { return item.state === "in_progress"; }).length;
    var progress = done + '/' + items.length + ' concluídos' + (active ? ' · ' + active + ' em execução' : '');
    return '<div class="execution-checklist"><div class="execution-checklist-head"><div><div class="execution-card-code">' + esc(checklist.code || "CHECKLIST") + '</div><h3>' + esc(checklist.title || "Checklist") + '</h3></div><div class="execution-checklist-progress">' + progress + '</div></div><ul class="execution-check-items">' + items.map(checklistItem).join("") + '</ul></div>';
  }
  function checklistSection(checklists) {
    if (!Array.isArray(checklists) || !checklists.length) return "";
    return '<div class="execution-plan-group execution-checklists"><div class="execution-plan-head"><h3>Checklist técnico e de integração</h3><p>O que já foi concluído e o que ainda falta antes da materialização e do detalhamento visual completo.</p></div>' + checklists.map(checklistGroup).join("") + '</div>';
  }
  function render(status) {
    var development = status && status.development || {};
    var execution = development.execution || {};
    var grid = document.getElementById("roadmap-grid");
    var section = document.getElementById("roadmap");
    if (!grid || !section) return;
    var kicker = section.querySelector(".section-kicker");
    var title = section.querySelector("h2");
    var note = section.querySelector(".section-note");
    if (!document.getElementById("status-sequence-style")) {
      var style = document.createElement("style"); style.id = "status-sequence-style";
      style.textContent = ".execution-plan{display:block}.execution-plan-group+ .execution-plan-group{margin-top:28px}.execution-plan-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:12px}.execution-plan-head h3{margin:0;font-size:16px}.execution-plan-head p{margin:0;max-width:620px;color:var(--muted);font-size:12px;line-height:1.5;text-align:right}.execution-plan-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.execution-card{min-height:150px;padding:18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}.execution-card.active{border-color:#86c7bf;background:#f5fbfa}.execution-card-index{color:var(--faint);font-family:var(--mono);font-size:10px;margin-bottom:12px}.execution-card-code{color:var(--blue);font-family:var(--mono);font-size:14px;font-weight:800;margin-bottom:8px}.execution-card-state{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:850;letter-spacing:.05em;margin-bottom:10px}.execution-card-state.done,.execution-check-state.done{background:#eaf8f0;color:#24724a}.execution-card-state.active,.execution-check-state.active{background:#e5f3f1;color:var(--accent)}.execution-card-state.planned,.execution-check-state.planned{background:#eef2f5;color:var(--muted)}.execution-card-text{color:var(--muted);font-size:12px;line-height:1.5}.execution-card-source{margin-top:12px;color:var(--faint);font:10px var(--mono);overflow-wrap:anywhere}.execution-checklist{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);padding:18px;margin-top:14px}.execution-checklist-head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:12px}.execution-checklist-head h3{margin:0;font-size:15px}.execution-checklist-progress{font:11px var(--mono);color:var(--muted);white-space:nowrap}.execution-check-items{list-style:none;margin:0;padding:0;display:grid;gap:8px}.execution-check-item{display:grid;grid-template-columns:20px minmax(72px,auto) 1fr auto;gap:9px;align-items:center;padding:9px 10px;border-radius:9px;background:var(--surface-2,rgba(127,127,127,.04));font-size:12px}.execution-check-marker{font-weight:900;text-align:center}.execution-check-item.done .execution-check-marker{color:#24724a}.execution-check-item.active .execution-check-marker{color:var(--accent)}.execution-check-item.planned .execution-check-marker{color:var(--faint)}.execution-check-code{font:10px var(--mono);font-weight:800;color:var(--blue)}.execution-check-text{color:var(--muted);line-height:1.4}.execution-check-state{padding:4px 7px;border-radius:999px;font-size:9px;font-weight:850;letter-spacing:.04em;white-space:nowrap}@media(max-width:960px){.execution-plan-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.execution-plan-head,.execution-checklist-head{display:block}.execution-plan-head p{text-align:left;margin-top:6px}.execution-plan-grid{grid-template-columns:1fr}.execution-checklist-progress{margin-top:8px}.execution-check-item{grid-template-columns:20px 72px 1fr}.execution-check-state{grid-column:3;margin-top:2px;justify-self:start}}";
      document.head.appendChild(style);
    }
    if (kicker) kicker.textContent = "Execução registrada";
    if (title) title.textContent = "Linha real de execução";
    if (note) note.textContent = "Sequência e checklists derivados do contrato de execução; plano e checkpoint permanecem separados.";
    grid.classList.add("execution-plan");
    grid.dataset.executionPlan = "1";
    grid.innerHTML = group("Atividade recente", "Trabalhos efetivamente registrados, inclusive atividades transversais.", execution.recent) +
      group("Em execução", "Itens ativos no estado real de desenvolvimento.", execution.active) +
      group("Concluído", "Trabalhos incorporados e mantidos como histórico de execução.", execution.completed) +
      group("Próxima etapa", "Próximos itens do contrato de execução, sem depender da posição no roadmap.", execution.next) +
      checklistSection(execution.checklists);
  }
  function iniciar() {
    var ultimoStatus = null;
    document.addEventListener("simettria:status", function (event) { ultimoStatus = event && event.detail; if (ultimoStatus) setTimeout(function () { render(ultimoStatus); }, 80); });
    fetch("status.json?v=" + Date.now(), {cache:"no-store"}).then(function (response) { if (!response.ok) throw new Error("HTTP " + response.status); return response.json(); }).then(function (status) { ultimoStatus = status; setTimeout(function () { render(ultimoStatus); }, 80); }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, {once:true}); else iniciar();
})();
