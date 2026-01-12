// Fullscreen Article - Expansion plein écran
(function() {
    const fullscreen = document.getElementById('fullscreenArticle');
    const fullscreenBg = fullscreen.querySelector('.fullscreen-bg');
    const fullscreenTitle = fullscreen.querySelector('.fullscreen-title');
    const fullscreenText = fullscreen.querySelector('.fullscreen-text');

    // Ouvrir le fullscreen au clic sur une carte (article ou livre)
    document.querySelectorAll('.article-card, .book-card').forEach(card => {
        card.addEventListener('click', () => openFullscreen(card));
    });

    function openFullscreen(card) {
        // Récupérer les données de la carte (article-card ou book-card)
        const img = card.querySelector('.card-bg, .book-cover');
        const title = card.querySelector('.article-content h3, .book-content h3');
        const paragraphs = card.querySelectorAll('.article-content p, .book-content p');

        // Remplir le fullscreen avec le contenu
        fullscreenBg.src = img.src;
        fullscreenTitle.textContent = title.textContent;

        // Vider et remplir le texte
        fullscreenText.innerHTML = '';
        paragraphs.forEach(p => {
            const newP = document.createElement('p');
            newP.innerHTML = p.innerHTML;
            fullscreenText.appendChild(newP);
        });

        // Activer le fullscreen
        fullscreen.classList.add('active');
        document.body.classList.add('fullscreen-open');

        // Reset scroll position
        fullscreen.scrollTop = 0;
    }

    function closeFullscreen() {
        fullscreen.classList.remove('active');
        document.body.classList.remove('fullscreen-open');
    }

    // Fermer au clic n'importe où
    fullscreen.addEventListener('click', closeFullscreen);

    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fullscreen.classList.contains('active')) {
            closeFullscreen();
        }
    });
})();
