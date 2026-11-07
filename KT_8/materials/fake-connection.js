// C08 Ex2 — ETTE ANTUD võltsitud WebSocket-ühendus. Seda sa EI kirjuta.
//
// Päris ws-ühendust ei saa testis usaldusväärselt katkestada ega aeglustada.
// See võlts teeb mõlemat ja loeb, mis välja läks.
export function createFakeConnection(name = 'u') {
  const sent = [];
  const pings = [];
  return {
    name, open: true, bufferedAmount: 0,
    send(t) { sent.push(t); this.bufferedAmount += t.length; },
    ping() { pings.push(Date.now()); },
    close(code) { this.open = false; this.closeCode = code; },
    sent, pings,
  };
}
