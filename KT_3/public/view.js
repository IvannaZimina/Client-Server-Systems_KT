// public/view.js

// Ülesanne 3.1. Olek ühe objektina
let state = {
    events: [],
    sort: "name",
    dir: "asc",
    search: "",
    loading: false,
};

// Ülesanne 3.1. setState()
export function setState(changes) {
    state = { ...state, ...changes };
    return readState();
}

// Ülesanne 3.1. readState() — tagastab koopia
export function readState() {
    return structuredClone(state);
}

// Ülesanded 3.2. ja 3.3. forView()
export function forView(currentState) {
    let rows = [...currentState.events];

    // Otsing nime ja koha järgi
    const query = currentState.search.trim().toLowerCase();

    if (query !== "") {
        rows = rows.filter((event) => {
            const name = event.name?.toLowerCase() ?? "";
            const venue = event.venue?.toLowerCase() ?? "";

            return name.includes(query) || venue.includes(query);
        });
    }

    // Sorteerimine välja ja suuna järgi
    rows.sort((a, b) => {
        const valA = a[currentState.sort];
        const valB = b[currentState.sort];

        if (typeof valA === "string" && typeof valB === "string") {
            const comparison = valA.localeCompare(valB);
            return currentState.dir === "asc" ? comparison : -comparison;
        }

        if (valA < valB) {
            return currentState.dir === "asc" ? -1 : 1;
        }

        if (valA > valB) {
            return currentState.dir === "asc" ? 1 : -1;
        }

        return 0;
    });

    return {
        rows,
        state: currentState,
    };
}
