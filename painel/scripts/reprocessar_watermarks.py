# -*- coding: utf-8 -*-
"""Reprocessa as marcas d'água das fotos de imóveis com opacidade reforçada (0.45).

Para cada foto em imoveis_fotos: baixa o ORIGINAL do storage, aplica a logo
central (30% da largura, alpha 0.45), regrava o WebP de watermark no MESMO
caminho (URLs não mudam) e regenera o thumb 600x450 (marca 25%, mesmo alpha).

Reexecutável: mantém log de processados em reprocessar_watermarks.done.
"""
import json, os, sys, io, urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from PIL import Image

# Token de management via env (não commitar segredos):
#   set SUPABASE_PAT=sbp_...   (ou exporte antes de rodar)
PAT = os.environ.get('SUPABASE_PAT') or ''
if not PAT:
    sys.exit('Defina SUPABASE_PAT no ambiente antes de rodar.')
REF = 'mvzjqktgnwjwuinnxxcc'
URL = 'https://%s.supabase.co' % REF
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0'
BASE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.normpath(os.path.join(BASE, '..', 'src', 'assets', 'logo-watermark.png'))
DONE = os.path.join(BASE, 'reprocessar_watermarks.done')
OPACITY = 0.45
RATIO = 0.30
THUMB_W, THUMB_H = 600, 450

def mgmt(sql):
    r = urllib.request.Request('https://api.supabase.com/v1/projects/%s/database/query' % REF,
        data=json.dumps({'query': sql}).encode(), method='POST',
        headers={'Authorization': 'Bearer ' + PAT, 'User-Agent': UA, 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(r, timeout=90).read().decode())

def get_service_key():
    r = urllib.request.Request('https://api.supabase.com/v1/projects/%s/api-keys?reveal=true' % REF,
        headers={'Authorization': 'Bearer ' + PAT, 'User-Agent': UA})
    keys = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
    return next(k['api_key'] for k in keys if k['name'] == 'service_role')

SR = get_service_key()

def storage_download(path):
    r = urllib.request.Request(URL + '/storage/v1/object/imoveis/' + path,
        headers={'Authorization': 'Bearer ' + SR, 'apikey': SR})
    return urllib.request.urlopen(r, timeout=120).read()

def storage_upload(path, data, ctype):
    r = urllib.request.Request(URL + '/storage/v1/object/imoveis/' + path, data=data, method='POST',
        headers={'Authorization': 'Bearer ' + SR, 'apikey': SR,
                 'Content-Type': ctype, 'x-upsert': 'true'})
    urllib.request.urlopen(r, timeout=120).read()

def storage_list(prefix):
    r = urllib.request.Request(URL + '/storage/v1/object/list/imoveis',
        data=json.dumps({'prefix': prefix, 'limit': 1000}).encode(), method='POST',
        headers={'Authorization': 'Bearer ' + SR, 'apikey': SR, 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(r, timeout=60).read().decode())

logo = Image.open(LOGO).convert('RGBA')
# reforça: multiplica o canal alpha da logo pela opacidade alvo
a = logo.getchannel('A').point(lambda v: int(v * OPACITY))
logo.putalpha(a)

def aplicar(im, ratio):
    im = im.convert('RGB')
    w, h = im.size
    lw = max(1, int(w * ratio))
    lh = max(1, int(logo.height / logo.width * lw))
    lg = logo.resize((lw, lh), Image.LANCZOS)
    im_rgba = im.convert('RGBA')
    im_rgba.paste(lg, ((w - lw) // 2, (h - lh) // 2), lg)
    return im_rgba.convert('RGB')

def thumb_de(im):
    w, h = im.size
    sr, dr = w / h, THUMB_W / THUMB_H
    if sr > dr:
        sw = int(h * dr); sx = (w - sw) // 2
        im = im.crop((sx, 0, sx + sw, h))
    else:
        sh = int(w / dr); sy = (h - sh) // 2
        im = im.crop((0, sy, w, sy + sh))
    return im.resize((THUMB_W, THUMB_H), Image.LANCZOS)

feitos = set()
if os.path.exists(DONE):
    feitos = set(open(DONE, encoding='utf-8').read().split())

rows = mgmt("select id, imovel_id, url, url_watermark, url_thumb from imoveis_fotos where url_watermark is not null order by imovel_id")
print('fotos a avaliar:', len(rows))

# mapeia originais por pasta (pra achar a extensão certa)
orig_cache = {}
ok = skip = fail = 0
for i, row in enumerate(rows):
    marker = '/object/public/imoveis/'
    wm_url = row['url_watermark'] or ''
    if marker not in wm_url:
        skip += 1; continue
    wm_path = wm_url.split(marker, 1)[1].split('?')[0]
    if wm_path in feitos:
        skip += 1; continue
    # base: {imovel}/watermark/{ts}-{idx}.webp -> original {imovel}/original/{ts}-{idx}.*
    partes = wm_path.split('/')
    if len(partes) != 3:
        skip += 1; continue
    imovel_id, _, arquivo = partes
    base = arquivo.rsplit('.', 1)[0]
    pasta_orig = imovel_id + '/original'
    if pasta_orig not in orig_cache:
        try:
            orig_cache[pasta_orig] = {o['name'].rsplit('.', 1)[0]: o['name'] for o in storage_list(pasta_orig)}
        except Exception:
            orig_cache[pasta_orig] = {}
    nome_orig = orig_cache[pasta_orig].get(base)
    try:
        if nome_orig:
            fonte = storage_download(pasta_orig + '/' + nome_orig)
        else:
            # sem original correspondente: parte do próprio watermark antigo (marca fraca por baixo)
            fonte = storage_download(wm_path)
        im = Image.open(io.BytesIO(fonte))
        marcada = aplicar(im, RATIO)
        buf = io.BytesIO(); marcada.save(buf, 'WEBP', quality=88)
        storage_upload(wm_path, buf.getvalue(), 'image/webp')
        # thumb correspondente
        th_url = row.get('url_thumb') or ''
        if marker in th_url:
            th_path = th_url.split(marker, 1)[1].split('?')[0]
            th = aplicar(thumb_de(im), 0.25)
            buf2 = io.BytesIO(); th.save(buf2, 'WEBP', quality=80)
            storage_upload(th_path, buf2.getvalue(), 'image/webp')
        ok += 1
        with open(DONE, 'a', encoding='utf-8') as fdone:
            fdone.write(wm_path + '\n')
        if ok % 20 == 0:
            print('  %d/%d reprocessadas...' % (ok, len(rows)), flush=True)
    except Exception as e:
        fail += 1
        print('  FALHA %s: %s' % (wm_path, str(e)[:100]), flush=True)

print('FIM — reprocessadas: %d | puladas: %d | falhas: %d' % (ok, skip, fail))
