// Configuration
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

// Animation au scroll (titre + cards)
const articlesTitle = document.querySelector('.articles-section h2');
const cards = document.querySelectorAll('.article-card');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Titre : animation clip-path
            if (entry.target.tagName === 'H2') {
                entry.target.classList.add('reveal-in');
            } else {
                entry.target.classList.add('visible');
            }
        }
    });
}, {
    threshold: 0.2
});

if (articlesTitle) observer.observe(articlesTitle);
cards.forEach(card => observer.observe(card));
