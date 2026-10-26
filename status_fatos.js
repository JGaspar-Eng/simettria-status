(function () {
  "use strict";

  // Renderiza docs/facts.json (gerado por scripts/gerar_status_fatos.py): para cada
  // frente, o que é fato em quatro camadas distintas: local, PR, main e publicado.
  // Fato não observado aparece como "sem evidência"; nada é inferido de outra camada.

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function urlSegura(url) {
    return /^https:\/\/github\.com\//.test(String(url || "")) ? String(url) : "";
  }

  function selo(texto, tom) {
    return '<span class="fatos-selo fatos-' + tom + '">' + esc(texto) + "</span>";
  }

  function sha7(sha) {
    return sha ? String(sha).slice(0, 7) : "";
  }

  function dia(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }

  function dataHora(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  }

  function seloCi(ci) {
    if (ci === "passou") return selo("CI passou", "ok");
    if (ci === "falhou") return selo("CI falhou", "falha");
    if (ci === "pendente") return selo("CI pendente", "alerta");
    return selo("CI sem evidência", "neutro");
  }

  function link(url, texto) {
    var seguro = urlSegura(url);
    return seguro ? '<a href="' + esc(seguro) + '" rel="noopener">' + esc(texto) + "</a>" : esc(texto);
  }

  function celulaLocal(c) {
    var estado = (c && c.estado) || "sem_evidencia";
    if (estado === "nao_verificavel_em_ci") return selo("Não verificável no CI", "neutro");
    if (estado === "sem_branch") return selo("Sem branch local", "neutro");
    if (estado === "com_branch") {
      var itens = (c.itens || []).slice(0, 3).map(function (i) {
        return '<div class="fatos-linha">' + esc(i.repositorio) + " · " + esc(i.branch) + " " + esc(sha7(i.sha)) + (i.rastro ? " " + esc(i.rastro) : "") + "</div>";
      }).join("");
      return selo((c.itens || []).length + " branch(es) local(is)", "alerta") + itens;
    }
    return selo("Sem evidência", "alerta");
  }

  function celulaPr(c) {
    var estado = (c && c.estado) || "sem_evidencia";
    if (estado === "nenhum") return selo("Nenhum PR aberto", "neutro");
    if (estado === "nao_encontrado_na_janela") return selo("Não encontrado na janela consultada", "alerta");
    if (estado !== "aberto") return selo("Sem evidência", "alerta");
    var itens = c.itens || [];
    function linhaPr(p) {
      return '<div class="fatos-linha">' + link(p.url, "#" + p.numero) +
        " · " + (p.rascunho ? "rascunho" : "pronto") +
        " · CI do HEAD da PR: " + seloCi(p.ci) + "</div>";
    }
    var linhas = itens.slice(0, 4).map(linhaPr).join("");
    var resto = itens.length > 4
      ? '<details class="fatos-detalhes"><summary>Ver outros ' +
        (itens.length - 4) + ' PRs abertos</summary>' +
        itens.slice(4).map(linhaPr).join("") + '</details>' : "";
    return selo(itens.length + " PR(s) aberto(s)", "alerta") + linhas + resto;
  }

  function celulaMain(c) {
    var estado = (c && c.estado) || "sem_evidencia";
    if (estado === "nenhum") return selo("Nada integrado", "neutro");
    if (estado === "nao_encontrado_na_janela") return selo("Não encontrado na janela consultada", "alerta");
    if (estado !== "integrado") return selo("Sem evidência", "alerta");
    var partes = [selo("Integrado", "ok")];
    var recentes = Array.isArray(c.integrados_recentes) ? c.integrados_recentes : [];
    if (c.ultimo) {
      partes.push('<div class="fatos-linha">Última PR: ' +
        link(c.ultimo.url, "#" + c.ultimo.numero) + " · " +
        esc(dia(c.ultimo.merged_at)) + " · CI da PR: " +
        seloCi(c.ultimo.ci_pr || c.ultimo.ci) + "</div>");
    }
    if (recentes.length) {
      partes.push('<details class="fatos-detalhes"><summary>Ver ' +
        recentes.length + (c.total_integrados > recentes.length ? ' das ' +
        c.total_integrados : '') + ' entregas integradas recentes</summary>' +
        recentes.map(function(p) {
          return '<div class="fatos-linha">' +
            link(p.url, "#" + p.numero) + ' · ' + esc(p.titulo) +
            ' · ' + esc(dia(p.merged_at)) + ' · CI da PR: ' +
            seloCi(p.ci_pr) + ' · CI do merge: ' + seloCi(p.ci_merge) +
            '</div>';
        }).join("") + '</details>');
    }
    if (c.ultimo_commit) {
      partes.push('<div class="fatos-linha">Commit histórico da frente ' +
        esc(sha7(c.ultimo_commit.sha)) + " · " +
        esc(dia(c.ultimo_commit.data)) + " · CI daquele commit: " +
        seloCi(c.ultimo_commit.ci) + "</div>");
    }
    return partes.join("");
  }

  function celulaPublicado(c) {
    var estado = (c && c.estado) || "sem_evidencia";
    if (estado === "publicado") return selo("Publicado", "ok");
    if (estado === "aguardando_publicacao") return selo("Aguardando publicação", "alerta");
    if (estado === "nao_aplicavel") return selo("Não se aplica", "neutro");
    return selo("Sem evidência", "alerta");
  }
  var ESTILO =
    ".fatos-wrap{overflow-x:auto}" +
    ".fatos-tabela{width:100%;border-collapse:collapse;font-size:.88rem}" +
    ".fatos-tabela th,.fatos-tabela td{border:1px solid rgba(127,127,127,.35);padding:8px 10px;text-align:left;vertical-align:top}" +
    ".fatos-tabela th{font-weight:600}" +
    ".fatos-selo{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.78rem;font-weight:600;margin:0 2px 2px 0}" +
    ".fatos-ok{background:rgba(26,127,55,.16);color:#1a7f37}" +
    ".fatos-alerta{background:rgba(191,135,0,.18);color:#9a6700}" +
    ".fatos-falha{background:rgba(207,34,46,.16);color:#cf222e}" +
    ".fatos-neutro{background:rgba(127,127,127,.18)}" +
    ".fatos-linha{margin-top:4px;font-size:.82rem}" +
    ".fatos-aviso{margin:8px 0;padding:8px 12px;border:1px solid rgba(207,34,46,.5);background:rgba(207,34,46,.1);border-radius:6px;font-weight:600}" +
    ".fatos-detalhes{margin-top:8px;font-size:.79rem;max-width:480px}.fatos-detalhes>summary{cursor:pointer;color:#176a83;font-weight:700}.fatos-detalhes .fatos-linha{margin:6px 0;border-bottom:1px dashed rgba(127,127,127,.22);padding-bottom:5px}" +
    ".fatos-meta{margin:6px 0 10px;font-size:.85rem}";

  function montarHtml(fatos, agora, erroCarga) {
    if (!fatos) {
      return "<h2>Fatos por frente</h2>" +
        '<div class="fatos-aviso">Fatos por frente indisponíveis: ' + esc(erroCarga || "facts.json ausente") + ". Nenhuma situação é inferida.</div>";
    }
    var agoraMs = (agora instanceof Date ? agora : new Date()).getTime();
    var geradoMs = new Date(fatos.gerado_em).getTime();
    var horas = isNaN(geradoMs) ? null : (agoraMs - geradoMs) / 3600000;
    var limite = fatos.limite_horas || 6;
    var aviso = erroCarga
      ? '<div class="fatos-aviso">FALHA NA CONSULTA MAIS RECENTE: ' +
        esc(erroCarga) + ". Exibindo a última coleta válida, sem inferir atualização.</div>" : "";
    if (horas === null) aviso += '<div class="fatos-aviso">FATOS SEM DATA DE COLETA VÁLIDA</div>';
    else if (horas > limite) aviso += '<div class="fatos-aviso">FATOS DESATUALIZADOS: coletados há ' + Math.floor(horas) + " h (limite " + limite + " h)</div>";

    var pub = fatos.publicado;
    var meta = "Coletado em " + esc(dataHora(fatos.gerado_em)) + " · main " + esc(sha7(fatos.main && fatos.main.sha) || "sem evidência") +
      " · site publicado " + (pub ? esc(sha7(pub.sha)) + " (dados de " + esc(dataHora(pub.gerado_em)) +
        (pub.defasagem_commits_main === 0 ? ", igual à main" : pub.defasagem_commits_main > 0 ? ", " + pub.defasagem_commits_main + " commit(s) atrás da main" : "") + ")" : "sem evidência");

    var linhas = (fatos.frentes || []).map(function (f) {
      return "<tr><th scope=\"row\">" + esc(f.titulo) + '<div class="fatos-linha">' + esc(f.epico) + "</div></th>" +
        "<td>" + celulaLocal(f.local) + "</td><td>" + celulaPr(f.pr) + "</td><td>" + celulaMain(f.main) + "</td><td>" + celulaPublicado(f.publicado) + "</td></tr>";
    }).join("");

    var nc = fatos.nao_classificados || {};
    var ciAtual = fatos.ci_main_atual;
    var atual = '<div class="fatos-meta"><strong>CI do SHA atual da main ' +
      esc(sha7(fatos.main && fatos.main.sha)) + ':</strong> ' +
      seloCi(ciAtual) +
      ' · CI histórico de PRs/commits não informa o estado atual da main. ' +
      'Uma PR pode pertencer a mais de uma frente; não somar contagens.</div>';
    var explicacao = '<p class="fatos-meta">O percentual do roadmap mede ' +
      'somente trabalhos cadastrados como concluídos. PRs parciais ' +
      'integradas NÃO mudam o índice sem encerramento técnico documentado. ' +
      'PR aberta não é entrega; CI da PR, CI do merge e publicação são fontes distintas.</p>';
    var rodape = "";
    if ((nc.abertos || []).length) rodape += "<p class=\"fatos-meta\">PRs abertos sem frente associada: " + esc(nc.abertos.map(function (n) { return "#" + n; }).join(", ")) + ".</p>";
    if (fatos.prs_truncado || fatos.commits_main_truncado) rodape += '<p class="fatos-meta">Atenção: a janela consultada foi truncada; ausências podem não ser reais.</p>';
    if ((fatos.erros || []).length) rodape += '<p class="fatos-meta">Camadas sem evidência nesta coleta: ' + esc(fatos.erros.join(" | ")) + "</p>";
    if ((fatos.limitacoes || []).length) rodape += "<details><summary>Limitações</summary><ul>" + fatos.limitacoes.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></details>";

    return "<h2>Fatos por frente</h2>" + aviso +
      '<div class="fatos-meta">' + meta + "</div>" + atual + explicacao +
      '<div class="fatos-wrap"><table class="fatos-tabela"><thead><tr><th>Frente</th><th>Local</th><th>PR</th><th>main</th><th>Publicado</th></tr></thead><tbody>' + linhas + "</tbody></table></div>" + rodape;
  }

  function instalar(fatos, erroCarga) {
    if (typeof document === "undefined") return;
    if (!document.getElementById("status-fatos-style")) {
      var style = document.createElement("style");
      style.id = "status-fatos-style";
      style.textContent = ESTILO;
      document.head.appendChild(style);
    }
    var secao = document.getElementById("fatos-frentes");
    if (!secao) {
      secao = document.createElement("section");
      secao.id = "fatos-frentes";
      var alvo = document.getElementById("roadmap");
      if (alvo && alvo.parentNode) alvo.parentNode.insertBefore(secao, alvo);
      else (document.querySelector("main") || document.body).appendChild(secao);
    }
    var html = montarHtml(fatos, new Date(), erroCarga);
    if (secao.innerHTML !== html) secao.innerHTML = html;
  }

  // A tabela de fatos possui fonte e cadência próprias. A consulta única
  // inicial a deixava congelada em abas abertas, apesar de status.json
  // atualizar o resto da interface. Jamais ocultar defasagem real do Pages.
  var ultimaColetaValida = null;
  var consultaEmCurso = null;
  var ultimoShaRecebidoDoStatus = null;
  var INTERVALO_MS = 60000;

  function carregar() {
    if (consultaEmCurso) return consultaEmCurso;
    consultaEmCurso = fetch("facts.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (fatos) {
        if (!fatos || !fatos.gerado_em || !fatos.main ||
          !Array.isArray(fatos.frentes))
          throw new Error("facts.json sem campos de coleta obrigatórios");
        ultimaColetaValida = fatos;
        instalar(fatos);
        return true;
      })
      .catch(function (erro) {
        // Se a rede falhar, não apagar os últimos fatos conhecidos nem
        // fabricar estados "Publicado"/"Integrado" a partir de outro JSON.
        instalar(ultimaColetaValida, String(erro && erro.message || erro));
        return false;
      })
      .finally(function () { consultaEmCurso = null; });
    return consultaEmCurso;
  }

  var api = { montarHtml: montarHtml, instalar: instalar, carregar: carregar };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.SimettriaStatusFatos = api;
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", carregar, { once: true });
    else carregar();

    if (typeof window.setInterval === "function")
      window.setInterval(function () {
        if (!document.hidden) carregar();
      }, INTERVALO_MS);
    if (typeof document.addEventListener === "function")
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) carregar();
      });
    if (typeof window.addEventListener === "function") {
      window.addEventListener("focus", function () {
        if (!document.hidden) carregar();
      });
      window.addEventListener("simettria:status", function (evento) {
        var sha = evento && evento.detail && evento.detail.head &&
          evento.detail.head.sha;
        if (sha && sha !== ultimoShaRecebidoDoStatus) {
          ultimoShaRecebidoDoStatus = sha;
          carregar();
        }
      });
    }
  }
})();