// Entraînement : tire un cas au hasard parmi toutes les cartes .algo-card
// présentes sur la page (perm, H, Pi, U, et celles ajoutées plus tard),
// affiche l'image, puis révèle l'algorithme après un délai réglable (contrôle −/+ dans le titre).
(function () {
    var REVEAL_DELAY_DEFAULT = 4000;
    var REVEAL_DELAY_MIN = 1000;
    var REVEAL_DELAY_MAX = 15000;
    var REVEAL_DELAY_STEP = 1000;
    var NEXT_DELAY = 1000; // durée d'affichage de la réponse avant le cas suivant

    var revealDelay = REVEAL_DELAY_DEFAULT;
    try {
        var storedDelay = parseInt(localStorage.getItem('trainingRevealDelay'), 10);
        if (storedDelay >= REVEAL_DELAY_MIN && storedDelay <= REVEAL_DELAY_MAX) revealDelay = storedDelay;
    } catch (e) { /* localStorage indisponible : on garde le défaut */ }

    var pool = [];
    document.querySelectorAll('.algo-group .algo-card').forEach(function (card) {
        var img = card.querySelector('.algo-img');
        var formulaEl = card.querySelector('.algo-formula');
        var nameEl = card.querySelector('.algo-name');
        if (!img || !formulaEl || !nameEl) return;

        var groupEl = card.closest('.algo-group');

        // Sous-groupe = le titre (h2.group-title) qui précède le conteneur de la
        // carte (grille CLL ou rangée de sous-groupes PLL), utilisé pour le
        // tirage "un cas par sous-groupe" de l'entraînement.
        var subKey = '';
        var container = card;
        while (container && container.parentElement !== groupEl) {
            container = container.parentElement;
        }
        while (container) {
            if (container.classList.contains('group-title')) {
                subKey = container.textContent.trim();
                break;
            }
            container = container.previousElementSibling;
        }

        pool.push({
            img: img.getAttribute('src'),
            name: nameEl.textContent.trim(),
            nameHtml: nameEl.innerHTML,
            groupKey: groupEl ? groupEl.getAttribute('data-group') : null,
            subKey: subKey,
            formula: formulaEl.innerHTML
        });
    });

    var card = document.getElementById('training-card');
    if (!card || pool.length === 0) return;

    var imgEl = document.getElementById('training-img');
    var nameEl = document.getElementById('training-name');
    var formulaEl = document.getElementById('training-formula');
    var progressBar = document.getElementById('training-progress-bar');
    var switchEl = document.getElementById('training-switch');
    var switchButtons = document.querySelectorAll('.training-switch-option');
    var timerControl = document.getElementById('training-timer-control');
    var timerValueEl = document.getElementById('training-timer-value');
    var timerMinusBtn = document.getElementById('training-timer-minus');
    var timerPlusBtn = document.getElementById('training-timer-plus');

    var activeGroup = null;
    switchButtons.forEach(function (btn) {
        if (btn.classList.contains('active')) activeGroup = btn.getAttribute('data-group');
    });

    // Positionne le curseur du switch selon le nombre réel de boutons, pour
    // rester correct si des groupes sont ajoutés/retirés.
    var switchThumb = switchEl ? switchEl.querySelector('.training-switch-thumb') : null;
    function updateSwitchThumb() {
        if (!switchThumb) return;
        var index = Array.prototype.findIndex.call(switchButtons, function (b) {
            return b.getAttribute('data-group') === activeGroup;
        });
        if (index < 0) index = 0;
        var percent = 100 / switchButtons.length;
        switchThumb.style.width = 'calc(' + percent + '% - 3px)';
        switchThumb.style.transform = 'translateX(' + (index * 100) + '%)';
    }
    updateSwitchThumb();

    // Fige l'état final de l'animation d'apparition une fois jouée, pour que
    // le fait de masquer/réafficher un groupe (switch de groupe) ne la rejoue pas.
    // Un groupe masqué par le switch avant la fin de son animation (ex: PLL,
    // caché dès le chargement) ne déclenche jamais "animationend" : on fige
    // donc tous les groupes sur un délai fixe plutôt que d'attendre cet event.
    setTimeout(function () {
        document.querySelectorAll('.algo-group').forEach(function (group) {
            group.style.animation = 'none';
            group.style.opacity = '1';
            group.style.transform = 'none';
        });
    }, 2500);

    var groupSections = document.querySelectorAll('.algo-group[data-group]');
    function updateGroupSections() {
        groupSections.forEach(function (section) {
            section.hidden = section.getAttribute('data-group') !== activeGroup;
        });
    }
    updateGroupSections();

    function activePool() {
        var filtered = pool.filter(function (item) {
            return item.groupKey === activeGroup;
        });
        return filtered.length ? filtered : pool;
    }

    var revealTimer = null;
    var nextTimer = null;
    var current = null;
    var finished = false;

    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    }

    // Sac de tirage "un par sous-groupe" : à chaque passe, on tire un cas dans
    // chaque sous-groupe (ordre des sous-groupes mélangé), puis on recommence
    // une passe, sans remise, jusqu'à épuiser tous les cas.
    var bagByGroup = {};   // subKey -> cas restants (mélangés)
    var passOrder = [];    // sous-groupes restant à visiter dans la passe en cours

    function refillBag() {
        bagByGroup = {};
        passOrder = [];
        activePool().forEach(function (item) {
            if (!bagByGroup[item.subKey]) bagByGroup[item.subKey] = [];
            bagByGroup[item.subKey].push(item);
        });
        Object.keys(bagByGroup).forEach(function (key) {
            shuffle(bagByGroup[key]);
        });
    }

    function resetDraw() {
        refillBag();
        finished = false;
    }

    // Retourne le prochain cas, ou null quand tous les cas ont été tirés
    function pickCase() {
        for (var attempt = 0; attempt < 2; attempt++) {
            // Nouvelle passe : ordre aléatoire des sous-groupes non épuisés
            if (passOrder.length === 0) {
                passOrder = shuffle(Object.keys(bagByGroup).filter(function (key) {
                    return bagByGroup[key].length > 0;
                }));
                if (passOrder.length === 0) return null;
            }
            while (passOrder.length > 0) {
                var subKey = passOrder.shift();
                if (bagByGroup[subKey] && bagByGroup[subKey].length > 0) {
                    return bagByGroup[subKey].shift();
                }
            }
        }
        return null;
    }

    // Tous les cas ont été tirés : message de fin, un clic relance un cycle complet.
    // La classe "finished" masque image + barre sans changer la taille de la carte.
    function showFinished() {
        finished = true;
        current = null;
        progressBar.classList.remove('running');
        imgEl.setAttribute('alt', '');
        nameEl.innerHTML = '';
        formulaEl.innerHTML = '';
        card.classList.add('finished');
    }

    function newRound() {
        clearTimeout(revealTimer);
        clearTimeout(nextTimer);
        if (finished) resetDraw();
        card.classList.remove('revealed');
        card.classList.remove('finished');

        current = pickCase();
        if (!current) {
            showFinished();
            return;
        }

        // Rejoue l'animation de la barre de progression depuis le début
        progressBar.classList.remove('running');
        void progressBar.offsetWidth;
        progressBar.style.animationDuration = revealDelay + 'ms';
        progressBar.classList.add('running');

        imgEl.setAttribute('src', current.img);
        imgEl.setAttribute('alt', current.name);
        nameEl.innerHTML = current.nameHtml;
        formulaEl.innerHTML = current.formula;

        revealTimer = setTimeout(function () {
            card.classList.add('revealed');
            // Enchaîne automatiquement sur le cas suivant après affichage de la réponse
            nextTimer = setTimeout(newRound, NEXT_DELAY);
        }, revealDelay);
    }

    // --- Paramètre : durée du timer de résolution ---
    function updateTimerValue() {
        if (timerValueEl) timerValueEl.textContent = String(revealDelay / 1000);
    }
    updateTimerValue();

    function adjustRevealDelay(deltaMs) {
        var next = Math.min(REVEAL_DELAY_MAX, Math.max(REVEAL_DELAY_MIN, revealDelay + deltaMs));
        if (next === revealDelay) return;
        revealDelay = next;
        updateTimerValue();
        try { localStorage.setItem('trainingRevealDelay', String(revealDelay)); } catch (e) { /* ignore */ }
        restartTimer(); // applique la nouvelle durée immédiatement, sans consommer un cas du sac
    }

    // Relance la barre + le timer sur le cas courant (réglage de durée)
    function restartTimer() {
        if (finished || !current) return;
        clearTimeout(revealTimer);
        clearTimeout(nextTimer);
        card.classList.remove('revealed');
        progressBar.classList.remove('running');
        void progressBar.offsetWidth;
        progressBar.style.animationDuration = revealDelay + 'ms';
        progressBar.classList.add('running');
        revealTimer = setTimeout(function () {
            card.classList.add('revealed');
            nextTimer = setTimeout(newRound, NEXT_DELAY);
        }, revealDelay);
    }

    if (timerControl) {
        // La carte entière tire un nouveau cas au clic : le contrôle du timer ne doit pas déclencher ça
        timerControl.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        timerControl.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    }
    if (timerMinusBtn) timerMinusBtn.addEventListener('click', function () { adjustRevealDelay(-REVEAL_DELAY_STEP); });
    if (timerPlusBtn) timerPlusBtn.addEventListener('click', function () { adjustRevealDelay(REVEAL_DELAY_STEP); });

    switchButtons.forEach(function (btn) {
        btn.addEventListener('click', function (event) {
            event.stopPropagation();
            var key = btn.getAttribute('data-group');
            if (key === activeGroup) return;

            activeGroup = key;
            switchButtons.forEach(function (b) {
                var isActive = b.getAttribute('data-group') === activeGroup;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-checked', String(isActive));
            });
            if (switchEl) switchEl.setAttribute('data-active', activeGroup);
            updateSwitchThumb();
            updateGroupSections();
            resetDraw(); // nouveau groupe = nouveau cycle complet
            newRound();
        });
        btn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    });

    card.addEventListener('click', function () {
        newRound();
    });
    card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            newRound();
        }
    });

    resetDraw();
    newRound();
})();
