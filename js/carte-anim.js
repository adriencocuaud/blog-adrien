// Configuration des sujets
const topics = [
    { title: 'Pérégrinations', bg: 'images/neige.jpg' },
    { title: 'Littérature', bg: 'images/map.jpg' }
];

let currentTopicIndex = 0;
let isTransitioning = false;

// Éléments du DOM
const topicTitle = document.querySelector('.topic-title');
const topicElements = document.querySelectorAll('.topic');
const articlesSection = document.querySelector('.articles-section');
const arrowLeft = document.querySelector('.topic-arrow-left');
const arrowRight = document.querySelector('.topic-arrow-right');

// Navigation entre sujets
function switchTopic(direction) {
    if (isTransitioning) return;
    isTransitioning = true;

    const currentTopic = topicElements[currentTopicIndex];
    const exitClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const enterClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    // Calculer le nouvel index
    currentTopicIndex = direction === 'next'
        ? (currentTopicIndex + 1) % topics.length
        : (currentTopicIndex - 1 + topics.length) % topics.length;

    const newTopic = topicElements[currentTopicIndex];

    // Animation de sortie (cartes + titre synchronisés)
    currentTopic.classList.add(exitClass);
    topicTitle.classList.add(exitClass);

    setTimeout(() => {
        // Changer le texte du titre
        topicTitle.textContent = topics[currentTopicIndex].title;
        topicTitle.classList.remove(exitClass);

        // Changer le background
        articlesSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${topics[currentTopicIndex].bg})`;

        // Animation d'entrée (cartes + titre synchronisés)
        currentTopic.classList.remove('active', exitClass);
        newTopic.classList.add('active', enterClass);
        topicTitle.classList.add(enterClass);

        setTimeout(() => {
            newTopic.classList.remove(enterClass);
            topicTitle.classList.remove(enterClass);
            isTransitioning = false;
        }, 500);
    }, 400);
}

// Event listeners
arrowLeft?.addEventListener('click', () => switchTopic('prev'));
arrowRight?.addEventListener('click', () => switchTopic('next'));

// Gestion de l'expansion des cartes au clic avec animation FLIP
function initCardExpansion() {
    const cards = document.querySelectorAll('.article-card');

    cards.forEach((card, index) => {
        card.addEventListener('click', (e) => {
            // Éviter de suivre le lien si présent
            if (e.target.tagName === 'A') return;

            const isExpanded = card.classList.contains('expanded');

            // FLIP: First - Capturer les positions initiales
            const positions = new Map();
            cards.forEach(c => {
                const rect = c.getBoundingClientRect();
                positions.set(c, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
            });

            // Retirer l'expansion et styles de toutes les cartes
            cards.forEach(c => {
                c.classList.remove('expanded', 'expand-left');
                c.style.gridRow = '';
                c.style.gridColumn = '';
            });

            // Si la carte n'était pas déjà agrandie, l'agrandir
            if (!isExpanded) {
                card.classList.add('expanded');

                // Calculer la rangée actuelle (1-indexed)
                const row = Math.floor(index / 3) + 1;
                // Calculer la colonne actuelle (1-indexed)
                const col = (index % 3) + 1;

                // Forcer la carte à rester sur sa rangée (span 2)
                card.style.gridRow = `${row} / ${row + 2}`;

                // Si dernière colonne, s'étendre vers la gauche
                if (col === 3) {
                    card.style.gridColumn = '2 / 4';
                }
            }

            // FLIP: Last & Invert & Play - Animer vers les nouvelles positions
            requestAnimationFrame(() => {
                cards.forEach(c => {
                    const oldPos = positions.get(c);
                    const newRect = c.getBoundingClientRect();

                    const deltaX = oldPos.left - newRect.left;
                    const deltaY = oldPos.top - newRect.top;
                    const scaleX = oldPos.width / newRect.width;
                    const scaleY = oldPos.height / newRect.height;

                    // Appliquer la transformation inverse
                    c.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
                    c.style.transformOrigin = 'top left';
                    c.style.transition = 'none';

                    // Forcer un reflow
                    c.offsetHeight;

                    // Animer vers la position finale
                    c.style.transition = 'transform 0.4s ease';
                    c.style.transform = '';
                });

                // Nettoyer après l'animation
                setTimeout(() => {
                    cards.forEach(c => {
                        c.style.transition = '';
                        c.style.transformOrigin = '';
                    });
                }, 400);
            });
        });
    });
}

// Initialiser l'expansion des cartes
initCardExpansion();
