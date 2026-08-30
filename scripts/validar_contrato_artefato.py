"""Contrato do artefato publicado do painel de status.

Este validador roda no workflow Deploy Pages antes do upload. Ele existia como
heredoc dentro do YAML; foi extraído para cá porque um guard que decide se o
painel é publicado precisa ser testável — e o defeito abaixo passou justamente
por não haver como exercitá-lo.

O QUE DEU ERRADO (issue JGaspar-Eng/simettria#231, frente painel-status-deploy-219)

    if html.count("status_areas.js") != 1: ...
    if html.index("status_areas.js") > html.index("status_sequence.js"): ...

Duplicação e ordem são propriedades das TAGS `<script src>`, não do texto do
arquivo. Contar sobre o HTML bruto tratava uma menção em comentário como se
fosse uma segunda tag. Quando o index.html ganhou comentários citando os nomes
dos módulos, o deploy travou por quatro execuções seguidas — enquanto as tags
estavam corretas o tempo todo: uma de cada, na ordem certa.

O sintoma foi pior que um CI vermelho: o repositório de origem ficava verde, o
sync copiava o arquivo novo, e o painel público continuava servindo a versão
anterior. Publicação parada sem nenhum sinal do lado de quem editou.

A detecção de duplicação VERDADEIRA — duas tags do mesmo módulo — continua
valendo, agora sobre a lista extraída das tags.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

SCRIPTS_OBRIGATORIOS = ("status_areas.js", "status_sequence.js")

# Captura `src` de <script src="modulo.js"></script>, tolerando `?v=<sha>`.
PADRAO_SCRIPT = re.compile(
    r'<script\s+src="([^"?]+)(?:\?[^"]*)?"></script>', flags=re.IGNORECASE
)


class ContratoInvalido(Exception):
    """O artefato não pode ser publicado."""


def referencias_locais(html: str) -> list[str]:
    """Módulos locais referenciados por tag `<script src>`, na ordem do documento.

    Só olha tags. Menção em comentário, string ou texto não é referência.
    """
    refs = PADRAO_SCRIPT.findall(html)
    return [ref for ref in refs if not ref.startswith(("http://", "https://", "//"))]


def validar_contrato(html: str, raiz: Path | None = None) -> list[str]:
    """Valida o artefato. Levanta ContratoInvalido; devolve as referências locais.

    `raiz` habilita a checagem de existência em disco; omitir permite testar as
    regras de contrato sobre HTML sintético.
    """
    locais = referencias_locais(html)

    if raiz is not None:
        faltantes = [ref for ref in locais if not (raiz / ref).is_file()]
        if faltantes:
            raise ContratoInvalido(
                "Assets locais referenciados mas ausentes do artefato: "
                + ", ".join(faltantes)
            )

    ausentes = [m for m in SCRIPTS_OBRIGATORIOS if m not in locais]
    if ausentes:
        raise ContratoInvalido(
            "index.html não referencia todos os scripts obrigatórios: "
            + ", ".join(sorted(ausentes))
        )

    for modulo in SCRIPTS_OBRIGATORIOS:
        quantas = locais.count(modulo)
        if quantas != 1:
            raise ContratoInvalido(
                f"{modulo} deve ter exatamente uma tag <script src> no index.html "
                f"(encontradas: {quantas})"
            )

    if locais.index("status_areas.js") > locais.index("status_sequence.js"):
        raise ContratoInvalido(
            "status_areas.js deve carregar antes de status_sequence.js"
        )

    return locais


def validar_artefato(raiz: Path) -> list[str]:
    """Valida o diretório pronto para upload: HTML, JSON e assets."""
    html = (raiz / "index.html").read_text(encoding="utf-8")
    json.loads((raiz / "status.json").read_text(encoding="utf-8"))
    return validar_contrato(html, raiz)


if __name__ == "__main__":
    import sys

    destino = Path(sys.argv[1] if len(sys.argv) > 1 else "public")
    try:
        validar_artefato(destino)
    except ContratoInvalido as erro:
        raise SystemExit(str(erro))
    print("SIMETTRIA_STATUS_PAGES_ASSET_CONTRACT_OK")
