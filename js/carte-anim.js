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

// Rendre les cartes focusables pour le click CSS
document.querySelectorAll('.article-card').forEach(card => card.tabIndex = 0);

