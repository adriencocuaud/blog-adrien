// Âge calculé automatiquement - Section présentation
const birthDate = new Date(1991, 9, 18); // 18 octobre 1991 (mois 0-indexé)

function computeAge(from) {
    let age = from.getFullYear() - birthDate.getFullYear();
    const hasHadBirthday =
        from.getMonth() > birthDate.getMonth() ||
        (from.getMonth() === birthDate.getMonth() && from.getDate() >= birthDate.getDate());
    if (!hasHadBirthday) age--;
    return age;
}

const ageSpan = document.querySelector('.presentation-text .age');
if (ageSpan) {
    ageSpan.textContent = computeAge(new Date());
}
