document.addEventListener('DOMContentLoaded', () => {
    const bookCards = document.querySelectorAll('.book-card');

    bookCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });
});
