document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');

    if (!track) return;

    // Array de youtubers
    const youtubers = [
        { name: 'El Rubius', img: './RECURSOS/youtubers/slider/rubius.png' },
        { img: './RECURSOS/youtubers/slider/auronplay.png' },
        { img: './RECURSOS/youtubers/slider/wismichu.png' },
        { img: './RECURSOS/youtubers/slider/dulceida.png' },
        { img: './RECURSOS/youtubers/slider/giorgio.png' },
        { img: './RECURSOS/youtubers/slider/gref.png' },
        { img: './RECURSOS/youtubers/slider/laubalo.png' },
        { img: './RECURSOS/youtubers/slider/willyrex.png' },
        { img: './RECURSOS/youtubers/slider/alexby.png' },
        { img: './RECURSOS/youtubers/slider/yuya.png' },
        { img: './RECURSOS/youtubers/slider/ocho.png' },
        { img: './RECURSOS/youtubers/slider/vegetta.png' }
    ];

    // Duplica les imatges 3 vegades per crear l'efecte infinit
    const extendedYoutubers = [...youtubers, ...youtubers, ...youtubers];

    // Genera el HTML de les imatges
    extendedYoutubers.forEach(yt => {
        const figure = document.createElement('figure');
        figure.className = 'carousel-slide text-center flex-shrink-0 m-0';
        figure.innerHTML = `
            <img class="img-fluid" src="${yt.img}" alt="${yt.name}" style="width: 15rem; height: auto; object-fit: cover;">
        `;
        track.appendChild(figure);
    });

    const slides = Array.from(track.children);
    const slideWidth = 240 + 24; // 15rem (240px) + gap (24px)
    const totalSlides = youtubers.length;
    
    let currentIndex = totalSlides; // Comença al segon grup (per poder anar enrere)
    let isTransitioning = false;

    // Posiciona al segon grup inicialment (sense animació)
    track.style.transition = 'none';
    track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
    
    // Reactiva la transició després d'un frame
    setTimeout(() => {
        track.style.transition = 'transform 0.5s ease-in-out';
    }, 50);

    function moveToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;

        track.style.transform = `translateX(-${slideWidth * index}px)`;
        currentIndex = index;

        // Quan acaba la transició, comprova si cal fer el "salt" invisible
        setTimeout(() => {
            // Si ens hem desplaçat al tercer grup (dreta extrema), salta a l'equivalent del grup del mig
            if (currentIndex >= totalSlides * 2) {
                track.style.transition = 'none';
                currentIndex = currentIndex - totalSlides; // mapeja a l'equivalent al grup central
                track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
                setTimeout(() => {
                    track.style.transition = 'transform 0.5s ease-in-out';
                }, 50);
            }
            // Si ens hem desplaçat al primer grup (esquerra extrema), salta a l'equivalent del grup del mig
            else if (currentIndex < totalSlides) {
                track.style.transition = 'none';
                currentIndex = currentIndex + totalSlides; // mapeja a l'equivalent al grup central
                track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
                setTimeout(() => {
                    track.style.transition = 'transform 0.5s ease-in-out';
                }, 50);
            }
            isTransitioning = false;
        }, 500); // Temps de la transició CSS
    }

    nextBtn.addEventListener('click', () => {
        moveToSlide(currentIndex + 1);
    });

    prevBtn.addEventListener('click', () => {
        moveToSlide(currentIndex - 1);
    });
});