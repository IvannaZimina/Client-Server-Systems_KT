// C06 Ex1 — ETTE ANTUD semver-vahemik. Seda faili sa EI kirjuta.
//
// `^5.1.0` sõelumine on sõnetöö. Ex1 teema on see, MIDA npm nende märkidega
// LUBAB ja miks `npm ci` on ehituskonveieris ainus õige käsk.
//
//   ^5.1.0  lubab 5.x.x, kus x.x >= 1.0    (npm-i vaikeväärtus)
//   ~5.1.0  lubab 5.1.x, kus x >= 0
//   5.1.0   ainult täpselt see
//
// ★ ^ HOIAB PAIGAL ESIMESE NULLIST ERINEVA OSA, mitte alati esimest:
//   ^0.3.1  lubab 0.3.x, kus x >= 1        (0.x puhul võib iga minoor murda)
//   ^0.0.4  ainult 0.0.4

export function versionRange(deps, version) {
  const [a, b, c] = version.split('.').map(Number);
  const m = /^([\^~]?)(\d+)\.(\d+)\.(\d+)$/.exec(deps);
  if (!m) throw new RangeError(`Tundmatu nõue: ${deps}`);
  const [, kind, x, y, z] = m;
  const [X, Y, Z] = [Number(x), Number(y), Number(z)];
  if (kind === '^' && X > 0) return a === X && (b > Y || (b === Y && c >= Z));
  if (kind === '^' && Y > 0) return a === 0 && b === Y && c >= Z;
  if (kind === '^') return a === 0 && b === 0 && c === Z;
  if (kind === '~') return a === X && b === Y && c >= Z;
  return a === X && b === Y && c === Z;
}
