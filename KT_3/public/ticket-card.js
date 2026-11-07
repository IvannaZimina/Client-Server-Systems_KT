import { TEMPLATE } from "../materials/card-template.js";

// Ülesanne 6.1. Veebikomponendi klass
class TicketCard extends HTMLElement {
    // Ülesanne 6.4. Jälgitavad atribuudid
    static observedAttributes = ["sold-out"];

    // Ülesanne 6.5. Päriselt privaatsed väljad
    #button;
    #onClick;

    // Ülesanne 6.1. Shadow DOM-i loomine ja malli kloonimine
    constructor() {
        super();

        this.attachShadow({ mode: "open" }).append(
            TEMPLATE.content.cloneNode(true),
        );
    }

    // Ülesanne 6.3. Kuulaja lisamine elemendi ühendamisel DOM-iga
    connectedCallback() {
        this.#button = this.shadowRoot.querySelector("button");

        this.#onClick = () => {
            // Ülesanne 6.8. Kohandatud sündmuse saatmine Shadow DOM-ist välja
            this.#button.dispatchEvent(
                new CustomEvent("ticket-seatmap-request", {
                    bubbles: true,
                    composed: true,
                    detail: { eventId: this.dataset.eventId },
                }),
            );
        };

        this.#button?.addEventListener("click", this.#onClick);
        this.updateButton();
    }

    // Ülesanne 6.3. Kuulaja eemaldamine elemendi eemaldamisel DOM-ist
    disconnectedCallback() {
        if (this.#button && this.#onClick) {
            this.#button.removeEventListener("click", this.#onClick);
        }

        this.#button = null;
        this.#onClick = null;
    }

    // Ülesanne 6.4. Nupu uuendamine atribuudi muutumisel
    attributeChangedCallback() {
        this.updateButton();
    }

    // Ülesanne 6.4. Nupu oleku ja teksti uuendamine
    updateButton() {
        const button = this.#button ?? this.shadowRoot?.querySelector("button");

        if (!button) return;

        const soldOut = this.hasAttribute("sold-out");

        button.disabled = soldOut;
        button.textContent = soldOut ? "Välja müüdud" : "Vali kohad";
    }
}

// Ülesanne 6.1. Kohandatud elemendi registreerimine
customElements.define("ticket-card", TicketCard);

// Ülesanne 6.2. Mooduli käivitumise kontrollimine
console.info("ticket-card module loaded");
