// Sélectionner l'élément header
const headerImage = document.querySelector('.header-image');

// Intensité du mouvement (ajuste selon tes préférences)
const intensity = 15;

// Écouter les mouvements de souris
headerImage.addEventListener('mousemove', (e) => {
    // Obtenir les dimensions de l'élément
    const rect = headerImage.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculer la position de la souris par rapport au centre de l'élément
    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    // Calculer le déplacement en pourcentage
    const moveX = mouseX * intensity;
    const moveY = mouseY * intensity;

    // Appliquer la transformation sur background-position
    headerImage.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
});

// Réinitialiser quand la souris quitte la zone
headerImage.addEventListener('mouseleave', () => {
    headerImage.style.backgroundPosition = 'center';
});