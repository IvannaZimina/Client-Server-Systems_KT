// C06 — ETTE ANTUD veakäsitleja mähis. Seda faili sa ei kirjuta.
//
// ★ MIKS SEE SINULE ANTAKSE. Expressi veakäsitleja PLUMBING on igas
//   rakenduses ühesugune ja loeng 6 näitas ta juba läbi: NELI parameetrit
//   (Express tunneb ta ära ariteedi järgi) ja `res.headersSent` kontroll.
//   Sinu töö ei ole see mähis, vaid OTSUS tema sees: mis koodi ja mis keha
//   üks viga väärib. See otsus tuleb sinu käest funktsioonina.
//
// ★ MIKS headersSent SIIN ON. Kui vastus on juba teele pandud, ei saa
//   staatust enam muuta — `res.status()` oleks siis vaikne eimiski ja
//   klient jääks rippuma. Ainus õige tegu on anda viga Expressi enda
//   viimasele käsitlejale, kes ühenduse katkestab.
//
//   Mõõda see ise ära: saada vastus ja VISKA SIIS viga (Ex4).

/**
 * @param {(err: Error, conditions: {requestId: string, route: string}) =>
 *          {code: number, body: object, logEntry: any}} response  SINU otsus
 * @param {Function} log
 */
export function errorHandler(response, log = console.error) {
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);

    const conditions = { requestId: req.id, route: `${req.method} ${req.originalUrl}` };
    const { code, body, logEntry } = response(err, conditions);

    log(logEntry);
    return res.status(code).json(body);
  };
}

// Kõige lihtsam otsus: staatus vea pealt, 5xx-i sisu ei näidata kliendile.
// Ex3 kasutab teda, et ahel oleks terve; Ex4 kirjutab tema asemele oma.
export function simpleResponse(err, conditions) {
  const code = err.status ?? err.code ?? 500;
  return {
    code,
    body: {
      err: code >= 500 ? 'Serveri sisemine viga' : err.message,
      request: conditions.requestId,
    },
    logEntry: `[${conditions.requestId}] ${code} ${err.message}`,
  };
}
