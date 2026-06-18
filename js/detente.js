// Détente — interactions colonnes Jeux / Sports
(function () {
    const hero = document.querySelector('.detente-hero');
    const detail = document.getElementById('jeuDetail');
    const sportTitle = document.getElementById('sportTitle');

    // Transition : sortie (si un contenu est déjà affiché) → swap → entrée.
    // Même esprit que l'animation d'entrée au chargement (fondu + glissement).
    function transition(el, swap, hasCurrent) {
        const enter = () => {
            swap();
            el.classList.remove('anim-out');
            void el.offsetWidth;          // reflow → rejoue l'animation
            el.classList.add('anim-in');
        };
        el.classList.remove('anim-in');
        if (!hasCurrent) { enter(); return; }
        void el.offsetWidth;
        el.classList.add('anim-out');
        el.addEventListener('animationend', enter, { once: true });
    }

    // ===== SPORTS — diaporama (titre = sport actif, liste = 3 suivants en cycle) =====
    const SLIDESHOW_MS = 10000;
    const VISIBLE_SPORT_COUNT = 3;
    const sportItems = Array.from(document.querySelectorAll('.sport-item'));
    const sports = sportItems.map(it => ({
        el: it,
        name: it.querySelector('.item-nom').textContent.trim(),
        src: it.querySelector('.sport-img').getAttribute('src'),
    }));

    let activeIndex = -1;
    let timer = null;

    function renderSportList() {
        const visibleIndexes = new Set();
        const visibleCount = Math.min(VISIBLE_SPORT_COUNT, Math.max(sports.length - 1, 0));

        for (let offset = 1; offset <= visibleCount; offset += 1) {
            visibleIndexes.add((activeIndex + offset) % sports.length);
        }

        sports.forEach((s, idx) => {
            s.el.classList.toggle('actif', idx === activeIndex);
            s.el.classList.toggle('visible', visibleIndexes.has(idx));
        });
    }

    function showSport(i, animate) {
        if (!sports.length || i === activeIndex) return;
        activeIndex = i;
        const sport = sports[i];

        if (detail) detail.hidden = true;
        if (hero) hero.hidden = false;

        if (animate) {
            if (hero) {
                new Image().src = sport.src; // préchargement
                transition(hero, () => { hero.src = sport.src; hero.alt = sport.name; }, true);
            }
            if (sportTitle) transition(sportTitle, () => { sportTitle.textContent = sport.name; }, true);
        } else {
            if (hero) { hero.src = sport.src; hero.alt = sport.name; }
            if (sportTitle) sportTitle.textContent = sport.name;
        }

        renderSportList();
    }

    function startTimer() {
        if (sports.length < 2) return;
        clearInterval(timer);
        timer = setInterval(() => showSport((activeIndex + 1) % sports.length, true), SLIDESHOW_MS);
    }

    sportItems.forEach((it, idx) => {
        it.addEventListener('click', () => { showSport(idx, true); startTimer(); });
    });

    if (sports.length) {
        // actif initial = sport correspondant au nom de l'image centrale, sinon à son src, sinon le premier
        let start = hero ? sports.findIndex(s => s.name === hero.alt) : 0;
        if (start < 0 && hero) start = sports.findIndex(s => hero.src.endsWith(s.src));
        if (start < 0) start = 0;
        showSport(start, false);
        startTimer();
    }

    // ===== JEUX — le contenu remplace l'image centrale =====
    document.querySelectorAll('.jeu-item').forEach(item => {
        item.addEventListener('click', () => {
            const content = item.querySelector('.jeu-content');
            if (!content || !detail || !hero) return;
            const hadContent = !detail.hidden;
            clearInterval(timer);

            transition(detail, () => {
                detail.innerHTML = content.innerHTML;
                hero.hidden = true;
                detail.hidden = false;
            }, hadContent);

            document.querySelectorAll('.jeu-item').forEach(j => j.classList.remove('actif'));
            item.classList.add('actif');
        });
    });
})();
