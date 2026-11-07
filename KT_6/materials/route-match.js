// C06 Ex2 — ETTE ANTUD teesobitus. Seda faili sa EI kirjuta.
//
// ★ VAATA TA LÄBI. Täpselt selle kirjutab Express sinu eest iga kord, kui sa
//   kirjutad `app.get('/api/events/:id', ...)`. Üksteist rida sõnetööd
//   ühe rea taga — ja see on ainult ÜKS asi, mida raamistik teeb.

export function match(pattern, route) {
  const m = pattern.split('/').filter(Boolean);
  const t = route.split('/').filter(Boolean);
  if (m.length !== t.length) return null;
  const params = {};
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].startsWith(':')) params[m[i].slice(1)] = decodeURIComponent(t[i]);
    else if (m[i] !== t[i]) return null;
  }
  return params;
}
