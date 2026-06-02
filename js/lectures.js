// Compteurs par année + couvertures (images/lectures/{slug}.jpg) + popup résumé
(function () {
    document.querySelectorAll('.year-section').forEach(function (section) {
        var n = section.querySelectorAll('.book-card').length;
        var span = section.querySelector('.year-count');
        if (span) span.textContent = n + ' livre' + (n > 1 ? 's' : '');
    });
    document.querySelectorAll('.book-card[data-cover]').forEach(function (card) {
        var img = document.createElement('img');
        img.src = 'images/lectures/' + card.dataset.cover + '.jpg';
        img.loading = 'lazy';
        img.onerror = function () { img.remove(); card.querySelector('.cover-wrap').classList.add('no-cover'); };
        card.querySelector('.cover-wrap').appendChild(img);
    });
    document.querySelectorAll('.book-card:not([data-cover]) .cover-wrap').forEach(function (el) { el.classList.add('no-cover'); });

    // Popup résumé pour les livres ayant un .book-back
    var modal = document.getElementById('bookModal');
    var mTitle = modal.querySelector('.book-modal-title');
    var mAuthor = modal.querySelector('.book-modal-author');
    var mText = modal.querySelector('.book-modal-text');

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.book-card').forEach(function (card) {
        var back = card.querySelector('.book-back');
        if (!back) return;
        card.addEventListener('click', function () {
            var t = card.querySelector('.book-title');
            var a = card.querySelector('.book-author');
            mTitle.textContent = t ? t.textContent : '';
            mAuthor.textContent = a ? a.textContent : '';
            mText.innerHTML = back.innerHTML;
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
        });
    });

    modal.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // Une seule année affichée à la fois — switch via le year-nav
    var sections = document.querySelectorAll('.year-section');
    var navLinks = document.querySelectorAll('.year-nav a');
    var footerYear = document.querySelector('.year-footer-year');
    var footerCount = document.querySelector('.year-footer-count');

    function activateYear(year) {
        var found = false;
        var activeSection = null;
        sections.forEach(function (s) {
            var on = s.id === year;
            s.classList.toggle('active', on);
            if (on) { found = true; activeSection = s; }
        });
        navLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + year);
        });
        if (activeSection) {
            if (footerYear) footerYear.textContent = activeSection.id;
            var count = activeSection.querySelector('.year-count');
            if (footerCount) footerCount.textContent = (count ? count.textContent : '') + ' lus';
        }
        return found;
    }

    if (sections.length && navLinks.length) {
        // Année initiale : hash de l'URL sinon la première section
        var initial = (location.hash || '').replace('#', '');
        if (!activateYear(initial)) activateYear(sections[0].id);

        // Le contenu attend la fin de l'anim du header au 1er chargement (delay CSS).
        // Une fois passé, on retire is-loading pour que les switchs soient immédiats.
        var shelf = document.querySelector('.bookshelf-section');
        if (shelf) setTimeout(function () { shelf.classList.remove('is-loading'); }, 1900);

        navLinks.forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var year = a.getAttribute('href').replace('#', '');
                if (activateYear(year)) {
                    history.replaceState(null, '', '#' + year);
                    // Remonter vers l'en-tête pour repartir du haut de la nouvelle année
                    var header = document.querySelector('.intro-header');
                    if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Bouton « Haut de page » du footer
        var backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            backToTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }
})();
