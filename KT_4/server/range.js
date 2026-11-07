// C04 Ex6 — ETTE ANTUD Range-päise lahtivõtja. Seda faili sa ei kirjuta:
// kopeeri ta server/ kausta ja ehita tema peale rangeHeaders ja rangeBody.
//
// Kolm kuju, mida server peab tundma:
//     bytes=0-499     esimesed 500 baiti
//     bytes=500-      alates 500-ndast kuni lõpuni
//     bytes=-500      VIIMASED 500 baiti  (miinus ei ole „kuni“)
//
// Tagastab { kind: 'whole' | 'partial' | 'invalid', length } ja osalise
// sisu korral ka start ning end (kaasa arvatud). length on BAITIDES.
export function range(rangeHeader, length) {
  if (!rangeHeader) return { kind: 'whole', length };

  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m || (m[1] === '' && m[2] === '')) return { kind: 'invalid', length };

  let start;
  let end;
  if (m[1] === '') {
    const last = Number(m[2]);
    if (last === 0) return { kind: 'invalid', length };
    start = Math.max(0, length - last);        // kärbi, kui küsiti üle
    end = length - 1;
  } else {
    start = Number(m[1]);
    // Liiga suurt LÕPPU ei lükata tagasi, vaid KÄRBITAKSE (RFC 9110).
    // Liiga suur ALGUS on aga päris viga -> 416.
    end = Math.min(m[2] === '' ? length - 1 : Number(m[2]), length - 1);
  }

  if (start >= length || start > end) return { kind: 'invalid', length };
  return { kind: 'partial', start, end, length };
}
