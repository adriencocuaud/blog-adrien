// Switch OLL / PLL : n'affiche que le groupe .algo-group[data-group] choisi.
(function () {
    var switchEl = document.getElementById('group-switch');
    if (!switchEl) return;
    var switchButtons = switchEl.querySelectorAll('.group-switch-option');
    var switchThumb = switchEl.querySelector('.group-switch-thumb');
    var groupSections = document.querySelectorAll('.algo-group[data-group]');

    var activeGroup = null;
    switchButtons.forEach(function (btn) {
        if (btn.classList.contains('active')) activeGroup = btn.getAttribute('data-group');
    });

    // Curseur positionné selon le nombre réel de boutons
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

    function updateGroupSections() {
        groupSections.forEach(function (section) {
            section.hidden = section.getAttribute('data-group') !== activeGroup;
        });
    }

    // Fige l'état final de l'animation d'apparition : réafficher un groupe
    // masqué ne doit pas la rejouer (un groupe masqué avant la fin de son
    // animation ne déclenche jamais "animationend", d'où le délai fixe).
    setTimeout(function () {
        groupSections.forEach(function (group) {
            group.style.animation = 'none';
            group.style.opacity = '1';
            group.style.transform = 'none';
        });
    }, 2500);

    switchButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var key = btn.getAttribute('data-group');
            if (key === activeGroup) return;
            activeGroup = key;
            switchButtons.forEach(function (b) {
                var isActive = b.getAttribute('data-group') === activeGroup;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-checked', String(isActive));
            });
            switchEl.setAttribute('data-active', activeGroup);
            updateSwitchThumb();
            updateGroupSections();
        });
    });

    updateSwitchThumb();
    updateGroupSections();
})();
