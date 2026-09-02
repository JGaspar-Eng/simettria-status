"""Regressão do guard de publicação.

O caso central é a discriminação que faltava: uma MENÇÃO ao nome do módulo em
comentário não é uma tag duplicada. Foi exatamente essa confusão que parou o
deploy do painel por quatro execuções seguidas — o index.html tinha uma tag de
cada, na ordem certa, e dois comentários citando os nomes.

Executável sem dependências: `python tests/test_contrato_artefato.py`.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from validar_contrato_artefato import (  # noqa: E402
    ContratoInvalido,
    referencias_locais,
    validar_contrato,
)

TAGS_VALIDAS = (
    '<script src="status_areas.js"></script>\n'
    '<script src="status_sequence.js"></script>'
)


def html(corpo: str, tags: str = TAGS_VALIDAS) -> str:
    return f"<!doctype html><html><body>\n{corpo}\n{tags}\n</body></html>"


def recusa(documento: str) -> str:
    try:
        validar_contrato(documento)
    except ContratoInvalido as erro:
        return str(erro)
    raise AssertionError("o contrato deveria ter sido recusado, mas passou")


# --------------------------------------------------------------- o caso raiz
# Comentários citando os módulos NÃO são referências. Este é o defeito que
# travou a publicação: o guard antigo contava texto e via duplicata onde havia
# documentação.
documento = html(
    """<script>
  // status.json) sobre um DOM já enriquecido por status_areas.js, que remove a
  // (status_areas.js / status_sequence.js) que o DOM base foi reescrito.
</script>"""
)
assert referencias_locais(documento) == ["status_areas.js", "status_sequence.js"]
validar_contrato(documento)

# Menção em texto visível e em atributo também não conta.
validar_contrato(html('<p>carregamos status_areas.js e status_sequence.js</p>'))
validar_contrato(html('<div data-modulo="status_sequence.js"></div>'))

# --------------------------------------------- duplicação VERDADEIRA é pega
erro = recusa(
    html(
        "",
        '<script src="status_areas.js"></script>\n'
        '<script src="status_sequence.js"></script>\n'
        '<script src="status_areas.js"></script>',
    )
)
assert "status_areas.js" in erro and "encontradas: 2" in erro, erro

# Cache-busting não cria duplicata: `?v=<sha>` é a mesma referência.
validar_contrato(
    html(
        "",
        '<script src="status_areas.js?v=8274f8f"></script>\n'
        '<script src="status_sequence.js?v=8274f8f"></script>',
    )
)

# ------------------------------------------------------------------ ordem
erro = recusa(
    html(
        "",
        '<script src="status_sequence.js"></script>\n'
        '<script src="status_areas.js"></script>',
    )
)
assert "antes de" in erro, erro

# Um comentário citando os nomes em ordem invertida não pode inverter o veredito:
# a ordem é a das TAGS.
validar_contrato(
    html("<!-- primeiro status_sequence.js, depois status_areas.js -->")
)

# ------------------------------------------------------------- ausência
erro = recusa(html("", '<script src="status_areas.js"></script>'))
assert "status_sequence.js" in erro, erro

erro = recusa(html("<!-- status_areas.js e status_sequence.js -->", ""))
assert "não referencia todos os scripts obrigatórios" in erro, erro

# Script externo não satisfaz o contrato nem quebra a extração.
erro = recusa(
    html(
        "",
        '<script src="https://cdn.example.com/status_areas.js"></script>\n'
        '<script src="status_sequence.js"></script>',
    )
)
assert "status_areas.js" in erro, erro

# ------------------------------------------- o artefato real deste repositório
raiz = Path(__file__).resolve().parents[1]
publicado = (raiz / "index.html").read_text(encoding="utf-8")
locais = validar_contrato(publicado)
assert locais == [
    "status_areas.js",
    "status_sequence.js",
    "status_coordination.js",
], locais

print("SIMETTRIA_STATUS_CONTRATO_ARTEFATO_OK")
