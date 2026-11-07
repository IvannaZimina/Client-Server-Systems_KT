// C05 Ex4/Ex5 — ETTE ANTUD võltsitud fetch. Seda faili sa EI kirjuta.
//
// Miks ta olemas on: kordamise ja katkestamise reegleid EI SAA usaldusväärselt
// testida päris võrgu vastu — sa ei saa serverit käsu peale kolm korda
// kukkuma panna ja siis õnnestuma. Siin saad.
//
//   const f = fakeFetch([{ status: 503 }, { status: 503 }, { status: 200, body: [] }]);
//   await f('/api/events');   // 503
//   await f('/api/events');   // 503
//   await f('/api/events');   // 200
//
// f.calls sisaldab iga kutse url-i ja seadeid — nii saad kontrollida, MITU
// korda ja MILLISE viivitusega su kood päris päringu tegi.

class FakeResponse {
  constructor({ status = 200, body = null, headers = {}, text = null }) {
    this.status = status;
    this.ok = status >= 200 && status < 300;
    this.statusText = status === 200 ? 'OK' : 'Viga';
    this._body = body;
    this._text = text;
    this.headers = new Map(Object.entries(headers));
    this.headers.get = Map.prototype.get.bind(this.headers);
  }

  async json() {
    if (this._text !== null) return JSON.parse(this._text);   // viskab, kui katki
    return this._body;
  }

  async text() {
    return this._text ?? JSON.stringify(this._body);
  }
}

export function fakeFetch(plan) {
  let i = 0;
  const f = async (url, options = {}) => {
    f.calls.push({ url, options, at: Date.now() });
    const step = plan[Math.min(i, plan.length - 1)];
    i += 1;

    if (step.delay) await new Promise((r) => setTimeout(r, step.delay));

    // Katkestus: nagu päris fetch, lükkab tagasi signaali PÕHJUSEGA.
    // abort() ilma põhjuseta annab DOMException-i nimega AbortError;
    // abort(new Error('…')) annab selle sama Error-i, mitte AbortError-it.
    if (options.signal?.aborted) throw options.signal.reason;
    if (step.networkError) {
      const v = new TypeError('Failed to fetch');   // just nii ütleb brauser
      throw v;
    }
    return new FakeResponse(step);
  };
  f.calls = [];
  return f;
}

export { FakeResponse };
