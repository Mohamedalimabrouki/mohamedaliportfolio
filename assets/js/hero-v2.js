document.addEventListener('DOMContentLoaded', () => {
    const animatedList = document.querySelector('.fade-in-up-v2');

    if (!animatedList) return;

    const listItems = animatedList.querySelectorAll('li');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                listItems.forEach((item, index) => {
                    item.style.transitionDelay = `${index * 150}ms`;
                    item.classList.add('is-visible');
                });
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    observer.observe(animatedList);
});