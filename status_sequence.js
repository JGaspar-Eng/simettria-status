(function () {
  "use strict";
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function resumo(value, limite) {
    var text = String(value || "").replace(/\s+/g, " ").trim();
    var maximo = limite || 220;
    if (text.length <= maximo) return text;
    var ponto = text.lastIndexOf(" ", maximo);
    return text.slice(0, ponto > maximo * 0.55 ? ponto : maximo) + "…";
  }
  function stateLabel(state) {
    return {completed:"CONCLUÍDO",in_progress:"EM EXECUÇÃO",planned:"PLANEJADO",pending:"PRÓXIMO"}[state] || "REGISTRADO";
  }
  function bullets(items, className) {
    if (!Array.isArray(items) || !items.length) return "";
    return '<ul class="' + className + '">' + items.map(function (v) {
      return "<li>" + esc(v) + "</li>";
    }).join("") + "</ul>";
  }
  function entrega(item) {
    return '<article class="execution-delivery"><div class="execution-card-code">' + esc(item.code) + '</div>' +
      '<p>' + esc(resumo(item.title || item.text, 170)) + '</p>' +
      (String(item.title || "").length > 170 ? '<details class="execution-detail"><summary>Descrição integral</summary><p>' + esc(item.title) + '</p></details>' : '') +
      (item.source ? '<div class="execution-card-source">Fonte: ' + esc(item.source) + '</div>' : '') + '</article>';
  }
  function ativo(item, status, index) {
    var estado = "in_progress";
    var resumoAtivo = item.summary || resumo(item.title || item.text, 230);
    var registro = String(item.title || item.text || "");
    var commit = status && status.head || {};
    return '<article class="execution-active-card"><div class="execution-active-heading">' +
      '<div><div class="execution-kicker">FRENTE ATIVA ' + String(index+1).padStart(2,"0") + '</div>' +
      '<h4>' + esc(item.code) + '</h4></div>' +
      '<span class="execution-card-state active">' + esc(stateLabel(estado)) + '</span></div>' +
      '<p class="execution-summary">' + esc(resumoAtivo) + '</p>' +
      '<div class="execution-active-columns">' +
      '<div><h5>Entregas demonstradas</h5>' + (bullets(item.highlights, "execution-bullets") ||
        '<p>Consultar entregas recentes comprovadas no histórico abaixo.</p>') + '</div>' +
      '<div><h5>Bloqueios e dependências</h5>' + (bullets(item.blockers, "execution-bullets") ||
        '<p>Consultar as frentes planejadas e os checklists técnicos.</p>') + '</div></div>' +
      '<div class="execution-active-footer"><span>Versão publicada: <strong>' + esc(commit.short_sha || "—") + '</strong></span>' +
      '<span>' + esc(item.source || "Fontes técnicas versionadas") + '</span></div>' +
      (registro ? '<details class="execution-detail execution-history"><summary>Consultar histórico técnico integral</summary>' +
        '<div class="execution-history-body">' + esc(registro) + '</div></details>' : '') + '</article>';
  }
  function planejado(item, index) {
    return '<article class="execution-card planned"><div class="execution-card-index">' + String(index+1).padStart(2,"0") + '</div>' +
      '<div class="execution-card-code">' + esc(item.code) + '</div>' +
      '<div class="execution-card-state planned">' + esc(stateLabel(item.state || "planned")) + '</div>' +
      '<div class="execution-card-text">' + esc(item.title || item.text || "") + '</div>' +
      (item.source ? '<div class="execution-card-source">Fonte: ' + esc(item.source) + '</div>' : '') + '</article>';
  }
  function instalarEstilo() {
    if (document.getElementById("status-sequence-style")) return;
    var css = document.createElement("style");
    css.id = "status-sequence-style";
    css.textContent = `
.execution-plan{display:block;width:100%}
.execution-plan-group+.execution-plan-group{margin-top:28px}
.execution-plan-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}
.execution-plan-head h3{margin:0;font-size:18px}.execution-plan-head p{margin:0;max-width:600px;color:var(--muted);font-size:12px;line-height:1.5;text-align:right}
.execution-summary-strip{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.execution-summary-strip span{border:1px solid var(--border);padding:8px 12px;border-radius:9px;background:var(--surface);color:var(--muted);font-size:12px}
.execution-summary-strip strong{color:var(--text,#18222c)}
.execution-kicker{font:700 10px var(--mono);color:var(--faint);letter-spacing:.08em}
.execution-active-grid{display:grid;grid-template-columns:1fr;gap:14px}
.execution-active-card{width:100%;min-width:0;box-sizing:border-box;padding:22px 24px;border:1px solid var(--border);border-left:4px solid var(--danger);border-radius:var(--radius);background:var(--surface)}
.execution-active-heading{display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap}
.execution-active-heading h4{margin:6px 0 0;color:var(--blue);font-family:var(--mono);font-size:15px;overflow-wrap:anywhere}
.execution-card-state{display:inline-flex;width:max-content;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.04em}
.execution-card-state.active{background:var(--danger-soft);color:var(--danger)}
.execution-card-state.planned{background:#eef2f5;color:var(--muted)}
.execution-summary{max-width:960px;font-size:14px;line-height:1.65;color:var(--muted);margin:14px 0 16px}
.execution-active-columns{display:grid;grid-template-columns:1fr 1fr;gap:26px;border-top:1px solid var(--border);padding-top:14px}
.execution-active-columns h5{font-size:12px;color:var(--text,#18222c);margin:0 0 10px}
.execution-active-columns p{font-size:12px;color:var(--muted)}
.execution-bullets{margin:0;padding-left:18px;display:grid;gap:8px;color:var(--muted);font-size:12px;line-height:1.55}
.execution-active-footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-top:18px;font:11px var(--mono);color:var(--faint);overflow-wrap:anywhere}
.execution-detail{margin-top:12px;padding-top:12px;border-top:1px dashed var(--border);font-size:12px;color:var(--muted)}
.execution-detail>summary{cursor:pointer;color:var(--blue);font-size:12px;font-weight:700}
.execution-detail p{line-height:1.6}.execution-history-body{max-height:330px;overflow-y:auto;white-space:normal;overflow-wrap:anywhere;line-height:1.7;padding:14px;background:#f5f7f9;border-radius:8px;margin-top:10px}
.execution-commit-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:16px}.execution-commit{border:1px solid var(--border);padding:10px 12px;border-radius:8px;background:var(--surface);font-size:11px;color:var(--muted)}.execution-commit strong{color:var(--blue);font-family:var(--mono);margin-right:7px}.execution-delivery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.execution-delivery{padding:15px;border:1px solid var(--border);border-radius:10px;background:var(--surface);min-width:0}
.execution-delivery p{margin:8px 0;color:var(--muted);font-size:12px;line-height:1.5}
.execution-card-code{font:800 12px var(--mono);color:var(--blue);overflow-wrap:anywhere}
.execution-card-source{margin-top:12px;color:var(--faint);font:10px var(--mono);overflow-wrap:anywhere}
.execution-more{margin-top:10px}.execution-more>summary{cursor:pointer;color:var(--blue);font-weight:700;font-size:12px}
.execution-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.execution-card{padding:17px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);min-width:0}
.execution-card-index{font:11px var(--mono);color:var(--faint);margin-bottom:9px}
.execution-card .execution-card-state{margin:10px 0}
.execution-card-text{font-size:12px;line-height:1.55;color:var(--muted)}
.execution-empty{padding:18px;border:1px dashed var(--border);border-radius:var(--radius);color:var(--muted);font-size:12px;background:var(--surface)}
@media(max-width:960px){.execution-plan-grid,.execution-delivery-grid,.execution-commit-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.execution-plan-head{display:block}.execution-plan-head p{text-align:left;margin-top:7px}.execution-active-columns,.execution-plan-grid,.execution-delivery-grid,.execution-commit-list{grid-template-columns:1fr}.execution-active-card{padding:16px}.execution-summary-strip{gap:5px}}
`;
    document.head.appendChild(css);
  }
  function render(status) {
    var development = status && status.development || {};
    var execution = development.execution || {};
    var panel = execution.panel || {};
    var active = Array.isArray(execution.active) ? execution.active : (panel.active || []);
    var planned = Array.isArray(panel.planned) ? panel.planned : (execution.next || []);
    var recent = Array.isArray(execution.recent) ? execution.recent : [];
    var commits = Array.isArray(status?.commits) ? status.commits : [];
    var grid = document.getElementById("roadmap-grid");
    var section = document.getElementById("roadmap");
    if (!grid || !section) return;
    instalarEstilo();
    var kicker = section.querySelector(".section-kicker");
    var title = section.querySelector("h2");
    var note = section.querySelector(".section-note");
    if (kicker) kicker.textContent = "Painel operacional";
    if (title) title.textContent = "Linha real de execução";
    if (note) note.textContent = "Estado documentado, últimas entregas e próximos bloqueios. O histórico integral fica recolhido.";
    grid.classList.add("execution-plan");
    grid.dataset.executionPlan = "2";
    var resumoTopo = '<div class="execution-summary-strip">' +
      '<span><strong>' + active.length + '</strong> em execução</span>' +
      '<span><strong>' + planned.length + '</strong> próximas frentes</span>' +
      '<span><strong>' + recent.length + '</strong> registros recentes</span>' +
      '<span>main @ <strong>' + esc(status?.head?.short_sha || "—") + '</strong></span></div>';
    var ativas = '<div class="execution-plan-group"><div class="execution-plan-head"><h3>Em execução</h3><p>Etapa aberta e impedimentos explícitos.</p></div>' +
      (active.length ? '<div class="execution-active-grid">' + active.map(function (item,i) {return ativo(item,status,i);}).join("") + '</div>' : '<div class="execution-empty">Nenhuma frente ativa registrada.</div>') + '</div>';
    var mudancas = commits.slice(0,4).map(function(c) {
      return '<div class="execution-commit"><strong>' + esc(c.short_sha) + '</strong>' + esc(resumo(c.message,120)) + '</div>';
    }).join("");
    var entregas = '<div class="execution-plan-group"><div class="execution-plan-head"><h3>Últimas entregas documentadas</h3><p>O histórico de commits se atualiza a cada publicação. Commit isolado não significa aprovação estrutural.</p></div>' +
      (mudancas ? '<div class="execution-commit-list" data-execution-commits>' + mudancas + '</div>' : "") +
      (recent.length ? '<div class="execution-delivery-grid">' + recent.slice(0,4).map(entrega).join("") + '</div>' +
        (recent.length > 4 ? '<details class="execution-more"><summary>Ver outras ' + (recent.length-4) + ' entregas registradas</summary><div class="execution-delivery-grid" style="margin-top:12px">' + recent.slice(4).map(entrega).join("") + '</div></details>' : "") :
      '<div class="execution-empty">Sem entregas recentes registradas.</div>') + '</div>';
    var proximas = '<div class="execution-plan-group"><div class="execution-plan-head"><h3>Planejado</h3><p>Próximos trabalhos ainda não comprovados.</p></div>' +
      (planned.length ? '<div class="execution-plan-grid">' + planned.map(planejado).join("") + '</div>' : '<div class="execution-empty">Nenhuma frente planejada.</div>') + '</div>';
    grid.innerHTML = resumoTopo + ativas + entregas + proximas;
  }
  function iniciar() {
    // Fonte única: index.html consulta status.json a cada 60s, no foco e sob demanda.
    // Um segundo fetch concorrente aqui podia sobrescrever um estado mais novo.
    document.addEventListener("simettria:status", function(event) {
      if (event && event.detail) render(event.detail);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, {once:true}); else iniciar();
})();
