// C02 Ex2 — ETTE ANTUD liides. Seda faili sa ei kirjuta.
//
// Ta seob sündmused ja kutsub SINU funktsioone failist validation.js.
// Loe ta läbi: siin on näha, MILLAL teade tekib (blur) ja MILLAL ta kaob
// (input) — ja miks see järjekord loeb.

import { show, checkMatch } from '../..public/validation.js';

const form = document.querySelector('#purchase');
const email = form.elements.email;
const email2 = form.elements.email2;
const checkPair = () => checkMatch(email, email2);

// ── kuulajad ─────────────────────────────────────────────────────────────
// input: teade KAOB kohe, kui viga on parandatud
// blur:  teade TEKIB alles siis, kui väljalt lahkutakse
//
// ★ Miks mitte teadet kohe kirjutamise ajal näidata: „Kontrolli kuju“ ilmuks
//   juba esimese tähe peale, kui aadress ei ole veel valmis. Sama loogika on
//   CSS-i :user-invalid taga — tema ei värvi välja enne, kui kasutaja on
//   sellega päriselt tegelenud.
for (const field of form.elements) {
  if (!field.id || field.type === 'submit' || field.type === 'reset') continue;

  field.addEventListener('blur', () => {
    if (field === email2 || field === email) checkPair();
    show(field);
  });

  field.addEventListener('input', () => {
    if (field === email2 || field === email) checkPair();
    if (field.getAttribute('aria-invalid') === 'true') show(field); // ainult parandus
  });
}

// Saatmise käsitleja (submit) ei ole siin: see on SINU töö validation.js-is.

form.addEventListener('reset', () => {
  for (const field of form.elements) {
    if (!field.id) continue;
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    const box = document.querySelector(`#${field.id}-error`);
    if (box) box.textContent = '';
  }
});
