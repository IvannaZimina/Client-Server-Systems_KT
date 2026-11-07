import { forView, readState, setState } from "./view.js";
import { draw } from "../materials/draw.js";
import { readLog } from "../materials/capture-tool.js";

// Ülesanne 4.3. Tegevused
const actions = {
    select(id) {
        const event = readState().events.find((item) => item.id === id);

        if (event && event.free > 0) {
            console.log("Selected event:", event);
        }
    },
};

// Otsingu viivituse taimer
let searchTimer;

// Ülesanne 4.1. Vaate uuendamine
function renderEvents() {
    const currentState = readState();
    const view = forView(currentState);

    draw(view.rows, currentState.loading ? "loading" : "ready");
}

// Ülesanded 4.1. ja 4.2. Delegeeritud click-kuulaja
function handleEventClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const item = button.closest("[data-id]");
    const id = Number(item?.dataset.id);
    const action = actions[button.dataset.action];

    if (item && Number.isInteger(id) && action) {
        action(id);
        console.log(readLog());
    }
}

// Ülesanded 4.6., 4.7. ja 4.8. Vormi submit
function handleSearchSubmit(event) {
    event.preventDefault();
    clearTimeout(searchTimer);

    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = Object.fromEntries(new FormData(form));

    setState({
        search: String(data.search ?? ""),
        sort: String(data.sort ?? "start"),
        dir: String(data.dir ?? "asc"),
    });

    renderEvents();
}

// Ülesanne 4.9. Input-kuulaja 250 ms viivitusega
function handleSearchInput(event) {
    const value = event.target.value;

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
        setState({ search: value });
        renderEvents();
    }, 250);
}

// Ülesanne 4.1. Kuulajate lisamine
export function initEvents() {
    const list = document.querySelector("#events");
    const form = document.querySelector("#search");
    const input = document.querySelector("#search-text");
    const clear = document.querySelector("#clear");

    if (!list || !form || !input || !clear) return;

    list.addEventListener("click", handleEventClick);
    form.addEventListener("submit", handleSearchSubmit);
    input.addEventListener("input", handleSearchInput);

    clear.addEventListener("click", () => {
        clearTimeout(searchTimer);

        setState({
            search: "",
            sort: "start",
            dir: "asc",
        });

        form.reset();
        renderEvents();
    });

    renderEvents();
}
