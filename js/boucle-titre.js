// Configuration
const titles = [
    "À propos de moi",
    "Aventurier moderne",
    "Enseignant passionné",
    "Développeur curieux"
];

let currentIndex = 0;
const h1 = document.querySelector('.presentation-text h1');

// Fonction d'animation
function rotateTitle() {
    // Fade out avec glissement vers le haut
    h1.style.opacity = '0';
    h1.style.transform = 'translateY(-30px)';

    setTimeout(() => {
        // Changer le texte
        currentIndex = (currentIndex + 1) % titles.length;
        h1.textContent = titles[currentIndex];

        // Réinitialiser immédiatement la position à +30px (hors de la vue, en bas)
        h1.style.transition = 'none'; // désactive la transition temporairement
        h1.style.transform = 'translateY(30px)';

        // Forcer le reflow pour que le navigateur prenne en compte la nouvelle position
        h1.offsetHeight; // ne rien faire avec, juste forcer le recalcul

        // Puis activer à nouveau la transition pour le fade-in depuis le bas
        h1.style.transition = 'opacity 0.7s, transform 0.7s';
        h1.style.opacity = '1';
        h1.style.transform = 'translateY(0)';
    }, 500);
}

// Lancer l'animation toutes les 4 secondes
setInterval(rotateTitle, 5000);