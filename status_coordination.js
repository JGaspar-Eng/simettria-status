(function () {
  "use strict";

  const URL = "coordination.json";
  const INTERVALO_MS = 30000;
  const STATUS_LABEL = {
    CLAIMED: "Assumida",
    IN_PROGRESS: "Em andamento",
    READY_FOR_REVIEW: "Pronta para revisão",
    REVIEWED: "Revisada",
    READY_FOR_USER_VISUAL_REVIEW: "Aguardando sua revisão visual",
    BLOCKED: "Bloqueada",
    MERGED: "Mergeada",
    DONE: "Concluída",
  };

  let ultimaGeracao = null;
  let consultaEmCurso = null;

  function el(tag, classe, texto) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texto != null) node.textContent = String(texto);
    return node;
  }

  function lista(titulo, itens, classe) {
    const bloco = el("div", "live-detail " + (classe || ""));
    bloco.appendChild(el("div", "live-detail-title", titulo));
    if (!itens || !itens.length) {
      bloco.appendChild(el("div", "live-empty", "—"));
      return bloco;
    }
    const ul = el("ul", "live-list");
    itens.forEach((item) => ul.appendChild(el("li", "", item)));
    bloco.appendChild(ul);
    return bloco;
  }

  function statusClasse(status) {
    if (status === "BLOCKED") return "blocked";
    if (status === "MERGED" || status === "DONE") return "done";
    if (status === "READY_FOR_USER_VISUAL_REVIEW") return "visual";
    if (status === "READY_FOR_REVIEW" || status === "REVIEWED") return "review";
    return "active";
  }

  function frontCard(front, compacto) {
    const card = el("article", "live-front-card " + statusClasse(front.status));
    const head = el("div", "live-front-head");
    const identidade = el("div", "live-front-identity");
    identidade.appendChild(el("div", "live-front-name", front.front));
    const meta = [];
    if (front.from) meta.push(front.from);
    if (front.pr && front.pr !== "NONE") meta.push(front.pr);
    if (front.head) meta.push(String(front.head).slice(0, 7));
    identidade.appendChild(el("div", "live-front-meta", meta.join(" · ") || "—"));
    head.appendChild(identidade);
    const pill = el("span", "live-status-pill", STATUS_LABEL[front.status] || front.status);
    pill.setAttribute("data-status", front.status || "");
    head.appendChild(pill);
    card.appendChild(head);

    if (compacto) {
      const resumo = (front.result || [])[0] || "Sem resumo técnico publicado.";
      card.appendChild(el("p", "live-summary", resumo));
      return card;
    }

    const detalhes = el("div", "live-details-grid");
    detalhes.appendChild(lista("Resultado atual", front.result || []));
    detalhes.appendChild(lista("CI / validação", front.ci || []));

    const proximos = [];
    (front.next_for_chatgpt || []).forEach((x) => {
      if (String(x).toUpperCase() !== "NONE") proximos.push("ChatGPT: " + x);
    });
    (front.next_for_claude || []).forEach((x) => {
      if (String(x).toUpperCase() !== "NONE") proximos.push("Claude: " + x);
    });
    detalhes.appendChild(lista("Próximos passos", proximos, "next"));

    const gaps = (front.suite_gaps || []).filter((x) => String(x).toUpperCase() !== "NONE");
    detalhes.appendChild(lista(front.status === "BLOCKED" ? "Bloqueios / lacunas" : "Lacunas de suíte", gaps, gaps.length ? "warning" : ""));
    card.appendChild(detalhes);

    const governanca = el("div", "live-governance");
    governanca.appendChild(el("span", "", "Visual: " + (front.visual_evidence || "—")));
    governanca.appendChild(el("span", "", "Sua aprovação: " + (front.user_visual_approval || "—")));
    governanca.appendChild(el("span", "", "Merge: " + (front.merge_policy || "—")));
    if (front.comment_url) {
      const link = el("a", "live-source-link", "ver registro #231");
      link.href = front.comment_url;
      link.target = "_blank";
      link.rel = "noreferrer";
      governanca.appendChild(link);
    }
    card.appendChild(governanca);
    return card;
  }

  function garantirEstrutura() {
    let section = document.getElementById("estado-vivo");
    if (section) return section;

    const style = document.createElement("style");
    style.textContent = `
      #estado-vivo{padding:44px 0;border-top:1px solid var(--border);background:linear-gradient(180deg,#f8fbfb 0,#f5f7f9 100%)}
      .live-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:20px}.live-head p{max-width:520px;margin:0;color:var(--muted);font-size:13px;line-height:1.55}
      .live-kicker{color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:7px}.live-title{margin:0;font-size:28px;letter-spacing:-.02em}
      .live-source-state{font-family:var(--mono);font-size:11px;color:var(--faint);margin-top:8px}
      .live-active-grid{display:grid;grid-template-columns:1fr;gap:14px}.live-front-card{background:var(--surface);border:1px solid var(--border);border-left:5px solid var(--accent);border-radius:12px;padding:19px 20px;box-shadow:0 3px 16px rgba(27,39,51,.04)}
      .live-front-card.blocked{border-left-color:var(--danger)}.live-front-card.done{border-left-color:var(--ok)}.live-front-card.visual{border-left-color:#9a681d}.live-front-card.review{border-left-color:var(--blue)}
      .live-front-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.live-front-name{font-size:16px;font-weight:800;overflow-wrap:anywhere}.live-front-meta{margin-top:5px;color:var(--faint);font-family:var(--mono);font-size:11px}
      .live-status-pill{flex:none;padding:5px 9px;border-radius:999px;background:var(--accent-soft);color:var(--accent-strong);font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.blocked .live-status-pill{background:var(--danger-soft);color:var(--danger)}.done .live-status-pill{background:var(--ok-soft);color:var(--ok)}.review .live-status-pill{background:var(--blue-soft);color:var(--blue)}.visual .live-status-pill{background:#fdf3df;color:#855817}
      .live-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.live-detail{padding:12px 14px;background:var(--surface-soft);border:1px solid var(--border);border-radius:9px}.live-detail.warning{background:var(--danger-soft)}.live-detail.next{background:var(--accent-soft)}
      .live-detail-title{font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:800;color:var(--muted);margin-bottom:7px}.live-list{margin:0;padding-left:17px;font-size:12.5px;line-height:1.5;color:var(--text)}.live-list li+li{margin-top:4px}.live-empty{font-size:12px;color:var(--faint)}
      .live-governance{display:flex;gap:12px;flex-wrap:wrap;margin-top:13px;color:var(--faint);font-size:10.5px;font-family:var(--mono)}.live-source-link{color:var(--blue);text-decoration:none}.live-source-link:hover{text-decoration:underline}
      .live-recent{margin-top:28px}.live-recent-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.live-recent-title{font-size:13px;font-weight:800}.live-recent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.live-recent-grid .live-front-card{padding:14px 15px}.live-summary{margin:10px 0 0;color:var(--muted);font-size:12px;line-height:1.45}
      .live-error{padding:16px;border:1px solid #e8c6c6;background:var(--danger-soft);color:var(--danger);border-radius:10px;font-size:13px}
      @media(max-width:760px){.live-head{align-items:flex-start;flex-direction:column}.live-details-grid,.live-recent-grid{grid-template-columns:1fr}.live-front-head{flex-direction:column}.live-status-pill{align-self:flex-start}}
    `;
    document.head.appendChild(style);

    section = el("section");
    section.id = "estado-vivo";
    const wrap = el("div", "wrap");
    const head = el("div", "live-head");
    const left = el("div");
    left.appendChild(el("div", "live-kicker", "Execução real · issue #231"));
    left.appendChild(el("h2", "live-title", "O que está acontecendo agora"));
    left.appendChild(el("div", "live-source-state", "Carregando coordenação…"));
    head.appendChild(left);
    head.appendChild(el("p", "", "Esta seção lê o último estado canônico de cada frente. Ela mostra trabalho corrente, bloqueios e próximos passos sem depender do checkpoint ficar manualmente em dia."));
    wrap.appendChild(head);
    wrap.appendChild(el("div", "live-active-grid"));
    const recent = el("div", "live-recent");
    const recentHead = el("div", "live-recent-head");
    recentHead.appendChild(el("div", "live-recent-title", "Timeline recente das frentes"));
    recent.appendChild(recentHead);
    recent.appendChild(el("div", "live-recent-grid"));
    wrap.appendChild(recent);
    section.appendChild(wrap);

    const main = document.querySelector("main");
    if (main) main.appendChild(section);

    const nav = document.querySelector("nav.top");
    if (nav && !nav.querySelector('a[href="#estado-vivo"]')) {
      const link = el("a", "", "Agora");
      link.href = "#estado-vivo";
      nav.appendChild(link);
    }
    return section;
  }

  function render(data) {
    const section = garantirEstrutura();
    const source = section.querySelector(".live-source-state");
    const ativos = section.querySelector(".live-active-grid");
    const recentes = section.querySelector(".live-recent-grid");
    ativos.textContent = "";
    recentes.textContent = "";

    source.textContent = `#${data.source && data.source.issue ? data.source.issue : "231"} · ${data.summary ? data.summary.active : 0} frente(s) ativa(s) · snapshot ${formatarData(data.generated_at)}`;

    const active = Array.isArray(data.active) ? data.active : [];
    if (!active.length) {
      ativos.appendChild(el("div", "live-error", "Nenhuma frente ativa foi encontrada no último snapshot da coordenação."));
    } else {
      active.forEach((front) => ativos.appendChild(frontCard(front, false)));
    }

    const recent = Array.isArray(data.recent) ? data.recent : [];
    recent.slice(0, 8).forEach((front) => recentes.appendChild(frontCard(front, true)));
  }

  function formatarData(iso) {
    const d = new Date(iso || "");
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function erro(mensagem) {
    const section = garantirEstrutura();
    const ativos = section.querySelector(".live-active-grid");
    if (!ativos.children.length) ativos.appendChild(el("div", "live-error", mensagem));
    section.querySelector(".live-source-state").textContent = "Coordenação indisponível; mantendo o restante do painel.";
  }

  function verificar() {
    if (consultaEmCurso) return consultaEmCurso;
    consultaEmCurso = fetch(`${URL}?v=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (data.schema_version !== "simettria.coordination-status/1.0.0") throw new Error("schema incompatível");
        if (data.generated_at !== ultimaGeracao) {
          render(data);
          ultimaGeracao = data.generated_at;
        }
        return data;
      })
      .catch((e) => {
        erro("Não foi possível carregar o estado vivo da #231: " + e.message);
        return null;
      })
      .finally(() => { consultaEmCurso = null; });
    return consultaEmCurso;
  }

  garantirEstrutura();
  verificar();
  setInterval(() => {
    if (!document.visibilityState || document.visibilityState === "visible") verificar();
  }, INTERVALO_MS);

  window.__simettriaCoordenacaoPainel = { verificar, intervaloMs: INTERVALO_MS };
})();
