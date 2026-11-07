// C06 Ex2 — ETTE ANTUD keha lugeja. Seda faili sa EI kirjuta.
//
// Voogudest tuleb juttu Ex5-s; siin on ta ainult selleks, et sinu server
// saaks POST-i vastu võtta. Vaata teda siiski läbi — ta näitab, mida
// `express.json()` ühe reaga ära teeb.
//
// ★ LAGI ON KOHUSTUSLIK. Ilma temata saadab ründaja lõputu keha ja server
//   sööb mälu täis. Express teeb sama (vaikimisi 100 kb).

export function readBody(req, { limit = 1e6 } = {}) {
  return new Promise((resolve, defer) => {
    let body = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > limit) {
        defer(Object.assign(new Error('Keha liiga suur'), { code: 413 }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', defer);
  });
}
