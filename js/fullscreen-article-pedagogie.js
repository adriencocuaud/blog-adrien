// Fullscreen Article - Pédagogie
(function() {
    const fullscreen = document.getElementById('fullscreenArticle');
    if (!fullscreen) return;

    const fullscreenIcon = fullscreen.querySelector('.fullscreen-icon');
    const fullscreenTitle = fullscreen.querySelector('.fullscreen-title');
    const fullscreenMatiere = fullscreen.querySelector('.fullscreen-matiere');
    const fullscreenText = fullscreen.querySelector('.fullscreen-text');

    // Ouvrir le fullscreen au clic sur une carte article
    document.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => openFullscreen(card));
    });

    function openFullscreen(card) {
        const icon = card.querySelector('.card-icon');
        const title = card.querySelector('.article-content h3');
        const matiere = card.getAttribute('data-matiere');
        const paragraphs = card.querySelectorAll('.article-content p:not(.summary)');

        fullscreenIcon.textContent = icon.textContent;
        fullscreenTitle.textContent = title.textContent;
        fullscreenMatiere.textContent = matiere;

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
