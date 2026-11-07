// public/draft.js

// Ülesanne 5.1. Võtme ja versiooni määramine
const KEY = "piletikassa:draft";
const VERSION = 1;

// Ülesanne 5.2. Mustandi lugemine
// Vale versiooniga kirje kustutatakse ja tagastatakse null.
// Vigane JSON või keelatud hoidla tagastab samuti null.
export function read() {
    try {
        const raw = localStorage.getItem(KEY);

        if (raw === null) {
            return null;
        }

        const record = JSON.parse(raw);

        if (record?.version !== VERSION) {
            localStorage.removeItem(KEY);
            return null;
        }

        return record.data ?? null;
    } catch {
        return null;
    }
}

// Ülesanne 5.3. Mustandi salvestamine
// Andmed teisendatakse JSON-stringiks.
// Edu korral true, vea korral false.
export function save(data) {
    try {
        const record = {
            version: VERSION,
            data: data,
        };

        localStorage.setItem(KEY, JSON.stringify(record));
        return true;
    } catch {
        return false;
    }
}

// Ülesanne 5.3. Mustandi kustutamine
// Edu korral true, vea korral false.
export function remove() {
    try {
        localStorage.removeItem(KEY);
        return true;
    } catch {
        return false;
    }
}

// Ülesanded 5.1–5.3. Võtme ja versiooni eksportimine testimiseks.
export { KEY, VERSION };
