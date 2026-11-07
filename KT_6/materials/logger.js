// C06 Ex3 — ETTE ANTUD näidisvahevara. Seda faili sa EI kirjuta.
//
// Üks vahevara TÖÖNÄIDISENA: vaata, mis kuju tal on, ja kirjuta ülejäänud
// samasse kujju ise.
//
// ★ VAHEVARA ON LIHTSALT FUNKTSIOON (req, res, next). Kolm asja, mida ta
//   teha saab: midagi teha · req/res rikastada · ahela katkestada.
//
// ★ Aega EI SAA mõõta enne ja pärast next()-i: next() tagastab KOHE, mitte
//   pärast vastust. Vastuse lõppu kuulatakse res.on('finish').

export function logger(write = console.log) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      write(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)} ms`);
    });
    next();
  };
}
