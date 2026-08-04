// Fullscreen Article - Expansion plein écran
(function() {
    const fullscreen = document.getElementById('fullscreenArticle');
    if (!fullscreen) return;

    const fullscreenBg = fullscreen.querySelector('.fullscreen-bg');
    const fullscreenTitle = fullscreen.querySelector('.fullscreen-title');
    const fullscreenText = fullscreen.querySelector('.fullscreen-text');

    // Ouvrir le fullscreen au clic sur une carte article ou détente
    document.querySelectorAll('.article-card, .detente-card').forEach(card => {
        card.addEventListener('click', () => openFullscreen(card));
    });

    function openFullscreen(card) {
        const img = card.querySelector('.card-bg');
        const title = card.querySelector('.article-content h3') || card.querySelector('h3');
        const paragraphs = card.querySelectorAll('.article-content p');

        // Affiche la miniature tout de suite, puis bascule sur la version
        // pleine définition (data-full) une fois celle-ci téléchargée
        fullscreenBg.src = img.src;
        const fullSrc = img.dataset.full;
        if (fullSrc && fullSrc !== img.src) {
            const loader = new Image();
            loader.onload = () => { fullscreenBg.src = fullSrc; };
            loader.src = fullSrc;
        }
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
