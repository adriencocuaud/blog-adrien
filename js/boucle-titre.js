// Carrousel de titres - Section présentation
const titles = [
    "À propos de moi",
    "Aventurier moderne",
    "Enseignant passionné",
    "Développeur curieux"
];

let currentIndex = 0;
const h1 = document.querySelector('.presentation-text h1');

// Fonction d'animation avec clip-path
function rotateTitle() {
    // Masquer vers la droite
    h1.classList.remove('reveal-in');
    h1.classList.add('reveal-out');

    setTimeout(() => {
        // Changer le texte
        currentIndex = (currentIndex + 1) % titles.length;
        h1.textContent = titles[currentIndex];

        // Révéler depuis la gauche
        h1.classList.remove('reveal-out');
        h1.classList.add('reveal-in');
    }, 600);
}

// Démarrer le carrousel après un délai (le texte initial reste visible)
setTimeout(() => {
    setInterval(rotateTitle, 5000);
}, 5000);
