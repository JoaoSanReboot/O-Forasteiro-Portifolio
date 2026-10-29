#!/bin/bash
# Monta forasteiro.html (fragmento usado no artifact) e index.html (página completa para abrir no navegador ou publicar)
set -e
cd "$(dirname "$0")"
RIDER=$(base64 -w0 assets/forasteiro-costas.png)
PORTRAIT=$(base64 -w0 assets/retrato.png)
POSTER=$(base64 -w0 assets/retrato-cartaz.png)
{
  sed -e "s|__RIDER_PNG__|$RIDER|" -e "s|__PORTRAIT_PNG__|$PORTRAIT|" intro.src.html
  echo
  sed -e "s|__POSTER_PNG__|$POSTER|" site.html
  echo '<script>'
  python3 - <<'PY'
import base64
b=lambda f: base64.b64encode(open(f,'rb').read()).decode()
js=open('site.js').read()
for k,f in (('__LOGO_UKRA__','assets/ukra-logo.svg'),('__LOGO_JOSE__','assets/jose-image.svg'),('__LOGO_SHOGUN__','assets/shogunimage.png')):
    assert k in js, k
    js=js.replace(k,b(f))
print(js, end='')
PY
  echo '</script>'
} > forasteiro.html
{ printf '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>\n'; cat forasteiro.html; echo '</body></html>'; } > index.html
wc -c forasteiro.html
