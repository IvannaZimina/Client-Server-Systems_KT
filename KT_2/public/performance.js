
// C02 — Ülesanne 5: CSS-i jõudluse mõõtmine

const nest = document.querySelector("#nest");
const results = document.querySelector("#results");

const CARD_COUNT = 5000;
const SELECTOR_RUNS = 100;

// Kaartide loomine
function createCards() {
  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= CARD_COUNT; i++) {
    const card = document.createElement("div");
    card.className = "card";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = `Kaart ${i}`;

    const paragraph = document.createElement("p");
    paragraph.textContent = `Sündmuse kirjeldus ${i}.`;

    body.append(title, paragraph);
    card.append(body);
    fragment.append(card);
  }

  return fragment;
}

// 6–7. Paigutuse mõõtmine
function measureLayout(optimized) {
  nest.replaceChildren();
  nest.classList.toggle("optimized", optimized);

  const start = performance.now();

  nest.append(createCards());

  // Paigutuse arvutamise käivitamine.
  const height = nest.getBoundingClientRect().height;

  const end = performance.now();
  const elapsed = end - start;

  results.innerHTML = `
    <h3>${optimized ? "content-visibility: auto" : "Ilma optimeerimiseta"}</h3>
    <p>Kaarte: ${CARD_COUNT}</p>
    <p>Paigutuse aeg: <strong>${elapsed.toFixed(2)} ms</strong></p>
    <p>Loendi kõrgus: ${height.toFixed(2)} px</p>
  `;

  return elapsed;
}

// 8. Nelja selektori mõõtmine
function measureSelectors() {
  nest.replaceChildren();
  nest.classList.remove("optimized");
  nest.append(createCards());

  // Paigutuse lõpetamine enne selektorite mõõtmist.
  nest.getBoundingClientRect();

  const selectors = [
    ".card",
    "div",
    "* p",
    "#nest .card p"
  ];

  const rows = [];

  for (const selector of selectors) {
    let total = 0;
    let matches = 0;

    for (let i = 0; i < SELECTOR_RUNS; i++) {
      const start = performance.now();
      const elements = document.querySelectorAll(selector);
      const end = performance.now();

      total += end - start;
      matches = elements.length;
    }

    rows.push({
      selector,
      matches,
      average: total / SELECTOR_RUNS
    });
  }

  results.innerHTML = `
    <h3>Selektorite mõõtmine</h3>
    <p>Korduste arv: ${SELECTOR_RUNS}</p>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Selektor</th>
          <th>Leitud elemente</th>
          <th>Keskmine aeg (ms)</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td><code>${row.selector}</code></td>
            <td>${row.matches}</td>
            <td>${row.average.toFixed(4)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// Nuppude sündmused
document.querySelector("#measure-normal")
  .addEventListener("click", () => measureLayout(false));

document.querySelector("#measure-optimized")
  .addEventListener("click", () => measureLayout(true));

document.querySelector("#measure-selectors")
  .addEventListener("click", measureSelectors);
