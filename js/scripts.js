document.addEventListener('DOMContentLoaded', function () {
    // Element DOM del carrusel
    const pista = document.querySelector('.carousel-track');
    const botoAnterior = document.querySelector('.carousel-btn-prev');
    const botoSeguent = document.querySelector('.carousel-btn-next');

    if (!pista) return;

    // Les slides ara estan declarades a l'HTML (cada figura té una estructura flip-card amb front i back)
    // Agafem les slides inicials del DOM i fem dues còpies més per crear l'efecte infinit (3 grups)
    const slidesInicials = Array.from(pista.querySelectorAll('.carousel-slide'));
    const totalDiapositives = slidesInicials.length;

    // Estat de la Mega-Targeta oberta
    let megaOpen = false;
    let megaState = null; // { overlay, mega, body, currentIndex, activeNode }

    // Clona el conjunt inicial dues vegades (appendNode clones) per obtenir 3 grups consecutius
    for (let i = 0; i < 2; i++) {
        slidesInicials.forEach(s => {
            const clone = s.cloneNode(true);
            pista.appendChild(clone);
        });
    }

    // Funció per afegir handlers de flip a les targetes que ja estan a l'HTML
    function configurarHandlersFlip() {
        const flipCards = pista.querySelectorAll('.flip-card');
        flipCards.forEach(flipCard => {
            const inner = flipCard.querySelector('.flip-card-inner');
            const frontImg = flipCard.querySelector('.flip-card-front img');
            const backImg = flipCard.querySelector('.flip-card-back img');

            // Assegura estils necessaris per a l'efecte flip i ajusta alçades després de carregar la imatge frontal
            // Estils per a la rotació (es fan per JS per no dependre de CSS extern)
            if (inner) {
                inner.style.transition = inner.style.transition || 'transform 0.6s';
                inner.style.transformStyle = inner.style.transformStyle || 'preserve-3d';
                inner.style.position = inner.style.position || 'relative';
            }
            const front = flipCard.querySelector('.flip-card-front');
            const back = flipCard.querySelector('.flip-card-back');
            if (front) {
                front.style.backfaceVisibility = front.style.backfaceVisibility || 'hidden';
                front.style.position = front.style.position || 'relative';
            }
            if (back) {
                back.style.backfaceVisibility = back.style.backfaceVisibility || 'hidden';
                back.style.transform = back.style.transform || 'rotateY(180deg)';
                back.style.position = back.style.position || 'absolute';
                back.style.top = back.style.top || '0';
                back.style.left = back.style.left || '0';
            }

            // Ajusta alçades després de carregar la imatge frontal
            function adjustHeights() {
                const h = frontImg.getBoundingClientRect().height;
                if (h && h > 0) {
                    inner.style.height = h + 'px';
                    flipCard.style.height = h + 'px';
                    const front = flipCard.querySelector('.flip-card-front');
                    const back = flipCard.querySelector('.flip-card-back');
                    if (front) front.style.height = h + 'px';
                    if (back) back.style.height = h + 'px';
                }
            }

            if (frontImg.complete) adjustHeights();
            else frontImg.addEventListener('load', adjustHeights);

            function flipToBack() { inner.style.transform = 'rotateY(180deg)'; }
            function flipToFront() { inner.style.transform = 'rotateY(0deg)'; }

            flipCard.addEventListener('mouseenter', flipToBack);
            flipCard.addEventListener('mouseleave', flipToFront);
            flipCard.addEventListener('focus', flipToBack);
            flipCard.addEventListener('blur', flipToFront);
            flipCard.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'a') return;
                const rotated = inner.style.transform && inner.style.transform.indexOf('180') !== -1;
                if (rotated) flipToFront(); else flipToBack();
            });
        });
    }

    // Configura handlers a les targetes originals i també a les còpies (ja afegides)
    configurarHandlersFlip();

    const diapositives = Array.from(pista.children);
    const ampladaSlide = 240 + 24; // 15rem (240px) + gap (24px)

    let indexActual = totalDiapositives; // Comença al segon grup (per poder anar enrere)
    let enTransicio = false;

    // Posiciona al segon grup inicialment (sense animació)
    pista.style.transition = 'none';
    pista.style.transform = `translateX(-${ampladaSlide * indexActual}px)`;

    // Reactiva la transició després d'un frame
    setTimeout(() => {
        pista.style.transition = 'transform 0.5s ease-in-out';
    }, 50);

    function moureAlaSlide(index) {
        if (enTransicio) return;
        enTransicio = true;

        pista.style.transform = `translateX(-${ampladaSlide * index}px)`;
        indexActual = index;

        // Quan acaba la transició, comprova si cal fer el "salt" invisible
        setTimeout(() => {
            // Si ens hem desplaçat al tercer grup (dreta extrema), salta a l'equivalent del grup del mig
            if (indexActual >= totalDiapositives * 2) {
                pista.style.transition = 'none';
                indexActual = indexActual - totalDiapositives; // mapeja a l'equivalent al grup central
                pista.style.transform = `translateX(-${ampladaSlide * indexActual}px)`;
                setTimeout(() => {
                    pista.style.transition = 'transform 0.5s ease-in-out';
                }, 50);
            }
            // Si ens hem desplaçat al primer grup (esquerra extrema), salta a l'equivalent del grup del mig
            else if (indexActual < totalDiapositives) {
                pista.style.transition = 'none';
                indexActual = indexActual + totalDiapositives; // mapeja a l'equivalent al grup central
                pista.style.transform = `translateX(-${ampladaSlide * indexActual}px)`;
                setTimeout(() => {
                    pista.style.transition = 'transform 0.5s ease-in-out';
                }, 50);
            }
            enTransicio = false;
        }, 500); // Temps de la transició CSS
    }

    // Mou el carrusel a un index concret (index en el DOM de children), amb reintents si està en transició
    function moveCarouselToIndex(targetIndex) {
        if (!pista) return;
        if (!enTransicio) {
            moureAlaSlide(targetIndex);
        } else {
            // reintentar lleugerament després si el carrusel està en transició
            setTimeout(() => moveCarouselToIndex(targetIndex), 120);
        }
    }

    botoSeguent.addEventListener('click', () => {
        if (megaOpen) {
            navigateMega(1);
        } else {
            moureAlaSlide(indexActual + 1);
        }
    });

    botoAnterior.addEventListener('click', () => {
        if (megaOpen) {
            navigateMega(-1);
        } else {
            moureAlaSlide(indexActual - 1);
        }
    });

    // GSAP: scroll inici de pàgina logo footer
    try {
        // Registrar ScrollToPlugin si GSAP està disponible
        if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
            gsap.registerPlugin(ScrollToPlugin);
        }
    } catch (err) {
        // ignore if gsap isn't loaded
        // console.warn('GSAP no disponible:', err);
    }

    const footerLogo = document.querySelector('.fotopeudepagina');
    if (footerLogo) {
        footerLogo.addEventListener('click', (e) => {
            // Evita la navegació per defecte si el logo apunta a index.html
            e.preventDefault();
            // Usa GSAP ScrollToPlugin si està disponible, sinó fallback a scroll natiu suau
            if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
                gsap.to(window, { duration: 0.8, ease: 'power2.out', scrollTo: { y: 0, autoKill: false } });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Botons 'Play' sota cada flip-card: obre la "Mega-Targeta" centrada amb animació i enfosqueix la resta
    function openMegaCard(figure, name, frontSrc, backSrc, detailId) {
        // si GSAP no està disponible, fem un fallback senzill amb window.open
        if (typeof gsap === 'undefined') {
            openYtPopupFallback(name, frontSrc);
            return;
        }

        const rect = figure.getBoundingClientRect();
        // Marca la figura com a activa per tenir control CSS si cal
        figure.classList.add('active-zoom');
        // Dima la pista
        pista.classList.add('dimmed');

        // Crea overlay i mega-card
        const overlay = document.createElement('div');
        overlay.className = 'mega-overlay';

    const mega = document.createElement('div');
    mega.className = 'mega-card p-4 bg-secondary text-white rounded-4 text-center container my-5';
        // posició inicial igual que la figura (fixed coordinates)
        mega.style.left = rect.left + 'px';
        mega.style.top = rect.top + 'px';
        mega.style.width = rect.width + 'px';
        mega.style.height = rect.height + 'px';

        // Contingut de la mega-card
        const closeBtn = document.createElement('button');
        closeBtn.className = 'mega-close';
        closeBtn.innerHTML = 'Tancar ✕';

        const body = document.createElement('div');
        body.className = 'mega-body';

        mega.appendChild(closeBtn);
        mega.appendChild(body);

        // Afegim el loading GIF immediatament perquè es mostri durant l'animació
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'mega-loading';
        // Si tens un altre path, el podem canviar fàcilment
        const loadingImg = document.createElement('img');
        loadingImg.src = './RECURSOS/youtubers/slider/loading.gif';
        loadingImg.alt = 'Carregant...';
        loadingDiv.appendChild(loadingImg);
        body.appendChild(loadingDiv);

        overlay.appendChild(mega);
        document.body.appendChild(overlay);

        // Determina l'índex original de la slide clicada per poder navegar dins la mega
        function findOriginalIndexFromFigure(fig) {
            try {
                const img = fig.querySelector('.flip-card-front img');
                const src = img ? img.src : null;
                if (!src) return 0;
                return slidesInicials.findIndex(s => {
                    const sImg = s.querySelector('.flip-card-front img');
                    return sImg && sImg.src === src;
                });
            } catch (e) { return 0; }
        }

        const origIndex = findOriginalIndexFromFigure(figure);
        const centralIdx = totalDiapositives + (origIndex >= 0 ? origIndex : 0);
        const centralNode = pista.children[centralIdx];
        if (centralNode) {
            // marquem el node central equivalent com a actiu visual
            centralNode.classList.add('active-zoom');
        }

        // Guarda l'estat global perquè les fletxes puguin navegar entre youtubers
        megaOpen = true;
        megaState = {
            overlay,
            mega,
            body,
            currentIndex: (origIndex >= 0 ? origIndex : 0),
            activeNode: centralNode || figure
        };

        // calcular objectiu centrat
        const targetWidth = Math.min(window.innerWidth * 0.9, 900);
        const targetHeight = Math.min(window.innerHeight * 0.85, Math.max(rect.height, 500));
        const targetLeft = (window.innerWidth - targetWidth) / 2;
        const targetTop = (window.innerHeight - targetHeight) / 2;

    // Apliquem la classe CSS .dimmed al track per enfosquir/desenfocar les slides no actives
    // Evitem usar GSAP per aplicar filtres en línia perquè deixin estils incrustats que poden causar "ghost blur".
    // pista.classList.add('dimmed'); // ja s'ha afegit abans


        // anima la mega-card des del rect d'origen al centre (width/height/left/top)
        gsap.to(mega, {
            duration: 0.55,
            ease: 'power3.out',
            left: targetLeft,
            top: targetTop,
            width: targetWidth,
            height: targetHeight,
            onComplete: () => {
                // Després d'una petita espera mostrem el contingut (simulem càrrega)
                const showDelay = 850; // ms
                setTimeout(() => {
                    // Removem el loading
                    if (loadingDiv && loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);

                    // Funció que insereix el contingut real (clonat) dins la mega-body
                    function insertContent() {
                        // Neteja el body abans d'afegir contingut
                        body.innerHTML = '';

                        if (detailId) {
                            const placeholder = document.getElementById(detailId);
                            if (placeholder) {
                                const clone = placeholder.cloneNode(true);
                                clone.classList.remove('d-none');
                                clone.removeAttribute('id');
                                clone.classList.add('mega-detail-clone');
                                body.appendChild(clone);

                                // Animació de dalt cap a baix per al contingut inserit
                                const targets = body.querySelectorAll('.mega-detail-clone > *');
                                if (targets.length && typeof gsap !== 'undefined') {
                                    gsap.from(targets, { y: -30, opacity: 0, duration: 2, stagger: 0.5, ease: 'power2.out' });
                                }
                                return;
                            }
                        }

                        // fallback: si no hi ha placeholder o detailId, mostrem plantilla simple
                        const p = document.createElement('div');
                        p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" style="max-width:100%;height:auto;border-radius:8px"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                        body.appendChild(p);
                        if (typeof gsap !== 'undefined') gsap.from(body.children, { y: -20, opacity: 0, duration: 0.45, stagger: 0.03, ease: 'power2.out' });
                    }

                    insertContent();
                }, showDelay);
            }
        });

        // scroll lock background
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        function closeMega() {
            // anima revers back to rect
            gsap.to(mega, { duration: 0.45, ease: 'power2.inOut', left: rect.left, top: rect.top, width: rect.width, height: rect.height, onComplete: cleanup });
            // No apliquem aquí GSAP sobre les slides del fons (evitem estils en línia). La restauració d'estat
            // s'efectuarà en cleanup eliminant la classe .dimmed i netejant qualsevol estil en línia residual.
        }

        function cleanup() {
            // remove overlay and classes
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            // remove dimmed class and clear any inline styles possibly left by prior GSAP calls
            pista.classList.remove('dimmed');
            // Neteja d'estils en línia per totes les slides per evitar 'ghost blur' o opacitats estranyes
            pista.querySelectorAll('.carousel-slide').forEach(s => {
                s.style.opacity = '';
                s.style.filter = '';
                s.style.transform = '';
            });

            // si tenim un estat global, eliminem la marca d'actiu sobre el node corresponent
            if (megaState && megaState.activeNode) {
                megaState.activeNode.classList.remove('active-zoom');
            } else {
                figure.classList.remove('active-zoom');
            }

            megaOpen = false;
            megaState = null;
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeMega);
        // close on overlay click outside mega
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeMega();
        });
    }

    // fallback que obre una nova finestra si GSAP no està disponible
    function openYtPopupFallback(name, frontSrc) {
        const features = 'width=700,height=600,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes';
        const win = window.open('', '_blank', features);
        if (!win) {
            alert('El navegador ha bloquejat la finestra emergent. Permet els pop-ups i torna-ho a provar.');
            return;
        }
        const safeName = name || 'Youtuber';
        const content = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>${safeName} — Detalls</title></head><body style="background:#111;color:#fff;font-family:system-ui;padding:16px"><h2>${safeName}</h2><img src="${frontSrc}" style="max-width:100%;height:auto;border-radius:8px"><div style="margin-top:12px">Afegeix aquí la informació del youtuber.</div></body></html>`;
        win.document.open(); win.document.write(content); win.document.close();
    }

    // Navegació dins la Mega-Targeta: mou-se a la següent/prèvia fitxa sense moure el carrusel
    function navigateMega(direction) {
        if (!megaOpen || !megaState) return;
        const tot = totalDiapositives;
        // Mou el carrusel igual que quan s'utilitzen les fletxes del carrusel
        moureAlaSlide(indexActual + direction);

        // Actualitza l'índex del youtuber a la mega i recarrega el contingut
        let next = (megaState.currentIndex + direction + tot) % tot;
        megaState.currentIndex = next;

        // Mostra el loading GIF dins la mega immediatament per assegurar que es veu
        const body = megaState.body;
        if (body) {
            body.innerHTML = '';
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'mega-loading';
            const loadingImg = document.createElement('img');
            loadingImg.src = './RECURSOS/youtubers/slider/loading.gif';
            loadingImg.alt = 'Carregant...';
            loadingDiv.appendChild(loadingImg);
            body.appendChild(loadingDiv);
        }

        // Esperem que el carrusel acabi la seva transició (la transició CSS és 500ms) abans de mostrar el contingut
        const wait = 580; // ms, lleugerament per sobre dels 500ms de transició
        setTimeout(() => updateMegaToIndex(next, { fromNavigate: true }), wait);
    }

    // Actualitza el contingut de la mega segons l'índex original (0..totalDiapositives-1)
    function updateMegaToIndex(idx, opts = {}) {
        if (!megaOpen || !megaState) return;
        const targetSlide = slidesInicials[idx];
        if (!targetSlide) return;

        // Actualitza classe active-zoom sobre el node central equivalent
        const prevActive = megaState.activeNode;
        if (prevActive) prevActive.classList.remove('active-zoom');

        // IMPORTANT: netegem possibles estils en línia de totes les slides abans d'aplicar la nova classe
        // Això evita que estils incrustats (filter/opacity/transform) queden fixats després de navegacions
        pista.querySelectorAll('.carousel-slide').forEach(s => {
            s.style.opacity = '';
            s.style.filter = '';
            s.style.transform = '';
        });

    const centralIdx = totalDiapositives + idx;
    const centralNode = pista.children[centralIdx];
    if (centralNode) centralNode.classList.add('active-zoom');
    megaState.activeNode = centralNode || targetSlide;

    // Nota: no movem el carrusel des d'aquí per evitar salts bruscos; la navegació del carrusel
    // es controla des de `navigateMega()` per reproduir el mateix comportament que les fletxes.

    // Recull dades del slide objectiu
    const playImg = targetSlide.querySelector('img[data-detail]');
    const frontImg = targetSlide.querySelector('.flip-card-front img');
    const detailId = playImg ? (playImg.dataset.detail || null) : null;
    const name = playImg ? (playImg.dataset.youtuber || (frontImg ? frontImg.alt : 'Youtuber')) : (frontImg ? frontImg.alt : 'Youtuber');
    const frontSrc = frontImg ? frontImg.src : '';

        // Mostrem o inserim el contingut. Si venim de navigateMega (opts.fromNavigate),
        // el loading ja està visible dins la mega-body; deixem que es mostri una mica
        // abans de reemplaçar-lo pel contingut real.
        const body = megaState.body;
        if (!body) return;

        const fromNavigate = opts.fromNavigate === true;
        if (fromNavigate) {
            // Deixa el loading visible una mica més perquè l'usuari el percebi
            const delay = 520; // ms
            setTimeout(() => {
                body.innerHTML = '';
                if (detailId) {
                    const placeholder = document.getElementById(detailId);
                    if (placeholder) {
                        const clone = placeholder.cloneNode(true);
                        clone.classList.remove('d-none');
                        clone.removeAttribute('id');
                        clone.classList.add('mega-detail-clone');
                        body.appendChild(clone);
                        if (typeof gsap !== 'undefined') gsap.from(clone.children, { y: -30, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out' });
                        return;
                    }
                }
                // fallback content
                const p = document.createElement('div');
                p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" style="max-width:100%;height:auto;border-radius:8px"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                body.appendChild(p);
                if (typeof gsap !== 'undefined') gsap.from(p, { y: -20, opacity: 0, duration: 0.45 });
            }, delay);
        } else {
            if (typeof gsap !== 'undefined') {
                gsap.to(body.children, { duration: 0.22, y: -10, opacity: 0, stagger: 0.02, onComplete: () => {
                    // Neteja i insereix loading
                    body.innerHTML = '';
                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'mega-loading';
                    const loadingImg = document.createElement('img');
                    loadingImg.src = './RECURSOS/youtubers/slider/loading.gif';
                    loadingImg.alt = 'Carregant...';
                    loadingDiv.appendChild(loadingImg);
                    body.appendChild(loadingDiv);

                    // simulem una petita càrrega abans d'inserir el nou contingut
                    setTimeout(() => {
                        body.innerHTML = '';
                        if (detailId) {
                            const placeholder = document.getElementById(detailId);
                            if (placeholder) {
                                const clone = placeholder.cloneNode(true);
                                clone.classList.remove('d-none');
                                clone.removeAttribute('id');
                                clone.classList.add('mega-detail-clone');
                                body.appendChild(clone);
                                gsap.from(clone.children, { y: -30, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power2.out' });
                            } else {
                                const p = document.createElement('div');
                                p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" style="max-width:100%;height:auto;border-radius:8px"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                                body.appendChild(p);
                                gsap.from(p, { y: -20, opacity: 0, duration: 0.45 });
                            }
                        } else {
                            const p = document.createElement('div');
                            p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" style="max-width:100%;height:auto;border-radius:8px"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                            body.appendChild(p);
                            gsap.from(p, { y: -20, opacity: 0, duration: 0.45 });
                        }
                    }, 220);
                }});
            } else {
                // fallback sense GSAP: replace immediatament
                body.innerHTML = '';
                const p = document.createElement('div');
                p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" style="max-width:100%;height:auto;border-radius:8px"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                body.appendChild(p);
            }
        }

        // Actualitza l'índex a l'estat
        megaState.currentIndex = idx;
    }

    // assigna handlers a les imatges que fem servir com a botó Play
    document.querySelectorAll('img[data-detail]').forEach(imgEl => {
        // click obre la mega-targeta
        imgEl.addEventListener('click', (e) => {
            const figure = imgEl.closest('.carousel-slide');
            if (!figure) return;
            const frontImg = figure.querySelector('.flip-card-front img');
            const backImg = figure.querySelector('.flip-card-back img');
            const frontSrc = frontImg ? frontImg.src : '';
            const backSrc = backImg ? backImg.src : '';
            const name = imgEl.dataset.youtuber || (frontImg ? frontImg.alt : 'Youtuber');
            const detailId = imgEl.dataset.detail || null;
            openMegaCard(figure, name, frontSrc, backSrc, detailId);
        });

        // hover swap: si l'element té data-hover, fem swap de src en mouseenter/mouseleave
        const hoverSrc = imgEl.dataset.hover;
        if (hoverSrc) {
            const original = imgEl.src;
            imgEl.addEventListener('mouseenter', () => { imgEl.src = hoverSrc; });
            imgEl.addEventListener('mouseleave', () => { imgEl.src = original; });
            // també per focus/blur per accessibilitat via teclat
            imgEl.addEventListener('focus', () => { imgEl.src = hoverSrc; });
            imgEl.addEventListener('blur', () => { imgEl.src = original; });
        }
    });
});