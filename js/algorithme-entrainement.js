// Entraînement : tire un cas au hasard parmi toutes les cartes .algo-card
// présentes sur la page (perm, H, Pi, U, et celles ajoutées plus tard),
// affiche l'image, puis révèle l'algorithme après 5 secondes.
(function () {
    var REVEAL_DELAY = 5000;

    var pool = [];
    document.querySelectorAll('.algo-grid .algo-card').forEach(function (card) {
        var img = card.querySelector('.algo-img');
        var formulaEl = card.querySelector('.algo-formula:not(.algo-alt)');
        var nameEl = card.querySelector('.algo-name');
        if (!img || !formulaEl || !nameEl) return;

        var groupEl = card.closest('.algo-group');
        var groupTitleEl = groupEl ? groupEl.querySelector('.group-title') : null;

        pool.push({
            img: img.getAttribute('src'),
            name: nameEl.textContent.trim(),
            group: groupTitleEl ? groupTitleEl.textContent.trim() : '',
            formula: formulaEl.innerHTML
        });
    });

    var card = document.getElementById('training-card');
    if (!card || pool.length === 0) return;

    var imgEl = document.getElementById('training-img');
    var nameEl = document.getElementById('training-name');
    var formulaEl = document.getElementById('training-formula');
    var progressBar = document.getElementById('training-progress-bar');

    var revealTimer = null;
    var current = null;

    function pickCase() {
        if (pool.length === 1) return pool[0];
        var next = current;
        while (next === current) {
            next = pool[Math.floor(Math.random() * pool.length)];
        }
        return next;
    }

    function newRound() {
        clearTimeout(revealTimer);
        card.classList.remove('revealed');

        // Rejoue l'animation de la barre de progression depuis le début
        progressBar.classList.remove('running');
        void progressBar.offsetWidth;
        progressBar.classList.add('running');

        current = pickCase();
        imgEl.setAttribute('src', current.img);
        imgEl.setAttribute('alt', current.name);
        nameEl.textContent = current.group ? current.group + ' – ' + current.name : current.name;
        formulaEl.innerHTML = current.formula;

        revealTimer = setTimeout(function () {
            card.classList.add('revealed');
        }, REVEAL_DELAY);
    }

    card.addEventListener('click', newRound);
    card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            newRound();
        }
    });

    newRound();
})();
