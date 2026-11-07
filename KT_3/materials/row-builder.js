// C03 Ex3 — ETTE ANTUD reaehitaja. Seda faili sa ei kirjuta.
//
// Ta näitab kolme asja, mida sa oma koodis kordad: textContent (mitte
// innerHTML), classList.toggle ja dataset. Sinu töö on OLEK ja JOONISTUS.

function row(s) {
  const li = document.createElement('li');
  li.className = 'row';
  li.dataset.id = s.id;                    // dataset -> data-id atribuut

  const name = document.createElement('h3');
  name.textContent = s.name;               // ohutu ka siis, kui nimi on "<b>"

  const meta = document.createElement('p');
  meta.textContent = `${s.start} · ${s.free} vaba kohta`;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.action = 'select';           // delegeerimine loeb SEDA (Ex4)
  btn.textContent = s.free > 0 ? 'Vali kohad' : 'Välja müüdud';
  btn.disabled = s.free === 0;

  // classList, mitte className: ei kustuta teisi klasse ära
  li.classList.toggle('full', s.free === 0);

  li.append(name, meta, btn);
  return li;
}


export { row };
