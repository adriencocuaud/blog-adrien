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
})();
