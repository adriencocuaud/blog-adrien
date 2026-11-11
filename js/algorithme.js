// Page Algorithme : switch OLL / PLL, popup démo 3D au clic sur une carte,
// carte d'entraînement (tirage d'un cas, inspection minutée, résolution animée).
// Cube 3D = <twisty-player> de cubing.js (CDN) ; sans CDN, tout tourne sans cube.
(function () {
    var ANIM_MAX_DELAY = 30000; // garde-fou : jamais plus longtemps sur une animation

    // ================= OUTILS COMMUNS =================
    var store = {
        get: function (key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        },
        set: function (key, value) {
            try { localStorage.setItem(key, value); } catch (e) { /* stockage indisponible */ }
        }
    };

    // Notation brute d'une formule HTML (spans de triggers, <sup>3</sup> = notation cubing.js)
    var textBuffer = document.createElement('div');
    function algoText(formulaHtml) {
        textBuffer.innerHTML = formulaHtml;
        return textBuffer.textContent.replace(/\s+/g, ' ').trim();
    }

    // Player utilisable = élément custom défini. Avant, ne JAMAIS affecter .alg :
    // la propriété posée sur l'élément non défini masquerait le setter du composant.
    function playerReady(player) {
        return !!(player && typeof player.play === 'function');
    }

    function rewind(player) {
        if (!playerReady(player)) return;
        try {
            player.pause();
            player.timestamp = 0;
        } catch (e) { /* ignore */ }
    }

    // Appelle done() à la fin de l'animation en cours + pause. La durée est lue sur
    // le modèle du player ; un repli (fallback) est armé d'abord au cas où elle ne
    // serait pas lisible. Retourne la fonction d'annulation.
    function afterAnimation(player, pause, fallback, done) {
        var active = true;
        var timer = setTimeout(fire, fallback + pause);
        function fire() {
            if (!active) return;
            active = false;
            done();
        }
        try {
            var model = player.experimentalModel;
            Promise.all([model.timeRange.get(), model.tempoScale.get()]).then(function (values) {
                if (!active) return;
                var duration = (values[0].end - values[0].start) / (parseFloat(values[1]) || 1);
                clearTimeout(timer);
                timer = setTimeout(fire, Math.min(Math.max(0, duration), ANIM_MAX_DELAY) + pause);
            }).catch(function () { /* repli armé */ });
        } catch (e) { /* repli armé */ }
        return function () {
            active = false;
            clearTimeout(timer);
        };
    }

    // ================= SWITCH OLL / PLL =================
    var switchEl = document.getElementById('group-switch');
    var switchButtons = switchEl ? switchEl.querySelectorAll('.group-switch-option') : [];
    var switchThumb = switchEl && switchEl.querySelector('.group-switch-thumb');
    var groupSections = document.querySelectorAll('.algo-group[data-group]');
    var activeGroup = switchEl ? switchEl.getAttribute('data-active') : null;
    if (!activeGroup && groupSections.length) activeGroup = groupSections[0].getAttribute('data-group');
    var onGroupChange = function () { /* posé par l'entraînement */ };

    function renderSwitch() {
        switchButtons.forEach(function (btn, index) {
            var isActive = btn.getAttribute('data-group') === activeGroup;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', String(isActive));
            if (isActive && switchThumb) {
                switchThumb.style.width = 'calc(' + (100 / switchButtons.length) + '% - 3px)';
                switchThumb.style.transform = 'translateX(' + (index * 100) + '%)';
            }
        });
        if (switchEl) switchEl.setAttribute('data-active', activeGroup);
        groupSections.forEach(function (section) {
            section.hidden = section.getAttribute('data-group') !== activeGroup;
        });
    }

    switchButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var key = btn.getAttribute('data-group');
            if (key === activeGroup) return;
            activeGroup = key;
            renderSwitch();
            onGroupChange();
        });
    });

    renderSwitch();

    // Fige l'animation d'apparition : réafficher un groupe masqué ne doit pas la
    // rejouer (un groupe masqué avant la fin ne reçoit jamais "animationend").
    setTimeout(function () {
        groupSections.forEach(function (group) {
            group.style.animation = 'none';
            group.style.opacity = '1';
            group.style.transform = 'none';
        });
    }, 2500);

    // ================= POPUP DÉMO =================
    // Clic sur une carte : cube jaune dessus, faces arrière en fantôme, algo joué
    // lentement après POPUP_START_DELAY, puis retour au cas de départ.
    (function () {
        var POPUP_START_DELAY = 600;
        var POPUP_RESET_DELAY = 200;
        var POPUP_FALLBACK = 8000;

        var cards = document.querySelectorAll('.algo-group .algo-card');
        if (cards.length === 0) return;

        var overlay = document.createElement('div');
        overlay.className = 'algo-popup';
        overlay.hidden = true;
        overlay.innerHTML =
            '<div class="algo-popup-box" role="dialog" aria-modal="true">' +
                '<button type="button" class="algo-popup-close" aria-label="Fermer">&times;</button>' +
                '<twisty-player class="cube-3d algo-popup-3d" puzzle="3x3x3" control-panel="none"' +
                ' background="none" hint-facelets="floating" experimental-setup-anchor="end"' +
                ' experimental-setup-alg="x2" camera-latitude="38" camera-longitude="30"' +
                ' tempo-scale="1"></twisty-player>' +
                '<p class="algo-name"></p>' +
                '<p class="algo-formula"></p>' +
            '</div>';
        document.body.appendChild(overlay);

        var popupPlayer = overlay.querySelector('twisty-player');
        var popupName = overlay.querySelector('.algo-name');
        var popupFormula = overlay.querySelector('.algo-formula');
        var startTimer = null;
        var cancelReset = null;

        function stopPopup() {
            clearTimeout(startTimer);
            if (cancelReset) cancelReset();
        }

        function closePopup() {
            stopPopup();
            overlay.hidden = true;
            rewind(popupPlayer);
        }

        function openPopup(cardEl) {
            var formula = cardEl.querySelector('.algo-formula').innerHTML;
            stopPopup();
            popupName.innerHTML = cardEl.querySelector('.algo-name').innerHTML;
            popupFormula.innerHTML = formula;
            overlay.hidden = false;
            if (!playerReady(popupPlayer)) return; // sans CDN : formule seule
            try { popupPlayer.alg = algoText(formula); } catch (e) { return; }
            rewind(popupPlayer);
            startTimer = setTimeout(function () {
                popupPlayer.play();
                cancelReset = afterAnimation(popupPlayer, POPUP_RESET_DELAY, POPUP_FALLBACK, function () {
                    rewind(popupPlayer);
                });
            }, POPUP_START_DELAY);
        }

        cards.forEach(function (cardEl) {
            cardEl.addEventListener('click', function () { openPopup(cardEl); });
        });
        overlay.querySelector('.algo-popup-close').addEventListener('click', closePopup);
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) closePopup();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !overlay.hidden) closePopup();
        });
    })();

    // ================= ENTRAÎNEMENT =================
    // Tire un cas du groupe actif, l'affiche sur le cube, révèle l'algo après le
    // temps d'inspection et anime sa résolution, puis enchaîne sur le suivant.
    (function () {
        var DELAY_MIN = 1000;
        var DELAY_MAX = 15000;
        var DELAY_STEP = 1000;
        // Tempo de l'animation selon le temps d'inspection (en s) : x5 à 1 s, x1 dès 10 s
        var TEMPO_BY_SECOND = { 1: 5, 2: 4.5, 3: 4, 4: 3.5, 5: 3, 6: 2.5, 7: 2.1, 8: 1.7, 9: 1.3 };
        var NEXT_PAUSE = 200;     // après l'algo, avant le cas suivant
        var NEXT_FALLBACK = 3000; // durée d'algo supposée si illisible
        var AUF_PAUSE = 100;      // entre la rotation AUF et l'algo
        var AUF_FALLBACK = 600;   // durée de rotation AUF supposée si illisible
        var AUF_MOVES = ['U', 'U2', "U'", "U2'"];
        // Face du dessus : blanc (orange devant) ou jaune (bleu devant)
        var TOP_SETUPS = { blanc: "y'", jaune: 'x2' };

        var card = document.getElementById('training-card');
        if (!card) return;
        var player = document.getElementById('training-3d');
        var nameEl = document.getElementById('training-name');
        var formulaEl = document.getElementById('training-formula');
        var progressBar = document.getElementById('training-progress-bar');
        var optionsBtn = document.getElementById('training-options-btn');
        var casesBar = document.getElementById('training-cases');
        var timerValueEl = document.getElementById('training-timer-value');
        var topColorBtn = document.getElementById('training-top-color');
        var backViewBtn = document.getElementById('training-back-view');
        var aufBtn = document.getElementById('training-auf');

        // --- Réglages persistés ---
        var storedDelay = parseInt(store.get('trainingRevealDelay'), 10);
        var revealDelay = storedDelay >= DELAY_MIN && storedDelay <= DELAY_MAX ? storedDelay : 4000;
        var topColor = TOP_SETUPS[store.get('trainingTopColor')] ? store.get('trainingTopColor') : 'blanc';
        var backView = store.get('trainingBackView') === '1';
        // AUF actif = cas posé tel quel ; inactif = un U aléatoire précède l'algo
        var auf = store.get('trainingAuf') !== '0';
        // Exclusions par groupe : un cas ajouté plus tard est inclus par défaut
        var excluded = {};
        try { excluded = JSON.parse(store.get('trainingExcludedCases')) || {}; } catch (e) { /* tout inclus */ }

        // --- Cas : une pastille par carte, ou par .algo-subgroup (duos PLL gauche/droite) ---
        function shortName(cardEl) {
            var el = cardEl.querySelector('.algo-name');
            var em = el.querySelector('em');
            return (em || el).textContent.replace(/\s+/g, ' ')
                .replace(/^\s*(Permutation|Forme( de)?)\s+/i, '')
                .replace(/\s*\b(gauche|droite)\b/gi, '').trim();
        }

        // Libellé d'une pastille : préfixe commun des noms de ses cartes (E / E' -> E)
        function commonLabel(names) {
            var prefix = names[0];
            names.forEach(function (name) {
                while (name.indexOf(prefix) !== 0) prefix = prefix.slice(0, -1);
            });
            return prefix.trim() || names[0];
        }

        var entriesByGroup = {}; // groupe -> [{ key, names }]
        var pool = [];           // { group, entry, nameHtml, formula }
        groupSections.forEach(function (groupEl) {
            var group = groupEl.getAttribute('data-group');
            var entries = (entriesByGroup[group] = []);
            var entryOf = new Map();
            groupEl.querySelectorAll('.algo-card').forEach(function (cardEl) {
                var entryEl = cardEl.closest('.algo-subgroup') || cardEl;
                var entry = entryOf.get(entryEl);
                if (!entry) {
                    entry = { key: '', names: [] };
                    entryOf.set(entryEl, entry);
                    entries.push(entry);
                }
                entry.names.push(shortName(cardEl));
                pool.push({
                    group: group,
                    entry: entry,
                    nameHtml: cardEl.querySelector('.algo-name').innerHTML,
                    formula: cardEl.querySelector('.algo-formula').innerHTML
                });
            });
            entries.forEach(function (entry) { entry.key = commonLabel(entry.names); });
        });
        if (pool.length === 0) return;

        function isSelected(key) {
            return !(excluded[activeGroup] || {})[key];
        }

        // --- État du tirage ---
        var sequence = [];  // tirage sans remise du cycle en cours
        var current = null;
        var currentAuf = ''; // tiré une fois par cas
        var finished = false;
        var settingsChanged = false; // appliqué à la fermeture du panneau d'options
        var revealTimer = null;
        var cancelAnim = null;

        function cancelPending() {
            clearTimeout(revealTimer);
            if (cancelAnim) cancelAnim();
        }

        function resetDraw() {
            var inGroup = pool.filter(function (item) { return item.group === activeGroup; });
            var selected = inGroup.filter(function (item) { return isSelected(item.entry.key); });
            sequence = selected.length ? selected : inGroup;
            for (var i = sequence.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = sequence[i];
                sequence[i] = sequence[j];
                sequence[j] = tmp;
            }
            finished = false;
        }

        // --- Cube ---
        function setPlayer(setup, alg) {
            if (!playerReady(player)) return false;
            try {
                // Setup avant l'algo, par l'attribut (le setter JS n'est pas relisible)
                player.setAttribute('experimental-setup-alg', setup);
                player.alg = alg;
                return true;
            } catch (e) { return false; } // notation refusée : état précédent conservé
        }

        // Ancre en fin d'algo : le cube affiche l'état AVANT résolution
        function showCase() {
            if (!current) return;
            setPlayer(TOP_SETUPS[topColor], (currentAuf ? currentAuf + ' ' : '') + algoText(current.formula));
            rewind(player);
        }

        function play(setup, alg) {
            if (!setPlayer(setup, alg)) return;
            player.timestamp = 0;
            player.play();
        }

        // Sans AUF : l'algo d'un bloc. Avec AUF : la rotation seule (départ = état
        // affiché, via l'algo inversé en setup), AUF_PAUSE, puis l'algo.
        function reveal() {
            card.classList.add('revealed');
            var base = TOP_SETUPS[topColor];
            var algo = algoText(current.formula);
            function playAlgo() {
                play(base, algo);
                cancelAnim = afterAnimation(player, NEXT_PAUSE, NEXT_FALLBACK, newRound);
            }
            if (!currentAuf) return playAlgo();
            play(base + ' (' + algo + ")'", currentAuf);
            cancelAnim = afterAnimation(player, AUF_PAUSE, AUF_FALLBACK, playAlgo);
        }

        // (Re)lance l'inspection du cas courant : barre de progression + reveal différé
        function inspect() {
            cancelPending();
            card.classList.remove('revealed');
            progressBar.classList.remove('running');
            void progressBar.offsetWidth; // rejoue l'animation CSS depuis le début
            progressBar.style.animationDuration = revealDelay + 'ms';
            progressBar.classList.add('running');
            showCase();
            revealTimer = setTimeout(reveal, revealDelay);
        }

        // Cas suivant ; cycle épuisé = message de fin, un clic relance un cycle
        function newRound() {
            cancelPending();
            if (finished) resetDraw();
            current = sequence.shift() || null;
            finished = !current;
            card.classList.toggle('finished', finished);
            card.classList.remove('revealed');
            if (finished) {
                progressBar.classList.remove('running');
                nameEl.innerHTML = formulaEl.innerHTML = '';
                return;
            }
            currentAuf = auf ? '' : AUF_MOVES[Math.floor(Math.random() * AUF_MOVES.length)];
            nameEl.innerHTML = current.nameHtml;
            formulaEl.innerHTML = current.formula;
            inspect();
        }

        // --- Pastilles des cas ---
        function pill(label, active, onClick) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'training-pill' + (active ? ' active' : '');
            btn.textContent = label;
            btn.setAttribute('aria-pressed', String(active));
            btn.addEventListener('click', onClick);
            casesBar.appendChild(btn);
        }

        function saveCases() {
            store.set('trainingExcludedCases', JSON.stringify(excluded));
            renderCases();
            resetDraw();
            settingsChanged = true;
        }

        function renderCases() {
            var entries = entriesByGroup[activeGroup] || [];
            var selectedCount = entries.filter(function (entry) { return isSelected(entry.key); }).length;
            casesBar.innerHTML = '';
            casesBar.hidden = entries.length < 2;
            pill('Tous', selectedCount === entries.length, function () {
                if (selectedCount === entries.length) return;
                delete excluded[activeGroup];
                saveCases();
            });
            entries.forEach(function (entry) {
                pill(entry.key, isSelected(entry.key), function () {
                    var groupExcluded = (excluded[activeGroup] = excluded[activeGroup] || {});
                    if (groupExcluded[entry.key]) delete groupExcluded[entry.key];
                    else if (selectedCount > 1) groupExcluded[entry.key] = true; // au moins un cas reste
                    else return;
                    saveCases();
                });
            });
            balanceCases();
        }

        // Rangées équilibrées (ex. 6+2 -> 4+4) : mesure des pastilles sur la 1re
        // ligne puis ruptures forcées. Rejoué à l'ouverture du panneau (masqué = non mesurable).
        function balanceCases() {
            casesBar.querySelectorAll('.training-cases-break').forEach(function (el) { el.remove(); });
            var pills = casesBar.querySelectorAll('.training-pill');
            var total = pills.length;
            if (casesBar.offsetHeight === 0 || total < 3) return;
            var perRow = 0;
            while (perRow < total && pills[perRow].offsetTop === pills[0].offsetTop) perRow++;
            if (perRow >= total) return;
            var target = Math.ceil(total / Math.ceil(total / perRow));
            for (var i = target; i < total; i += target) {
                var brk = document.createElement('span');
                brk.className = 'training-cases-break';
                casesBar.insertBefore(brk, pills[i]);
            }
        }

        // --- Panneau d'options (affiché à la place du cube, tirage en pause) ---
        function setOptionsOpen(open) {
            card.classList.toggle('options-open', open);
            optionsBtn.setAttribute('aria-expanded', String(open));
        }

        optionsBtn.addEventListener('click', function () {
            if (!card.classList.contains('options-open')) {
                cancelPending();
                progressBar.classList.remove('running');
                card.classList.remove('revealed');
                setOptionsOpen(true);
                balanceCases();
                return;
            }
            setOptionsOpen(false);
            if (settingsChanged || !current) {
                settingsChanged = false;
                newRound();
            } else {
                inspect(); // rien n'a changé : on reprend le cas en cours
            }
        });

        function applyTiming() {
            timerValueEl.textContent = String(revealDelay / 1000);
            player.setAttribute('tempo-scale', String(TEMPO_BY_SECOND[revealDelay / 1000] || 1));
        }

        function adjustDelay(delta) {
            var next = Math.min(DELAY_MAX, Math.max(DELAY_MIN, revealDelay + delta));
            if (next === revealDelay) return;
            revealDelay = next;
            store.set('trainingRevealDelay', String(revealDelay));
            applyTiming();
            settingsChanged = true;
        }

        function setPressed(btn, on) {
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', String(on));
        }

        function applyView() {
            topColorBtn.textContent = topColor === 'blanc' ? 'Blanc' : 'Jaune';
            player.setAttribute('hint-facelets', backView ? 'floating' : 'none');
            setPressed(backViewBtn, backView);
            setPressed(aufBtn, auf);
        }

        document.getElementById('training-timer-minus').addEventListener('click', function () { adjustDelay(-DELAY_STEP); });
        document.getElementById('training-timer-plus').addEventListener('click', function () { adjustDelay(DELAY_STEP); });
        topColorBtn.addEventListener('click', function () {
            topColor = topColor === 'blanc' ? 'jaune' : 'blanc';
            store.set('trainingTopColor', topColor);
            applyView();
            showCase(); // réoriente le cas affiché sans toucher au cycle
        });
        backViewBtn.addEventListener('click', function () {
            backView = !backView;
            store.set('trainingBackView', backView ? '1' : '0');
            applyView();
        });
        aufBtn.addEventListener('click', function () {
            auf = !auf;
            store.set('trainingAuf', auf ? '1' : '0');
            applyView();
            settingsChanged = true;
        });

        // --- Tirage d'un nouveau cas : clic ou Entrée/Espace sur la carte ---
        card.addEventListener('click', function (event) {
            if (card.classList.contains('options-open') || event.target.closest('button')) return;
            newRound();
        });
        card.addEventListener('keydown', function (event) {
            if (event.target !== card || card.classList.contains('options-open')) return;
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            newRound();
        });

        onGroupChange = function () {
            setOptionsOpen(false);
            settingsChanged = false;
            renderCases();
            resetDraw();
            newRound();
        };

        applyTiming();
        applyView();
        renderCases();
        resetDraw();
        newRound();

        // Le module twisty arrive du CDN après ce script : repose le cas une fois
        // l'élément défini (tempo d'abord, il conditionne la durée lue)
        if (window.customElements) {
            customElements.whenDefined('twisty-player').then(function () {
                applyTiming();
                showCase();
            });
        }
    })();
})();
