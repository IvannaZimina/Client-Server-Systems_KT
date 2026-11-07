// public/stats.js

// Ülesanne 2.1. available()
export function available(events) {
    return events.filter((event) => event.seats - event.sold > 0);
}

// Ülesanne 2.1. findById()
export function findById(events, id) {
    return events.find((event) => event.id === id);
}

// Ülesanne 2.1. revenue()
export function revenue(events) {
    return events.reduce((total, event) => total + event.sold * event.price, 0);
}

// Ülesanne 2.1. anyFree()
export function anyFree(events) {
    return events.some((event) => event.seats - event.sold > 0);
}

// Ülesanne 2.1. allSoldOut()
export function allSoldOut(events) {
    if (!events || events.length === 0) {
        return false;
    }

    return events.every((event) => event.seats - event.sold <= 0);
}

// Ülesanne 2.2. list()
export function list(events) {
    return events.map((event) => {
        const freeSeats = event.seats - event.sold;
        const fillPercentage =
            event.seats > 0 ? Math.round((event.sold / event.seats) * 100) : 0;

        return {
            ...event,
            freeSeats,
            fillPercentage,
        };
    });
}

// Ülesanded 2.3., 2.4. ja 2.5. sortBy()
export function sortBy(rows, field, dir = "asc") {
    return [...rows].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];

        if (typeof valA === "string" && typeof valB === "string") {
            const comparison = valA.localeCompare(valB);

            if (comparison !== 0) {
                return dir === "asc" ? comparison : -comparison;
            }
        } else {
            if (valA < valB) return dir === "asc" ? -1 : 1;
            if (valA > valB) return dir === "asc" ? 1 : -1;
        }

        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;

        return 0;
    });
}

// Ülesanne 2.6. summary()
export function summary(event) {
    const {
        name: eventName,
        price: ticketPrice = 10,
        venue = "Unknown",
    } = event;

    return `${eventName} at ${venue} costs ${ticketPrice} EUR`;
}

// Ülesanne 2.7. organizerName()
export function organizerName(event) {
    return event?.organizer?.name ?? "Teadmata korraldaja";
}

// Ülesanne 2.7. seatsText()
export function seatsText(event) {
    const seatsCount = event?.seats ?? "?";
    return `${seatsCount} kohta`;
}

// Ülesanne 2.8. pack()
export function pack(data) {
    try {
        return JSON.stringify(data);
    } catch (error) {
        console.error("Packing error:", error);
        return null;
    }
}

// Ülesanne 2.8. unpack()
export function unpack(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
}
