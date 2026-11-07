// C03 Ex1 — ETTE ANTUD mõõteriist. Seda faili sa ei kirjuta.
//
// Ta ei tee rakenduse jaoks midagi — ta ainult NÄITAB, mida keel teeb.
// Ennusta iga tulemus ENNE jooksutamist ja kirjuta ennustus üles.
//
//   node language-tool.js

// ── 1. ULATUS: let, const ja var ────────────────────────────────────────
// var on funktsiooni-ulatusega ja tõuseb (hoisting) deklaratsioonist ette;
// let ja const on ploki-ulatusega ja jäävad „ajalisse surnud tsooni“.
//
// ★ MIKS SELLES FAILIS on var, kui kursus ütleb „ära kasuta“. Sellepärast, et
//   see fail on MÕÕTERIIST: tema ainus töö on näidata, mida var teeb ja mille
//   poolest let temast erineb. Ilma var-ita ei ole siin midagi mõõta. Oma
//   lahenduses kirjutad const-i ja let-i.
export function scopeDemo(seats) {
  const readers = [];
  for (var i = 0; i < seats; i += 1) readers.push(() => i);   // KÕIK annavad seats
  const readers2 = [];
  for (let j = 0; j < seats; j += 1) readers2.push(() => j);  // igaüks annab OMA j
  return { var_: readers.map((f) => f()), let_: readers2.map((f) => f()) };
}

// ── 1b. ETTENIHE (hoisting): var TÕUSEB, let EI TÕUSE ──────────────
// var-deklaratsioon tõstetakse funktsiooni algusesse, AGA väärtus jääb kohale
// -> muutuja on olemas ja on `undefined`. let ja const tõstetakse ka, aga nad
// jäävad AJALISSE SURNUD TSOONI ja lugemine enne deklaratsiooni VISKAB.
export function hoisting() {
  const result = {};
  result.var_before = typeof price_;   // toimib: var on juba olemas
  var price_ = 18;
  result.var_after = price_;
  try {
    result.let_before = seats_;       // VISKAB: ajaline surnud tsoon
  } catch (err) {
    result.let_before = err.constructor.name;
  }
  let seats_ = 120;
  result.let_after = seats_;
  return result;
}

// ── 2. VÕRDLEMINE: == ja === ────────────────────────────────────────────
// Lõtv võrdlus teisendab tüüpi ENNE võrdlust ja annab üllatusi.
// Range võrdlus ei teisenda midagi. Kasuta alati ===.
export function comparisons() {
  return [
    ['0 == ""', 0 == ''],              // eslint-disable-line eqeqeq
    ['0 === ""', 0 === ''],
    ['"6" == 6', '6' == 6],            // eslint-disable-line eqeqeq
    ['null == undefined', null == undefined],  // eslint-disable-line eqeqeq
    ['null === undefined', null === undefined],
    ['NaN === NaN', NaN === NaN],
  ];
}


if (globalThis.process?.argv?.[1]?.includes('language-tool')) {
  console.log('scopeDemo(3):', scopeDemo(3));
  console.log('hoisting():', hoisting());
  console.log('comparisons():'); console.table(comparisons());
  console.log('prototypeChain():', prototypeChain());
}


// ★ PROTOTÜÜBIAHEL JA this. Klassipõhistes keeltes on klass TÜÜP.
//   JavaScriptis on ta OBJEKT, mille `prototype` on ahelas järgmine lüli.
//   `this` ei ole seotud definitsiooni, vaid KUTSEGA — meetodi eraldamine
//   katkestab seose. Mõõda mõlemat, ära usu mälu.
export function prototypeChain() {
  class Base { greet() { return "base"; } }
  class Child extends Base {}

  const card = { name: "VIP", getName() { return this.name; } };
  const detached = card.getName;          // meetod ILMA objektita

  let detachedResult;
  try { detachedResult = detached(); } catch (e) { detachedResult = e.constructor.name; }

  return {
    chain: Object.getPrototypeOf(Child.prototype) === Base.prototype,
    class_type: typeof Child,
    this_with_object: card.getName(),
    this_detached: detachedResult,
  };
}
