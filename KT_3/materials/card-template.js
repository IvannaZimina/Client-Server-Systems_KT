// C03 Ex6 — ETTE ANTUD mall. Seda faili sa ei kirjuta.
//
// Märgend ja stiil on C02 teema. Loe ta siiski läbi: :host, pärimine (selle
// erijuht on kohandatud omadus var(--line)) ja ::part() on kolm meelega
// jäetud auku varjus-DOM-i isolatsioonis.

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    /* Need reeglid EI ULATU välja ja lehe omad ei ulatu siia.
       :host on element ise; ta on ainus koht, kust välimus lekkida saab. */
    :host { display: block; container-type: inline-size; }
    :host([sold-out]) .card { opacity: .6; }
    .card { border: 1px solid var(--line, #c7d2d8); border-radius: 4px;
             padding: .75rem 1rem; display: grid; gap: .25rem; }
    h3 { margin: 0; font-size: 1rem; }
    .meta { margin: 0; color: var(--text-2, #46555e); font-size: .875rem; }
    @container (min-width: 22rem) { .card { grid-template-columns: 1fr auto; } }
  </style>
  <article class="card">
    <h3><slot name="name">Nimeta sündmus</slot></h3>
    <p class="meta"><slot name="time"></slot></p>
    <button type="button" part="button">Vali kohad</button>
  </article>`;


export { TEMPLATE };
