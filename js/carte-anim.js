// Animation au scroll (titre + cards)
const articlesTitle = document.querySelector('.articles-section h2');
const cards = document.querySelectorAll('.article-card');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Titre : animation clip-path
            if (entry.target.tagName === 'H2') {
                entry.target.classList.add('reveal-in');
            } else {
                entry.target.classList.add('visible');
            }
            // Ne plus observer une fois visible
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
});

if (articlesTitle) observer.observe(articlesTitle);
cards.forEach(card => observer.observe(card));
