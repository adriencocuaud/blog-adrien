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

        // Sous-groupe (section h2) = conteneur [data-subgroup] le plus proche,
        // utilisé pour le tirage "un cas par sous-groupe" de l'entraînement
        var subEl = card.closest('[data-subgroup]');
        var subKey = subEl ? subEl.getAttribute('data-subgroup') : '';

        pool.push({
            img: img.getAttribute('src'),
            name: nameEl.textContent.trim(),
            nameHtml: nameEl.innerHTML,
            groupKey: groupEl ? groupEl.getAttribute('data-group') : null,
            subKey: subKey,
            formula: formulaEl.innerHTML
        });
    });

    // Registre des sous-groupes par groupe (ordre du document), avec pour
    // libellé le titre h2 qui précède le conteneur [data-subgroup]
    var subgroupsByGroup = {};
    document.querySelectorAll('.algo-group[data-group] [data-subgroup]').forEach(function (el) {
        var groupKey = el.closest('.algo-group').getAttribute('data-group');
        var key = el.getAttribute('data-subgroup');
        var list = (subgroupsByGroup[groupKey] = subgroupsByGroup[groupKey] || []);
        if (list.some(function (sub) { return sub.key === key; })) return;
        var titleEl = el.previousElementSibling;
        var label = (titleEl && titleEl.classList.contains('group-title'))
            ? titleEl.textContent.trim()
            : key;
        list.push({ key: key, label: label });
    });

    var card = document.getElementById('training-card');
    if (!card || pool.length === 0) return;

    var imgEl = document.getElementById('training-img');
    var nameEl = document.getElementById('training-name');
    var formulaEl = document.getElementById('training-formula');
    var progressBar = document.getElementById('training-progress-bar');
    var switchEl = document.getElementById('training-switch');
    var switchButtons = document.querySelectorAll('.training-switch-option');
    var optionsBtn = document.getElementById('training-options-btn');
    var optionsPanel = document.getElementById('training-options');
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

    // --- Sélection des sous-groupes inclus dans le tirage ---
    // On mémorise les EXCLUSIONS (par groupe) : un sous-groupe ajouté plus tard
    // est donc inclus par défaut.
    var subgroupsBar = document.getElementById('training-subgroups');
    var excludedByGroup = {};
    try {
        excludedByGroup = JSON.parse(localStorage.getItem('trainingExcludedSubgroups')) || {};
    } catch (e) { /* localStorage indisponible : tout est inclus */ }

    function isSelected(groupKey, subKey) {
        return !(excludedByGroup[groupKey] || {})[subKey];
    }

    function renderSubgroups() {
        if (!subgroupsBar) return;
        subgroupsBar.innerHTML = '';
        var list = subgroupsByGroup[activeGroup] || [];
        subgroupsBar.hidden = list.length < 2; // inutile s'il n'y a rien à choisir
        list.forEach(function (sub) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'training-subgroup-btn' + (isSelected(activeGroup, sub.key) ? ' active' : '');
            btn.textContent = sub.label;
            btn.setAttribute('aria-pressed', String(isSelected(activeGroup, sub.key)));
            btn.addEventListener('click', function (event) {
                event.stopPropagation();
                toggleSubgroup(sub.key);
            });
            subgroupsBar.appendChild(btn);
        });
    }

    // Le panneau d'options étant ouvert (tirage en pause), on prépare juste le
    // nouveau cycle : il démarrera à la fermeture du panneau
    var settingsChanged = false;

    function toggleSubgroup(subKey) {
        var excluded = (excludedByGroup[activeGroup] = excludedByGroup[activeGroup] || {});
        if (excluded[subKey]) {
            delete excluded[subKey];
        } else {
            // Verrou : au moins un sous-groupe doit rester dans le tirage
            var list = subgroupsByGroup[activeGroup] || [];
            var selectedCount = list.filter(function (sub) { return !excluded[sub.key]; }).length;
            if (selectedCount <= 1) return;
            excluded[subKey] = true;
        }
        try { localStorage.setItem('trainingExcludedSubgroups', JSON.stringify(excludedByGroup)); } catch (e) { /* ignore */ }
        renderSubgroups();
        resetDraw();
        settingsChanged = true;
    }

    function activePool() {
        var inGroup = pool.filter(function (item) {
            return item.groupKey === activeGroup;
        });
        if (inGroup.length === 0) inGroup = pool;
        var selected = inGroup.filter(function (item) {
            return isSelected(activeGroup, item.subKey);
        });
        // Sélection vide (ex: stockage périmé) : on retombe sur tout le groupe
        return selected.length ? selected : inGroup;
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

    // Tirage "un par sous-groupe" : toute la séquence du cycle est pré-calculée.
    // Passe par passe, on prend un cas (mélangé, sans remise) dans chaque
    // sous-groupe non épuisé, l'ordre des sous-groupes étant remélangé à
    // chaque passe. Ensuite pickCase() se contente de dépiler.
    var sequence = [];

    function resetDraw() {
        var byGroup = {};
        activePool().forEach(function (item) {
            (byGroup[item.subKey] = byGroup[item.subKey] || []).push(item);
        });
        var keys = Object.keys(byGroup);
        keys.forEach(function (key) { shuffle(byGroup[key]); });

        sequence = [];
        var pass;
        while ((pass = keys.filter(function (k) { return byGroup[k].length > 0; })).length > 0) {
            shuffle(pass).forEach(function (k) { sequence.push(byGroup[k].shift()); });
        }
        finished = false;
    }

    // Retourne le prochain cas, ou null quand tous les cas ont été tirés
    function pickCase() {
        return sequence.shift() || null;
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
        // La nouvelle durée s'appliquera à la fermeture du panneau d'options
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

    // --- Panneau d'options (timer + sous-groupes), affiché à la place de l'image ---
    function optionsOpen() {
        return card.classList.contains('options-open');
    }

    function openOptions() {
        // Met le tirage en pause pendant le réglage
        clearTimeout(revealTimer);
        clearTimeout(nextTimer);
        progressBar.classList.remove('running');
        card.classList.remove('revealed');
        card.classList.add('options-open');
        if (optionsBtn) optionsBtn.setAttribute('aria-expanded', 'true');
    }

    function closeOptions() {
        card.classList.remove('options-open');
        if (optionsBtn) optionsBtn.setAttribute('aria-expanded', 'false');
        if (settingsChanged || !current) {
            settingsChanged = false;
            newRound(); // la sélection a changé : nouveau cycle
        } else {
            restartTimer(); // rien n'a changé : on reprend le cas en cours (durée à jour)
        }
    }

    if (optionsBtn) {
        optionsBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            if (optionsOpen()) closeOptions();
            else openOptions();
        });
        optionsBtn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    }
    if (optionsPanel) {
        // Le panneau recouvre la carte : ses clics ne doivent pas tirer un nouveau cas
        optionsPanel.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        optionsPanel.addEventListener('keydown', function (event) {
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
            renderSubgroups();
            // Changer de groupe referme le panneau d'options s'il était ouvert
            card.classList.remove('options-open');
            if (optionsBtn) optionsBtn.setAttribute('aria-expanded', 'false');
            settingsChanged = false;
            resetDraw(); // nouveau groupe = nouveau cycle complet
            newRound();
        });
        btn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    });

    card.addEventListener('click', function () {
        if (optionsOpen()) return;
        newRound();
    });
    card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            if (optionsOpen()) return;
            event.preventDefault();
            newRound();
        }
    });

    renderSubgroups();
    resetDraw();
    newRound();
})();
