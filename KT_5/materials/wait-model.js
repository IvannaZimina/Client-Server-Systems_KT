// C05 Ex4 — ETTE ANTUD ooteaja arvutus. Seda faili sa EI kirjuta.
//
// Kasvava ooteaja VALEM ja Retry-After lugemine on siin ette antud: nad on
// aritmeetika ja sõnetöö. Ex4 teema on OTSUS — mida tohib korrata, millal
// katkestada ja miks katkestus ei ole tõrge.
//
// ★ MIKS KASVAV. Sada klienti, kes kõik kordavad 100 ms pärast, koormavad
//   serverit TÄPSELT SAMAL HETKEL uuesti. Kasvav ooteaeg hajutab nad.
// ★ MIKS JUHUSLIKKUS (jitter). Ilma temata kordavad kõik ikka sünkroonis,
//   ainult harvemini. Juhuslik lisand lõhub rütmi.

export function waitTime(attempt, { base = 200, factor = 2, cap = 5000, jitter = 0 } = {}) {
  const clean = Math.min(base * factor ** (attempt - 1), cap);
  return Math.round(clean + (jitter ? Math.random() * jitter : 0));
}

// Retry-After võib olla sekundites VÕI kuupäevana. Server otsustab, mitte meie.
export function serverWait(response) {
  const p = response.headers?.get?.('Retry-After');
  if (!p) return null;
  if (/^\d+$/.test(p)) return Number(p) * 1000;
  const time = Date.parse(p);
  return Number.isNaN(time) ? null : Math.max(0, time - Date.now());
}
