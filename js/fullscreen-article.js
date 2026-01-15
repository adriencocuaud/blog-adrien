// Fullscreen Article - Expansion plein écran
(function() {
    const fullscreen = document.getElementById('fullscreenArticle');

    // Flip 3D pour les book-card (toujours actif)
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });

    // Le reste ne s'exécute que si fullscreen existe
    if (!fullscreen) return;

    const fullscreenBg = fullscreen.querySelector('.fullscreen-bg');
    const fullscreenTitle = fullscreen.querySelector('.fullscreen-title');
    const fullscreenText = fullscreen.querySelector('.fullscreen-text');

    // Ouvrir le fullscreen au clic sur une carte article
    document.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => openFullscreen(card));
    });

    function openFullscreen(card) {
        const img = card.querySelector('.card-bg');
        const title = card.querySelector('.article-content h3');
        const paragraphs = card.querySelectorAll('.article-content p');

        fullscreenBg.src = img.src;
        fullscreenTitle.textContent = title.textContent;

        fullscreenText.innerHTML = '';
        paragraphs.forEach(p => {
            const newP = document.createElement('p');
            newP.innerHTML = p.innerHTML;
            fullscreenText.appendChild(newP);
        });

        fullscreen.classList.add('active');
        document.body.classList.add('fullscreen-open');
        fullscreen.scrollTop = 0;
    }

    function closeFullscreen() {
        fullscreen.classList.remove('active');
        document.body.classList.remove('fullscreen-open');
    }

    fullscreen.addEventListener('click', closeFullscreen);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fullscreen.classList.contains('active')) {
            closeFullscreen();
        }
    });
})();
