// Configuration des sujets
const topics = ['Explorations', 'Littérature'];

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
    const exitClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const enterClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    // Calculer le nouvel index
    currentTopicIndex = direction === 'next'
        ? (currentTopicIndex + 1) % topics.length
        : (currentTopicIndex - 1 + topics.length) % topics.length;

    const newTopic = topicElements[currentTopicIndex];

    // Animation de sortie
    currentTopic.classList.add(exitClass);
    topicTitle.style.opacity = '0';

    setTimeout(() => {
        topicTitle.textContent = topics[currentTopicIndex];
        topicTitle.style.opacity = '1';

        currentTopic.classList.remove('active', exitClass);
        newTopic.classList.add('active', enterClass);

        setTimeout(() => {
            newTopic.classList.remove(enterClass);
            isTransitioning = false;
        }, 500);
    }, 400);
}

// Event listeners
arrowLeft?.addEventListener('click', () => switchTopic('prev'));
arrowRight?.addEventListener('click', () => switchTopic('next'));
