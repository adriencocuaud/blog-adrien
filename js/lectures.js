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
    var footerCount = document.querySelector('.year-footer-count');
    var activeYear = null;
    var footerCountTimer = null;

    function countTextFor(year) {
        var section = document.getElementById(year);
        var count = section ? section.querySelector('.year-count') : null;
        return (count ? count.textContent : '') + ' lus';
    }

    // Petit fondu enchaîné lors du changement de texte (survol/clic d'une année)
    function setFooterCount(year) {
        if (!footerCount) return;
        var text = countTextFor(year);
        clearTimeout(footerCountTimer);
        footerCount.style.opacity = '0';
        footerCountTimer = setTimeout(function () {
            footerCount.textContent = text;
            footerCount.style.opacity = '1';
        }, 150);
    }

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
            activeYear = year;
            setFooterCount(year);
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

            // Aperçu du nombre de livres de l'année survolée, sans changer l'année active
            a.addEventListener('mouseenter', function () {
                setFooterCount(a.getAttribute('href').replace('#', ''));
            });
            a.addEventListener('mouseleave', function () {
                setFooterCount(activeYear);
            });
            a.addEventListener('focus', function () {
                setFooterCount(a.getAttribute('href').replace('#', ''));
            });
            a.addEventListener('blur', function () {
                setFooterCount(activeYear);
            });
        });
    }
})();
