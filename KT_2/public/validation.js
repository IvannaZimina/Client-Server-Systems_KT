
const form = document.querySelector('#purchase');

export function message(field) {
    const validity = field.validity;

    // 1. Kohustuslik väli
    if (validity.valueMissing) {
        return 'See väli on kohustuslik.';
    }

    // 2. Vale sisestusvorming
    if (validity.typeMismatch) {
        return 'Kontrolli kuju. Sisesta korrektne väärtus.';
    }

    // 3. Pattern ei vasta nõudele
    if (validity.patternMismatch) {
        if (field.id === 'phone') {
            return 'Kontrolli kuju. Näiteks +372 5123 4567.';
        }

        if (field.id === 'promo') {
            return 'Kontrolli kuju. Näiteks SOODUS-2026.';
        }

        return 'Kontrolli sisestatud väärtuse kuju.';
    }

    // 4. Liiga lühike tekst
    if (validity.tooShort) {
        return `Vähemalt ${field.minLength} tähemärki.`;
    }

    // 5. Liiga pikk tekst
    if (validity.tooLong) {
        return `Maksimaalselt ${field.maxLength} tähemärki.`;
    }

    // 6. Väärtus on väiksem kui lubatud
    if (validity.rangeUnderflow) {
        return `Väikseim väärtus on ${field.min}.`;
    }

    // 7. Väärtus on suurem kui lubatud
    if (validity.rangeOverflow) {
        return `Suurim väärtus on ${field.max}.`;
    }

    // 8. Samm ei vasta nõudele
    if (validity.stepMismatch) {
        return `Kasuta sammu ${field.step}.`;
    }

    // 9. Kohandatud viga
    if (validity.customError) {
        return field.validationMessage;
    }

    // 10. Muu brauseri tuvastatud viga
    if (!validity.valid) {
        return field.validationMessage || 'Kontrolli sisestatud väärtust.';
    }

    return '';
}

export function show(field) {
    const errorBox = document.getElementById(`${field.id}-error`);

    if (!errorBox) return;

    if (field.validity.valid) {
        errorBox.textContent = '';
        field.removeAttribute('aria-invalid');
        return;
    }

    errorBox.textContent = message(field);
    field.setAttribute('aria-invalid', 'true');
}

export function checkMatch(a, b) {
    if (a.value && b.value && a.value !== b.value) {
        b.setCustomValidity('E-posti aadressid ei kattu.');
    } else {
        b.setCustomValidity('');
    }

    // Uuendatakse juba nähtavat teadet ka siis,
    // kui muudetakse esimest e-posti välja.
    if (b.getAttribute('aria-invalid') === 'true') {
        show(b);
    }
}

// Vormi saatmise käsitleja
if (form) {
    const email = form.elements.email;
    const email2 = form.elements.email2;
    const status = document.querySelector('#form-status');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        checkMatch(email, email2);

        const fields = Array.from(form.elements).filter((field) =>
            field.id &&
            typeof field.checkValidity === 'function'
        );

        let firstInvalid = null;

        for (const field of fields) {
            show(field);

            if (!field.validity.valid && !firstInvalid) {
                firstInvalid = field;
            }
        }

        if (firstInvalid) {
            status.textContent = '';
            firstInvalid.focus();
        } else {
            status.textContent =
                'Vorm on kontrollitud. Serveriga ühendust ei looda.';
        }
    });
}
