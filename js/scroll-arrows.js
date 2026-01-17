// Scroll horizontal au hover sur les flèches
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.sections-access');
    const leftArrow = document.querySelector('.scroll-arrow-left');
    const rightArrow = document.querySelector('.scroll-arrow-right');
    const title = document.querySelector('.sections-access-title');

    // Animation du titre au scroll
    if (title) {
        const titleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    title.classList.add('reveal-in');
                    titleObserver.unobserve(title);
                }
            });
        }, { threshold: 0 });
        titleObserver.observe(title);
    }

    // Animation des cartes en slide-up
    const cards = document.querySelectorAll('.section-link-card');
    if (cards.length) {
        const cardsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('slide-up');
                    }, index * 150);
                    cardsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0 });
        cards.forEach(card => cardsObserver.observe(card));
    }

    if (!container || !leftArrow || !rightArrow) return;

    let animationId = null;

    function scroll(direction) {
        container.scrollLeft += direction * 5;
        animationId = requestAnimationFrame(() => scroll(direction));
    }

    function stop() {
        cancelAnimationFrame(animationId);
    }

    function updateArrows() {
        const atStart = container.scrollLeft <= 5;
        const atEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 5;

        leftArrow.style.opacity = atStart ? '0' : '';
        leftArrow.style.pointerEvents = atStart ? 'none' : '';
        rightArrow.style.opacity = atEnd ? '0' : '';
        rightArrow.style.pointerEvents = atEnd ? 'none' : '';
    }

    leftArrow.onmouseenter = () => scroll(-1);
    leftArrow.onmouseleave = stop;
    rightArrow.onmouseenter = () => scroll(1);
    rightArrow.onmouseleave = stop;

    container.addEventListener('scroll', updateArrows);
    updateArrows();
});
