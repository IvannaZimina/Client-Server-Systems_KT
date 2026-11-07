// C06 Ex4 — ETTE ANTUD protsessikaitsed. Seda faili sa EI kirjuta.
//
// ★ NEED EI OLE „VEAKÄSITLUS“. Nad on VIIMANE LOGIMISVÕIMALUS enne surma.
//   Protsess PEAB pärast püüdmata erindit lõppema: olek on määramata ja iga
//   järgmine päring võib anda vale vastuse. Taaskäivitamine on protsessihalduri
//   töö — sinu töö on SURRA VALJUSTI.

export function installProcessGuards({
  log = console.error, finish = (code) => process.exit(code), process: proc = process,
} = {}) {
  proc.on('uncaughtException', (err) => {
    log({ kind: 'uncaughtException', message: err.message, stack: err.stack });
    finish(1);
  });

  proc.on('unhandledRejection', (reason) => {
    log({ kind: 'unhandledRejection', message: String(reason?.message ?? reason) });
    finish(1);
  });
}
