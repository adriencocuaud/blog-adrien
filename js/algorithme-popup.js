// Popup démo : un clic sur une carte .algo-card ouvre un cube 3D (jaune dessus,
// faces arrière en fantôme) qui joue l'algorithme en vitesse lente, puis revient
// au cas de départ POPUP_RESET_DELAY après la fin ; la popup reste ouverte.
(function () {
    var POPUP_TEMPO = 1; // plus lent que le mode "lent" de l'entraînement (1.2)
    var POPUP_START_DELAY = 600; // le cas reste visible avant de lancer l'animation
    var POPUP_RESET_DELAY = 200; // retour au cas de départ après la fin de l'animation
    var POPUP_FALLBACK = 8000; // repli si la durée de l'animation n'est pas lisible
    var POPUP_MAX_DELAY = 30000; // garde-fou

    var cards = document.querySelectorAll('.algo-group .algo-card');
    if (cards.length === 0) return;

    var overlay = document.createElement('div');
    overlay.className = 'algo-popup';
    overlay.hidden = true;
    overlay.innerHTML =
        '<div class="algo-popup-box" role="dialog" aria-modal="true">' +
            '<button type="button" class="algo-popup-close" aria-label="Fermer">&times;</button>' +
            '<twisty-player class="algo-popup-3d" puzzle="3x3x3" control-panel="none"' +
            ' background="none" hint-facelets="floating" experimental-setup-anchor="end"' +
            ' experimental-setup-alg="x2" camera-latitude="38" camera-longitude="30"' +
            ' tempo-scale="' + POPUP_TEMPO + '"></twisty-player>' +
            '<p class="algo-name algo-popup-name"></p>' +
            '<p class="algo-formula algo-popup-formula"></p>' +
        '</div>';
    document.body.appendChild(overlay);

    var popupPlayer = overlay.querySelector('.algo-popup-3d');
    var popupName = overlay.querySelector('.algo-popup-name');
    var popupFormula = overlay.querySelector('.algo-popup-formula');
    var popupTimers = [];
    var popupToken = 0;

    // Texte brut de la formule : triggers + <sup> = notation cubing.js
    var popupBuffer = document.createElement('div');
    function popupAlgoText(formulaHtml) {
        popupBuffer.innerHTML = formulaHtml;
        return popupBuffer.textContent.replace(/\s+/g, ' ').trim();
    }

    function popupReady() {
        return typeof popupPlayer.play === 'function';
    }

    function clearPopupTimers() {
        popupTimers.forEach(clearTimeout);
        popupTimers = [];
        popupToken++;
    }

    function closePopup() {
        clearPopupTimers();
        overlay.hidden = true;
        if (popupReady()) try { popupPlayer.pause(); } catch (e) { /* ignore */ }
    }

    // Remet le cube sur le cas de départ (état avant algo), popup ouverte
    function resetPopupCube() {
        try {
            popupPlayer.pause();
            popupPlayer.timestamp = 0;
        } catch (e) { /* ignore */ }
    }

    function scheduleReset(token) {
        popupTimers.push(setTimeout(resetPopupCube, POPUP_FALLBACK + POPUP_RESET_DELAY));
        try {
            var model = popupPlayer.experimentalModel;
            Promise.all([model.timeRange.get(), model.tempoScale.get()]).then(function (values) {
                if (token !== popupToken) return;
                var duration = (values[0].end - values[0].start) / (parseFloat(values[1]) || 1);
                popupTimers.forEach(clearTimeout); // remplace le repli, même tour
                popupTimers = [];
                popupTimers.push(setTimeout(resetPopupCube, Math.min(Math.max(0, duration), POPUP_MAX_DELAY) + POPUP_RESET_DELAY));
            })['catch'](function () { /* repli déjà armé */ });
        } catch (e) { /* repli déjà armé */ }
    }

    function openPopup(cardEl) {
        var formulaEl = cardEl.querySelector('.algo-formula');
        var nameEl = cardEl.querySelector('.algo-name');
        if (!formulaEl) return;
        clearPopupTimers();
        var token = popupToken;

        popupName.innerHTML = nameEl ? nameEl.innerHTML : '';
        popupFormula.innerHTML = formulaEl.innerHTML;
        overlay.hidden = false;

        if (!popupReady()) return; // CDN injoignable : formule seule, fermeture au clic
        try {
            popupPlayer.alg = popupAlgoText(formulaEl.innerHTML);
            popupPlayer.pause();
            popupPlayer.timestamp = 0;
        } catch (e) { return; }

        popupTimers.push(setTimeout(function () {
            if (token !== popupToken) return;
            try {
                popupPlayer.timestamp = 0;
                popupPlayer.play();
            } catch (e) { /* ignore */ }
            scheduleReset(token);
        }, POPUP_START_DELAY));
    }

    cards.forEach(function (cardEl) {
        cardEl.addEventListener('click', function () { openPopup(cardEl); });
    });
    // Fermeture : la croix, ou un clic sur le fond hors de la fenêtre
    overlay.querySelector('.algo-popup-close').addEventListener('click', closePopup);
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) closePopup();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !overlay.hidden) closePopup();
    });
})();
