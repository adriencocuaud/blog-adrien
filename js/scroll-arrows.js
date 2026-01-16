// Scroll horizontal au hover sur les flèches
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.sections-access');
    const leftArrow = document.querySelector('.scroll-arrow-left');
    const rightArrow = document.querySelector('.scroll-arrow-right');

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
