// Animations de révélation au scroll
document.addEventListener('DOMContentLoaded', () => {
    const titles = document.querySelectorAll('.section-title');
    if (titles.length) {
        const titleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-in');
                    titleObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0 });
        titles.forEach(t => titleObserver.observe(t));
    }

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

    const map = document.querySelector('#travel-map');
    if (map) {
        const mapObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('map-reveal');
                    mapObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        mapObserver.observe(map);
    }
});
