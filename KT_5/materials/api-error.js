// C05 Ex5 — ETTE ANTUD ühtne viga-tüüp. Seda faili sa EI kirjuta.
//
// Klass ise on andmekandja. Ex5 teema on see, MIS TEDA TÄIDAB: kuidas iga
// erind (TypeError, SyntaxError, HTTP-kood) saab ühe kuju, mille kutsuja
// oskab lugeda ilma HTTP-d tundmata.
//
// ★ Kutsuja peab teadma kolme asja: kas korrata, mida kasutajale öelda, ja
//   mis tegelikult juhtus (logi jaoks).

export class ApiError extends Error {
  constructor(message, { kind = 'unknown', status = null, reason = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;     // network | server | client | format | timeout | abort
    this.status = status;
    this.reason = reason;             // algne erind, logimiseks
  }

  get repeatable() {
    return ['network', 'server', 'timeout'].includes(this.kind);
  }

  get forUser() {
    switch (this.kind) {
      case 'network': return 'Ühendus puudub. Kontrolli võrku.';
      case 'server': return 'Server ei vasta. Proovi hiljem uuesti.';
      case 'format': return 'Server saatis vigase vastuse.';
      case 'timeout': return 'Server ei vastanud õigeaegselt.';
      case 'abort': return null;          // ★ kutsuja ise katkestas: EI NÄIDATA
      default: return this.message;
    }
  }
}
