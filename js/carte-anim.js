// Configuration des sujets
const topics = [
    { id: 'explorations', title: 'Explorations' },
    { id: 'litterature', title: 'Littérature' }
];

let currentTopicIndex = 0;
let isTransitioning = false;

// Éléments du DOM
const topicTitle = document.querySelector('.topic-title');
const topicElements = document.querySelectorAll('.topic');
const arrowLeft = document.querySelector('.topic-arrow-left');
const arrowRight = document.querySelector('.topic-arrow-right');

// Navigation entre sujets
function switchTopic(direction) {
    if (isTransitioning) return;
    isTransitioning = true;

    const currentTopic = topicElements[currentTopicIndex];

    // Calculer le nouvel index
    if (direction === 'next') {
        currentTopicIndex = (currentTopicIndex + 1) % topics.length;
    } else {
        currentTopicIndex = (currentTopicIndex - 1 + topics.length) % topics.length;
    }

    const newTopic = topicElements[currentTopicIndex];

    // Classes d'animation selon la direction
    const exitClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const enterClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    // Animation de sortie (garder active pendant l'anim)
    currentTopic.classList.add(exitClass);

    // Animer le titre
    topicTitle.style.opacity = '0';

    setTimeout(() => {
        // Mettre à jour le titre
        topicTitle.textContent = topics[currentTopicIndex].title;
        topicTitle.style.opacity = '1';

        // Nettoyer l'ancien sujet
        currentTopic.classList.remove('active', exitClass);

        // Activer le nouveau sujet avec animation d'entrée
        newTopic.classList.add('active', enterClass);

        // Nettoyer les classes d'animation après la fin
        setTimeout(() => {
            newTopic.classList.remove(enterClass);
            isTransitioning = false;
        }, 500);

    }, 400);
}

// Event listeners pour les flèches
if (arrowLeft) {
    arrowLeft.addEventListener('click', () => switchTopic('prev'));
}

if (arrowRight) {
    arrowRight.addEventListener('click', () => switchTopic('next'));
}
