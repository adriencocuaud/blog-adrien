// Détecte les cartes ayant une formule alternative (.algo-formula.algo-alt) et
// leur ajoute un sticker "CMLL"/"COLL" pour basculer entre les deux formules
(function () {
    document.querySelectorAll('.algo-card').forEach(function (card) {
        if (!card.querySelector('.algo-formula.algo-alt')) return;

        var btn = document.createElement('button');
        btn.className = 'toggle';
        btn.textContent = 'CMLL';
        btn.addEventListener('click', function () {
            var active = card.classList.toggle('showing-alt');
            btn.textContent = active ? 'COLL' : 'CMLL';
        });

        card.querySelector('.algo-name').appendChild(btn);
    });
})();
