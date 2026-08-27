// Entraînement : tire un cas au hasard parmi toutes les cartes .algo-card
// présentes sur la page (perm, H, Pi, U, et celles ajoutées plus tard),
// affiche le cas à résoudre sur un cube 3D (cubing.js twisty-player), puis révèle
// l'algorithme après le temps d'inspection du mode de vitesse choisi, en animant
// sa résolution sur le cube à la même vitesse.
(function () {
    // Modes de vitesse : temps d'inspection avant la réponse + tempo de l'animation
    var SPEED_MODES = {
        lent: { inspection: 5000, tempo: 1.2 },
        moyen: { inspection: 3000, tempo: 2.2 },
        rapide: { inspection: 1000, tempo: 3.5 }
    };
    var SPEED_DEFAULT = 'moyen';
    var NEXT_PAUSE = 200; // pause après la durée de l'algo, avant le cas suivant
    var NEXT_FALLBACK = 3000; // repli si la durée de l'animation n'est pas lisible
    var ANIM_MAX_DELAY = 20000; // garde-fou : jamais plus longtemps sur un même cas

    var speedMode = SPEED_DEFAULT;
    try {
        var storedSpeed = localStorage.getItem('trainingSpeed');
        if (SPEED_MODES[storedSpeed]) speedMode = storedSpeed;
    } catch (e) { /* localStorage indisponible : on garde le défaut */ }
    var revealDelay = SPEED_MODES[speedMode].inspection;

    // Face du dessus : blanc (orange devant) ou jaune (bleu devant).
    // L'orientation de base du cube (setup) en découle.
    var TOP_SETUPS = { blanc: "y'", jaune: 'x2' };
    var topColor = 'blanc';
    try {
        var storedTop = localStorage.getItem('trainingTopColor');
        if (TOP_SETUPS[storedTop]) topColor = storedTop;
    } catch (e) { /* localStorage indisponible : on garde le défaut */ }

    // Stickers fantômes des faces arrière du cube, désactivés par défaut
    var backView = false;
    try {
        backView = localStorage.getItem('trainingBackView') === '1';
    } catch (e) { /* localStorage indisponible : on garde le défaut */ }

    // AUF : actif = cas posé tel quel ; inactif = un mouvement U aléatoire précède
    // l'algo joué, le cas est donc présenté tourné : il faut réorienter la couche U
    // avant d'appliquer l'algo
    var auf = true;
    try {
        var storedAuf = localStorage.getItem('trainingAuf');
        if (storedAuf === '0' || storedAuf === '1') auf = storedAuf === '1';
    } catch (e) { /* localStorage indisponible : on garde le défaut */ }
    var AUF_MOVES = ['U', 'U2', "U'", "U2'"];
    var currentAuf = ''; // tirage du cas en cours, stable tant que le cas ne change pas

    // --- Entrées sélectionnables du panneau : une pastille = un cas ---
    // Une entrée regroupe les cartes d'un même .algo-subgroup (duo gauche/droite
    // des PLL) ; une carte sans .algo-subgroup (OLL) forme une entrée à elle seule.

    // Nom court d'une carte : le <em> porte la partie distinctive du nom
    function shortName(cardEl) {
        var el = cardEl.querySelector('.algo-name');
        if (!el) return '';
        var em = el.querySelector('em');
        var text = (em ? em.textContent : el.textContent).replace(/\s+/g, ' ').trim();
        return text.replace(/^Permutation\s+/i, '').replace(/^Forme\s+(de\s+)?/i, '');
    }

    // Libellé d'une entrée : nom court sans "gauche"/"droite" ; si les cartes
    // gardent des noms différents (E / E'), on retient leur préfixe commun.
    function entryLabel(cards) {
        var names = [];
        cards.forEach(function (cardEl) {
            var name = shortName(cardEl).replace(/\s*\b(gauche|droite)\b/gi, '').trim();
            if (name) names.push(name);
        });
        if (names.length === 0) return '';
        var allSame = names.every(function (name) { return name === names[0]; });
        if (allSame) return names[0];
        var prefix = names[0];
        names.forEach(function (name) {
            while (prefix && name.indexOf(prefix) !== 0) prefix = prefix.slice(0, -1);
        });
        return prefix.trim() || names[0];
    }

    // Clé de persistance : slug du libellé (l'apostrophe de G' devient "-prime",
    // sinon G et G' se réduiraient à la même clé)
    function slugify(label) {
        var text = label.replace(/'/g, '-prime');
        if (text.normalize) text = text.normalize('NFD').replace(/[̀-ͯ]/g, '');
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Registre des entrées par groupe (ordre du document). La clé est aussi posée
    // sur le conteneur pour que le pool la retrouve sans second calcul.
    var entriesByGroup = {};
    document.querySelectorAll('.algo-group[data-group]').forEach(function (groupEl) {
        var groupKey = groupEl.getAttribute('data-group');
        var list = (entriesByGroup[groupKey] = []);
        var seen = [];
        groupEl.querySelectorAll('.algo-card').forEach(function (cardEl) {
            var entryEl = cardEl.closest('[data-case-label], .algo-subgroup') || cardEl;
            if (seen.indexOf(entryEl) >= 0) return;
            seen.push(entryEl);
            var cards = (entryEl === cardEl)
                ? [cardEl]
                : Array.prototype.slice.call(entryEl.querySelectorAll('.algo-card'));
            // data-case-label dans le HTML = échappatoire si un nom résiste à la règle
            var label = entryEl.getAttribute('data-case-label') || entryLabel(cards);
            var key = slugify(label);
            entryEl.setAttribute('data-case-key', key);
            list.push({ key: key, label: label, count: cards.length });
        });
    });

    var pool = [];
    document.querySelectorAll('.algo-group .algo-card').forEach(function (card) {
        var formulaEl = card.querySelector('.algo-formula');
        var nameEl = card.querySelector('.algo-name');
        if (!formulaEl || !nameEl) return;

        var groupEl = card.closest('.algo-group');

        var entryEl = card.closest('[data-case-label], .algo-subgroup') || card;

        pool.push({
            name: nameEl.textContent.trim(),
            nameHtml: nameEl.innerHTML,
            groupKey: groupEl ? groupEl.getAttribute('data-group') : null,
            caseKey: entryEl.getAttribute('data-case-key') || '',
            formula: formulaEl.innerHTML
        });
    });

    var card = document.getElementById('training-card');
    if (!card || pool.length === 0) return;

    var player3d = document.getElementById('training-3d');
    var topColorBtn = document.getElementById('training-top-color');
    var backViewBtn = document.getElementById('training-back-view');
    var aufBtn = document.getElementById('training-auf');
    var nameEl = document.getElementById('training-name');
    var formulaEl = document.getElementById('training-formula');
    var progressBar = document.getElementById('training-progress-bar');
    var switchEl = document.getElementById('training-switch');
    var switchButtons = document.querySelectorAll('.training-switch-option');
    var optionsBtn = document.getElementById('training-options-btn');
    var optionsPanel = document.getElementById('training-options');
    var speedButtons = document.querySelectorAll('#training-speed [data-speed]');

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

    // --- Sélection des cas inclus dans le tirage ---
    // On mémorise les EXCLUSIONS (par groupe) : un cas ajouté plus tard est donc
    // inclus par défaut.
    var casesBar = document.getElementById('training-cases');
    var excludedByGroup = {};
    try {
        excludedByGroup = JSON.parse(localStorage.getItem('trainingExcludedCases')) || {};
    } catch (e) { /* localStorage indisponible : tout est inclus */ }

    function isSelected(groupKey, caseKey) {
        return !(excludedByGroup[groupKey] || {})[caseKey];
    }

    function renderCases() {
        if (!casesBar) return;
        casesBar.innerHTML = '';
        var list = entriesByGroup[activeGroup] || [];
        casesBar.hidden = list.length < 2; // inutile s'il n'y a rien à choisir

        // Pastille « Tous » : reflète l'état (active = aucun cas exclu) et remet
        // tout le groupe dans le tirage au clic
        var allSelected = list.every(function (entry) { return isSelected(activeGroup, entry.key); });
        var allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.id = 'training-cases-all';
        allBtn.className = 'training-subgroup-btn training-case-btn' + (allSelected ? ' active' : '');
        allBtn.textContent = 'Tous';
        allBtn.setAttribute('aria-pressed', String(allSelected));
        allBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            selectAllCases();
        });
        casesBar.appendChild(allBtn);

        list.forEach(function (entry) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'training-subgroup-btn training-case-btn' + (isSelected(activeGroup, entry.key) ? ' active' : '');
            btn.textContent = entry.label;
            btn.setAttribute('aria-pressed', String(isSelected(activeGroup, entry.key)));
            btn.addEventListener('click', function (event) {
                event.stopPropagation();
                toggleCase(entry.key);
            });
            casesBar.appendChild(btn);
        });
        balanceCases();
    }

    // Rangées équilibrées : on mesure combien de pastilles tiennent sur la 1re
    // ligne, puis on force des ruptures pour répartir (ex. 6+2 -> 4+4).
    // Le panneau fermé est en display:none, donc non mesurable : l'équilibrage
    // est rejoué à son ouverture.
    function balanceCases() {
        if (!casesBar) return;
        // Idempotence : on repart des pastilles seules
        Array.prototype.slice.call(casesBar.querySelectorAll('.training-cases-break'))
            .forEach(function (el) { casesBar.removeChild(el); });
        if (casesBar.offsetHeight === 0) return; // panneau masqué : rien à mesurer
        var btns = Array.prototype.slice.call(casesBar.querySelectorAll('.training-case-btn'));
        var total = btns.length;
        if (total < 3) return;
        var firstTop = btns[0].offsetTop;
        var perRow = 0;
        while (perRow < total && btns[perRow].offsetTop === firstTop) perRow++;
        if (perRow <= 0 || perRow >= total) return; // tout tient sur une ligne
        var rows = Math.ceil(total / perRow);
        var target = Math.ceil(total / rows);
        for (var i = target; i < total; i += target) {
            var brk = document.createElement('span');
            brk.className = 'training-cases-break';
            brk.setAttribute('aria-hidden', 'true');
            casesBar.insertBefore(brk, btns[i]);
        }
    }

    // Le panneau d'options étant ouvert (tirage en pause), on prépare juste le
    // nouveau cycle : il démarrera à la fermeture du panneau
    var settingsChanged = false;

    function selectAllCases() {
        var list = entriesByGroup[activeGroup] || [];
        var allSelected = list.every(function (entry) { return isSelected(activeGroup, entry.key); });
        if (allSelected) return; // tout est déjà dans le tirage
        delete excludedByGroup[activeGroup];
        try { localStorage.setItem('trainingExcludedCases', JSON.stringify(excludedByGroup)); } catch (e) { /* ignore */ }
        renderCases();
        resetDraw();
        settingsChanged = true;
    }

    function toggleCase(caseKey) {
        var excluded = (excludedByGroup[activeGroup] = excludedByGroup[activeGroup] || {});
        if (excluded[caseKey]) {
            delete excluded[caseKey];
        } else {
            // Verrou : au moins un cas doit rester dans le tirage
            var list = entriesByGroup[activeGroup] || [];
            var selectedCount = list.filter(function (entry) { return !excluded[entry.key]; }).length;
            if (selectedCount <= 1) return;
            excluded[caseKey] = true;
        }
        try { localStorage.setItem('trainingExcludedCases', JSON.stringify(excludedByGroup)); } catch (e) { /* ignore */ }
        renderCases();
        resetDraw();
        settingsChanged = true;
    }

    function activePool() {
        var inGroup = pool.filter(function (item) {
            return item.groupKey === activeGroup;
        });
        if (inGroup.length === 0) inGroup = pool;
        var selected = inGroup.filter(function (item) {
            return isSelected(activeGroup, item.caseKey);
        });
        // Sélection vide (ex: stockage périmé) : on retombe sur tout le groupe
        return selected.length ? selected : inGroup;
    }

    // --- Cube 3D (cubing.js twisty-player) ---
    // Si le CDN est injoignable, <twisty-player> reste un élément inconnu sans API :
    // les appels au player sont court-circuités et le tirage continue de tourner.
    function player3dReady() {
        return !!(player3d && typeof player3d.play === 'function');
    }

    // Extrait l'algo en notation brute depuis le HTML de la formule
    // (spans de triggers, <sup>2</sup> de répétition = notation cubing.js valide)
    var algoTextBuffer = document.createElement('div');
    function algoText(formulaHtml) {
        algoTextBuffer.innerHTML = formulaHtml;
        return algoTextBuffer.textContent.replace(/\s+/g, ' ').trim();
    }

    // Faces arrière : stickers fantômes translucides autour du cube. L'attribut suffit,
    // le player le lit aussi bien avant qu'après définition de l'élément custom.
    function applyBackView() {
        if (!player3d) return;
        player3d.setAttribute('hint-facelets', backView ? 'floating' : 'none');
        if (backViewBtn) {
            backViewBtn.classList.toggle('active', backView);
            backViewBtn.setAttribute('aria-pressed', String(backView));
        }
    }

    // Pose le cas à résoudre sur le cube : l'ancre en fin d'algo fait afficher
    // l'état AVANT résolution, l'animation le résout au reveal.
    function setup3dCase(item) {
        if (!player3dReady() || !item) return;
        try {
            // Le setup doit être posé avant l'algo : c'est lui qui fixe l'état affiché
            // Le setup passe par l'attribut : le player le relit à chaque changement,
            // et contrairement au setter experimentalSetupAlg (dont le getter lève
            // "Cannot get .setup directly"), l'état posé reste relisible.
            player3d.setAttribute('experimental-setup-alg', TOP_SETUPS[topColor]);
            player3d.alg = (currentAuf ? currentAuf + ' ' : '') + algoText(item.formula);
            player3d.pause();
            player3d.timestamp = 0;
        } catch (e) { /* notation refusée : le cube reste sur l'état précédent */ }
    }

    function play3d() {
        if (!player3dReady()) return;
        try {
            player3d.timestamp = 0;
            player3d.play();
        } catch (e) { /* ignore */ }
    }

    // Durée réelle de l'animation en cours, lue sur le modèle du player :
    // timeRange donne l'étendue de l'algo en ms au tempo de base, tempoScale le facteur
    // de vitesse appliqué. Promesse rejetée si l'API n'est pas celle attendue.
    function animation3dDuration() {
        var model = player3d.experimentalModel;
        return Promise.all([model.timeRange.get(), model.tempoScale.get()]).then(function (values) {
            var range = values[0];
            var scale = parseFloat(values[1]) || 1;
            return Math.max(0, (range.end - range.start) / scale);
        });
    }

    // Enchaînement sur le cas suivant : la réponse reste affichée le temps de
    // l'animation de l'algo + NEXT_PAUSE.
    function scheduleNext() {
        // Repli armé tout de suite : si la lecture du modèle échoue ou traîne,
        // le cycle continue quand même
        nextTimer = setTimeout(newRound, NEXT_FALLBACK + NEXT_PAUSE);
        if (!player3dReady() || typeof Promise === 'undefined') return;
        var token = roundToken;
        try {
            animation3dDuration().then(function (duration) {
                if (token !== roundToken) return; // le cas a changé entre-temps
                clearTimeout(nextTimer);
                nextTimer = setTimeout(newRound, Math.min(duration, ANIM_MAX_DELAY) + NEXT_PAUSE);
            })['catch'](function () { /* repli déjà armé */ });
        } catch (e) { /* repli déjà armé */ }
    }

    // --- Réglage : vitesse (inspection + animation) ---
    // Le tempo passe par l'attribut : le getter/setter JS tempoScale n'est pas
    // accessible directement sur un TwistyPlayer, l'attribut l'est toujours.
    function applySpeed() {
        revealDelay = SPEED_MODES[speedMode].inspection;
        if (player3d) player3d.setAttribute('tempo-scale', String(SPEED_MODES[speedMode].tempo));
        speedButtons.forEach(function (btn) {
            var isActive = btn.getAttribute('data-speed') === speedMode;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
    }

    speedButtons.forEach(function (btn) {
        btn.addEventListener('click', function (event) {
            event.stopPropagation();
            var mode = btn.getAttribute('data-speed');
            if (mode === speedMode || !SPEED_MODES[mode]) return;
            speedMode = mode;
            try { localStorage.setItem('trainingSpeed', speedMode); } catch (e) { /* ignore */ }
            applySpeed();
            settingsChanged = true; // le nouveau réglage s'applique à la fermeture du panneau
        });
        btn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    });

    applySpeed();

    // Le libellé du bouton = couleur actuellement sur le dessus
    function applyTopColor() {
        if (!topColorBtn) return;
        topColorBtn.textContent = topColor === 'blanc' ? 'Blanc' : 'Jaune';
    }

    if (topColorBtn) {
        topColorBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            topColor = topColor === 'blanc' ? 'jaune' : 'blanc';
            try { localStorage.setItem('trainingTopColor', topColor); } catch (e) { /* ignore */ }
            applyTopColor();
            setup3dCase(current); // réoriente le cas affiché sans toucher au cycle
        });
        topColorBtn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    }

    applyTopColor();

    if (backViewBtn) {
        backViewBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            backView = !backView;
            try { localStorage.setItem('trainingBackView', backView ? '1' : '0'); } catch (e) { /* ignore */ }
            applyBackView();
            // Réglage purement visuel : le cas en cours et le cycle ne bougent pas
        });
        backViewBtn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    }

    applyBackView();

    function applyAuf() {
        if (!aufBtn) return;
        aufBtn.classList.toggle('active', auf);
        aufBtn.setAttribute('aria-pressed', String(auf));
    }

    if (aufBtn) {
        aufBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            auf = !auf;
            try { localStorage.setItem('trainingAuf', auf ? '1' : '0'); } catch (e) { /* ignore */ }
            applyAuf();
            settingsChanged = true; // le nouveau réglage s'applique à la fermeture du panneau
        });
        aufBtn.addEventListener('keydown', function (event) {
            event.stopPropagation();
        });
    }

    applyAuf();

    var revealTimer = null;
    var nextTimer = null;
    var current = null;
    var finished = false;
    // Incrémenté à chaque annulation : neutralise l'attente asynchrone de fin
    // d'animation 3D d'un cas qu'on vient de quitter (clic, options, switch de groupe)
    var roundToken = 0;

    // Annule tout enchaînement en attente (timers + attente de fin d'animation)
    function cancelPending() {
        clearTimeout(revealTimer);
        clearTimeout(nextTimer);
        roundToken++;
    }

    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }
        return array;
    }

    // Tirage sans remise : les cas sélectionnés sont mélangés une fois,
    // pickCase() dépile jusqu'à épuisement du cycle.
    var sequence = [];

    function resetDraw() {
        sequence = shuffle(activePool().slice());
        finished = false;
    }

    // Retourne le prochain cas, ou null quand tous les cas ont été tirés
    function pickCase() {
        return sequence.shift() || null;
    }

    // Tous les cas ont été tirés : message de fin, un clic relance un cycle complet.
    // La classe "finished" masque cube + barre sans changer la taille de la carte.
    function showFinished() {
        finished = true;
        current = null;
        progressBar.classList.remove('running');
        nameEl.innerHTML = '';
        formulaEl.innerHTML = '';
        card.classList.add('finished');
    }

    function newRound() {
        cancelPending();
        if (finished) resetDraw();
        card.classList.remove('revealed');
        card.classList.remove('finished');

        current = pickCase();
        if (!current) {
            showFinished();
            return;
        }

        // Tirage AUF une seule fois par cas : restartTimer() et la repose après
        // définition de l'élément custom doivent retrouver exactement le même U initial
        currentAuf = auf ? '' : AUF_MOVES[Math.floor(Math.random() * AUF_MOVES.length)];

        // Rejoue l'animation de la barre de progression depuis le début
        progressBar.classList.remove('running');
        void progressBar.offsetWidth;
        progressBar.style.animationDuration = revealDelay + 'ms';
        progressBar.classList.add('running');

        setup3dCase(current);
        nameEl.innerHTML = current.nameHtml;
        formulaEl.innerHTML = current.formula;

        revealTimer = setTimeout(function () {
            card.classList.add('revealed');
            play3d();
            // Enchaîne automatiquement sur le cas suivant après affichage de la réponse
            scheduleNext();
        }, revealDelay);
    }


    // Relance la barre + le compte à rebours d'inspection sur le cas courant
    function restartTimer() {
        if (finished || !current) return;
        cancelPending();
        card.classList.remove('revealed');
        progressBar.classList.remove('running');
        void progressBar.offsetWidth;
        progressBar.style.animationDuration = revealDelay + 'ms';
        progressBar.classList.add('running');
        setup3dCase(current);
        revealTimer = setTimeout(function () {
            card.classList.add('revealed');
            play3d();
            scheduleNext();
        }, revealDelay);
    }

    // --- Panneau d'options (vitesse, vue, sous-groupes), affiché à la place du cube ---
    function optionsOpen() {
        return card.classList.contains('options-open');
    }

    function openOptions() {
        // Met le tirage en pause pendant le réglage
        cancelPending();
        progressBar.classList.remove('running');
        card.classList.remove('revealed');
        card.classList.add('options-open');
        if (optionsBtn) optionsBtn.setAttribute('aria-expanded', 'true');
        balanceCases(); // le panneau devient mesurable seulement maintenant
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
            renderCases();
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

    renderCases();
    resetDraw();
    newRound();

    // Le module twisty arrive du CDN après ce script : le premier cas est posé une
    // fois l'élément custom défini (sinon cube résolu affiché jusqu'au cas suivant).
    // Sans CDN, la promesse ne se résout jamais.
    if (window.customElements && customElements.whenDefined) {
        try {
            customElements.whenDefined('twisty-player').then(function () {
                applySpeed(); // le tempo doit être posé avant la lecture de la durée
                setup3dCase(current);
            }).catch(function () { /* ignore */ });
        } catch (e) { /* ignore */ }
    }
})();
