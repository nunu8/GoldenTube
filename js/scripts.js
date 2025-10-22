document.addEventListener('DOMContentLoaded', function () {
    var youtuberCarouselElement = document.getElementById('youtuberCarousel');
    if (!youtuberCarouselElement) return;

    var youtuberCarousel = new bootstrap.Carousel(youtuberCarouselElement, {
        interval: false, 
        wrap: true       
    });

    var allItems = youtuberCarouselElement.querySelectorAll('.carousel-item');
    var totalItems = allItems.length;

    // Afegim un listener de CLIC a les fletxes
    youtuberCarouselElement.querySelectorAll('.carousel-control-prev, .carousel-control-next')
        .forEach(control => {
            control.addEventListener('click', function (e) {
                e.preventDefault(); 
                
                var activeItem = youtuberCarouselElement.querySelector('.carousel-item.active');
                var activeIndex = Array.from(allItems).indexOf(activeItem);
                
                var newIndex;

                if (control.classList.contains('carousel-control-next')) {
                    // Moure al següent ítem
                    newIndex = (activeIndex + 1);
                    if (newIndex >= totalItems) newIndex = 0; // Torna a començar
                } else {
                    // Moure a l'ítem anterior
                    newIndex = (activeIndex - 1);
                    if (newIndex < 0) newIndex = totalItems - 1; // Torna a començar per l'últim
                }
                
                // Mou l'slider al nou ítem
                youtuberCarousel.to(newIndex);
            });
        });
});