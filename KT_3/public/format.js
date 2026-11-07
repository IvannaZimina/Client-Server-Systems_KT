// public/format.js

// Ülesanne 1 — freeText()
export function freeText(free = 0) {
    if (typeof free !== "number" || !Number.isFinite(free)) {
        return "vigane sisend";
    }

    if (free === 0) {
        return "välja müüdud";
    }

    if (free > 0) {
        return `${free} vaba`;
    }

    return "vigane sisend";
}

// Ülesanne 1 — price()
export function price(tier = "standard", qty = 1, ...extras) {
    const priceTiers = {
        standard: 10,
        vip: 25,
        child: 5,
    };

    if (!Object.hasOwn(priceTiers, tier)) {
        throw new RangeError(`Unknown price tier: ${tier}`);
    }

    let total = priceTiers[tier] * qty;

    for (const extra of extras) {
        if (typeof extra === "number") {
            total += extra;
        }
    }

    return total;
}

// Ülesanne 1 — withVat()
export function withVat(sum = 0, vatRate = 0.22) {
    return sum * (1 + vatRate);
}

// Ülesanne 1 — createCart()
export function createCart() {
    const rows = [];

    return {
        add(item) {
            rows.push(item);
        },

        getRows() {
            return [...rows];
        },

        getCount() {
            return rows.length;
        },
    };
}

// Ülesanne 1 — seatLabel() (ette antud funktsioon)
export function seatLabel(row = 1, nr = 1, separator = "-") {
    return `Rida ${row}${separator}Nr ${nr}`;
}
