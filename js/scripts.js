document.addEventListener('DOMContentLoaded', function () {
    // If the page was opened with a hash (e.g. index.html#test) the browser
    // may auto-scroll to that anchor on load. Remove the hash immediately and
    // reset scroll to top to keep the page at its normal starting position.
    try {
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
            window.scrollTo(0, 0);
        }
    } catch (err) {
        // ignore
    }
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

    // Evitem que les flip-cards siguin focusables mitjançant Tab: eliminem tabindex si existeix
    // Això evita que s'hagin de prémer moltes vegades Tab per arribar a les fletxes del carrusel
    pista.querySelectorAll('.flip-card').forEach(el => el.removeAttribute('tabindex'));

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

    // NOTE: social icons are provided directly in the HTML now; no runtime replacement needed.

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
        // Actualitza quins Play seran focusables (només els visibles al viewport del carrusel)
        updateFocusablePlays();
    }, 50);

    // Marca només com a focusables (tabindex=0) els img[data-detail] que estiguin visibles dins del track
    function updateFocusablePlays() {
        if (!pista) return;
        const trackRect = pista.getBoundingClientRect();
        const plays = pista.querySelectorAll('img[data-detail]');
        plays.forEach(play => {
            const slide = play.closest('.carousel-slide');
            if (!slide) { play.tabIndex = -1; return; }
            const rect = slide.getBoundingClientRect();
            const visible = !(rect.right < trackRect.left || rect.left > trackRect.right);
            // Si la slide és visible, permitim el focus; si no, el deshabilitem per reduir salts de tab
            play.tabIndex = visible ? 0 : -1;
        });
    }

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
                    // actualitzem focusables un cop acabada la correcció instantània
                    updateFocusablePlays();
                }, 50);
            }
            // Si ens hem desplaçat al primer grup (esquerra extrema), salta a l'equivalent del grup del mig
            else if (indexActual < totalDiapositives) {
                pista.style.transition = 'none';
                indexActual = indexActual + totalDiapositives; // mapeja a l'equivalent al grup central
                pista.style.transform = `translateX(-${ampladaSlide * indexActual}px)`;
                setTimeout(() => {
                    pista.style.transition = 'transform 0.5s ease-in-out';
                    // actualitzem focusables un cop acabada la correcció instantània
                    updateFocusablePlays();
                }, 50);
            }
            enTransicio = false;
            // actualitzem focusables després de qualsevol moviment normal
            updateFocusablePlays();
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

    /* ---------------- Quiz: Quin youtuber ets? ---------------- */
    (function initQuiz() {
        const quizContainer = document.getElementById('quizQuestions');
        const quizForm = document.getElementById('quizForm');
        const quizResult = document.getElementById('quizResult');
        const quizReset = document.getElementById('quizReset');
        if (!quizContainer || !quizForm || !quizResult || !quizReset) return;

        const youtubers = [
            { id: 'rubius', name: 'ElRubiusOMG', banner: './RECURSOS/youtubers/slider/rubius-banner.png', desc: 'Humor, gaming i energia desenfrenada.', img: './RECURSOS/youtubers/rubius1.jpg' },
            { id: 'auronplay', name: 'AuronPlay', banner: './RECURSOS/youtubers/slider/auronplay-banner.png', desc: 'Sàtira, reaccions i contingut directe.', img: './RECURSOS/youtubers/auron1.jpg' },
            { id: 'wismichu', name: 'Wismichu', banner: './RECURSOS/youtubers/slider/wismichu-banner.png', desc: 'Humor àcid i formats originals.', img: './RECURSOS/youtubers/wismichu1.jpg' },
            { id: 'dulceida', name: 'Dulceida', banner: './RECURSOS/youtubers/slider/dulceida-banner.png', desc: 'Moda, estètica i lifestyle.', img: './RECURSOS/youtubers/dulceida1.jpg' },
            { id: 'giorgio', name: 'El Rincón de Giorgio', banner: './RECURSOS/youtubers/slider/giorgio-banner.png', desc: 'Música i producció amb sensibilitat.', img: './RECURSOS/youtubers/jordiwild1.jpg' },
            { id: 'gref', name: 'TheGrefg', banner: './RECURSOS/youtubers/slider/gref-banner.png', desc: 'Gaming competitiu i streams professionals.', img: './RECURSOS/youtubers/gref1.jpg' },
            { id: 'laubalo', name: 'Carla Laubalo', banner: './RECURSOS/youtubers/slider/laubalo-banner.png', desc: 'Creativitat íntima i contingut personal.', img: './RECURSOS/youtubers/carlalaubalo1.jpg' },
            { id: 'willyrex', name: 'Willyrex', banner: './RECURSOS/youtubers/slider/willyrex-banner.png', desc: 'Gaming clàssic i contingut per a fans.', img: './RECURSOS/youtubers/willyrex1.jpg' },
            { id: 'alexby', name: 'AlexBy11', banner: './RECURSOS/youtubers/slider/alexby-banner.png', desc: 'Entreteniment i vídeos ben editats.', img: './RECURSOS/youtubers/alexby1.jpg' },
            { id: 'yuya', name: 'Yuya', banner: './RECURSOS/youtubers/slider/yuya-banner.png', desc: 'Belleza, tutorials i alegria.', img: './RECURSOS/youtubers/yuya1.jpg' },
            { id: 'ocho', name: '8cho', banner: './RECURSOS/youtubers/slider/ocho-banner.png', desc: 'Humor àgil i contingut viral.', img: './RECURSOS/youtubers/8cho1.jpg' },
            { id: 'vegetta', name: 'Vegetta777', banner: './RECURSOS/youtubers/slider/vegetta-banner.png', desc: 'Gaming narratiu i universos de joc.', img: './RECURSOS/youtubers/vegetta1.jpg' }
        ];

        const questions = [
            {
                q: 'Què prefereixes fer un dissabte per la tarda?',
                options: [
                    { t: 'Jugar videojocs durant hores', adds: ['rubius', 'willyrex', 'vegetta'] },
                    { t: 'Fer una broma amb els meus amics', adds: ['auronplay', 'wismichu'] },
                    { t: 'Arreglar-me i provar looks nous', adds: ['dulceida', 'yuya'] },
                    { t: 'Fer chisme amb els amics', adds: ['giorgio', 'alexby'] }
                ]
            },
            {
                q: 'El teu humor és...',
                options: [
                    { t: 'Sarcàstic', adds: ['gref', 'rubius'] },
                    { t: 'Random', adds: ['alexby', 'yuya'] },
                    { t: 'Motivador', adds: ['wismichu', 'auronplay'] },
                    { t: 'Observador', adds: ['laubalo', 'ocho'] }
                ]
            },
            {
                q: 'Quin tipus de contingut consumeixes més sovint?',
                options: [
                    { t: 'Gameplays i streams', adds: ['rubius', 'auronplay', 'willyrex'] },
                    { t: 'Memes i vídeos de humor', adds: ['giorgio', 'alexby', 'gref'] },
                    { t: 'Tutorials de maquillatge o lifestyle', adds: ['wismichu', 'ocho'] },
                    { t: 'Comentaris i anàlisis', adds: ['dulceida', 'yuya', 'laubalo'] }
                ]
            },
            {
                q: 'Com reacciones davant un conflicte?',
                options: [
                    { t: 'Marxo i segueixo amb la meva', adds: ['vegetta', 'rubius'] },
                    { t: 'Faig broma de tot', adds: ['gref', 'alexby'] },
                    { t: 'Intento parlar-ho amb calma', adds: ['auronplay', 'willyrex'] },
                    { t: 'Dono la meva opinió clara i directa', adds: ['dulceida', 'yuya'] }
                ]
            },
            {
                q: 'El teu estil de comunicació és...',
                options: [
                    { t: 'Directe i sense filtres', adds: ['yuya', 'ocho'] },
                    { t: 'Caòtic i imprevisible', adds: ['gref', 'willyrex', 'vegetta'] },
                    { t: 'Proper i amigable', adds: ['rubius', 'auronplay'] },
                    { t: 'Irònic i crític', adds: ['alexby', 'laubalo'] }
                ]
            },
            {
                q: 'Els teus amics et descriuen com...',
                options: [
                    { t: 'El competitiu del grup', adds: ['rubius', 'auronplay'] },
                    { t: 'El que sempre fa riure', adds: ['gref', 'vegetta'] },
                    { t: 'El que cuida els detalls', adds: ['giorgio', 'alexby'] },
                    { t: 'El que diu les veritats incòmodes', adds: ['ocho', 'laubalo'] }
                ]
            },
            {
                q: 'Abans de anar a dormir, tu...',
                options: [
                    { t: '"Una partida més i prou"', adds: ['rubius', 'dulceida', 'yuya'] },
                    { t: 'Veig tiktok fins a les 3 AM', adds: ['auronplay', 'wismichu'] },
                    { t: 'Planifico el dia següent amb detall', adds: ['vegetta', 'willyrex'] },
                    { t: 'Escolto música o podcasts', adds: ['giorgio', 'alexby'] }
                ]
            }
        ];

        // Render the quiz as a step-by-step wizard: one question per view
        let currentStep = 0;
        const totalSteps = questions.length;
        // expose showStep function to outer scope so external buttons can control steps
        let showStepFn = null;

        function renderSteps() {
            quizContainer.innerHTML = '';

            questions.forEach((q, qi) => {
                const step = document.createElement('div');
                step.className = 'quiz-step';
                step.dataset.step = qi;
                step.style.display = qi === 0 ? 'block' : 'none';

                const h = document.createElement('h4');
                h.textContent = (qi + 1) + '. ' + q.q;
                step.appendChild(h);

                const opts = document.createElement('div');
                opts.className = 'quiz-options';
                q.options.forEach((opt, oi) => {
                    const id = `q${qi}_o${oi}`;
                    const label = document.createElement('label');
                    label.setAttribute('for', id);
                    label.className = 'quiz-option-label';
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `q${qi}`;
                    radio.id = id;
                    radio.value = oi;
                    radio.className = 'quiz-option-input';
                    label.appendChild(radio);
                    const span = document.createElement('span');
                    span.textContent = opt.t;
                    label.appendChild(span);
                    opts.appendChild(label);
                });

                // container for validation messages specific to this step
                const error = document.createElement('div');
                error.className = 'quiz-error text-danger small mt-2';
                error.style.display = 'none';
                step.appendChild(opts);
                step.appendChild(error);

                quizContainer.appendChild(step);
            });

            // Navigation controls (Previous / Next / View result)
            const nav = document.createElement('div');
            nav.className = 'quiz-nav mt-3 d-flex justify-content-between';

            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-outline-secondary quiz-prev';
            prevBtn.textContent = 'Anterior';
            prevBtn.disabled = true;

            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-primary quiz-next';
            nextBtn.textContent = 'Següent';

            nav.appendChild(prevBtn);
            nav.appendChild(nextBtn);
            quizContainer.appendChild(nav);

            function showStep(index, focus = true) {
                const steps = quizContainer.querySelectorAll('.quiz-step');
                steps.forEach((s, i) => { s.style.display = i === index ? 'block' : 'none'; });
                currentStep = index;
                prevBtn.disabled = currentStep === 0;
                // also update the external/global Prev button under the test
                const globalPrevBtn = document.getElementById('quizPrevGlobal');
                if (globalPrevBtn) globalPrevBtn.disabled = currentStep === 0;
                // update next button label on last step
                nextBtn.textContent = currentStep === totalSteps - 1 ? 'Veure resultat' : 'Següent';
                // focus first input in the step for accessibility (only when requested)
                const firstInput = quizContainer.querySelector(`.quiz-step[data-step="${currentStep}"] input`);
                if (firstInput && focus) firstInput.focus();
                // hide any step error when showing
                const err = quizContainer.querySelector(`.quiz-step[data-step="${currentStep}"] .quiz-error`);
                if (err) err.style.display = 'none';
            }
            // make the showStep function available outside renderSteps
            showStepFn = showStep;

            function validateStep(index) {
                const selected = quizForm.querySelector(`input[name="q${index}"]:checked`);
                const err = quizContainer.querySelector(`.quiz-step[data-step="${index}"] .quiz-error`);
                if (!selected) {
                    if (err) {
                        err.textContent = 'Selecciona una opció per continuar.';
                        err.style.display = 'block';
                    }
                    return false;
                }
                if (err) { err.style.display = 'none'; }
                return true;
            }

            prevBtn.addEventListener('click', () => {
                if (currentStep > 0) showStep(currentStep - 1);
            });

            nextBtn.addEventListener('click', () => {
                // si no som a l'últim pas, validate i avança
                if (currentStep < totalSteps - 1) {
                    if (!validateStep(currentStep)) return;
                    showStep(currentStep + 1);
                } else {
                    // últim pas: validate i mostra resultat
                    if (!validateStep(currentStep)) return;
                    const result = computeResult();
                    showResult(result);
                }
            });
        }

        function computeResult() {
            const form = quizForm;
            const formData = new FormData(form);
            // initialize scores
            const scores = {};
            youtubers.forEach(y => scores[y.id] = 0);

            questions.forEach((q, qi) => {
                const val = formData.get(`q${qi}`);
                const sel = (typeof val === 'string') ? parseInt(val, 10) : null;
                const option = q.options[sel] || q.options[0];
                (option.adds || []).forEach(k => { if (scores[k] !== undefined) scores[k] += 1; });
            });

            // pick highest score
            let best = null, bestScore = -1;
            Object.keys(scores).forEach(k => {
                if (scores[k] > bestScore) { best = k; bestScore = scores[k]; }
            });
            if (!best) best = youtubers[0].id;
            return youtubers.find(y => y.id === best);
        }

        function showResult(result) {
            // Simplified result: centered name and a single photo below it
            quizResult.innerHTML = '';
            const h = document.createElement('h2');
            h.className = 'quiz-result-name';
            h.textContent = `${result.name}`;

            // Use an explicit image provided in the youtuber object.
            // Prefer `result.img`, then `result.photo`, then `result.banner`.
            // IMPORTANT: do NOT derive the path from the id (you said you don't want id-based).
            const photoSrc = result.img || result.photo || result.banner || '';
            let photo = null;
            if (photoSrc) {
                photo = document.createElement('img');
                photo.src = photoSrc;
                photo.alt = result.name;
                photo.className = 'quiz-result-photo';
            }

            const btns = document.createElement('div'); btns.className = 'mt-3 text-center';
            const restart = document.createElement('button'); restart.className = 'btn btn-primary'; restart.textContent = 'Reiniciar';
            restart.addEventListener('click', () => {
                quizForm.reset();
                quizResult.classList.add('d-none');
                if (typeof showStepFn === 'function') showStepFn(0, false);
                const firstInput = quizContainer.querySelector('.quiz-step[data-step="0"] input');
                if (firstInput) firstInput.focus();
                window.scrollTo({ top: quizForm.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            });
            btns.appendChild(restart);

            quizResult.appendChild(h);
            if (photo) quizResult.appendChild(photo);
            quizResult.appendChild(btns);
            quizResult.classList.remove('d-none');
            // scroll to result (center)
            quizResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // initialize the step-based UI
        renderSteps();
        // ensure initial state is applied (disable global prev on step 0)
        // do NOT focus the first input on initial render to avoid automatic scroll
        if (typeof showStepFn === 'function') showStepFn(0, false);

        // wire external Prev and Reset buttons placed under the test (in HTML)
        const globalPrev = document.getElementById('quizPrevGlobal');
        if (globalPrev) {
            globalPrev.addEventListener('click', () => {
                if (typeof showStepFn === 'function' && currentStep > 0) showStepFn(currentStep - 1);
            });
        }

        // handle form submit (e.g., pressing Enter)
        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // if not at last step, validate current and advance
            if (typeof currentStep !== 'undefined' && currentStep < totalSteps - 1) {
                const selected = quizForm.querySelector(`input[name="q${currentStep}"]:checked`);
                if (selected) {
                    const nextBtn = quizContainer.querySelector('.quiz-next');
                    if (nextBtn) nextBtn.click();
                } else {
                    const err = quizContainer.querySelector(`.quiz-step[data-step="${currentStep}"] .quiz-error`);
                    if (err) { err.textContent = 'Selecciona una opció per continuar.'; err.style.display = 'block'; }
                }
                return;
            }
            // else compute and show result
            const result = computeResult();
            showResult(result);
        });

        quizReset.addEventListener('click', () => {
            quizForm.reset();
            quizResult.classList.add('d-none');
            // return to first question
            if (typeof showStepFn === 'function') showStepFn(0);
            // focus first input if present
            const firstInput = quizContainer.querySelector('.quiz-step[data-step="0"] input');
            if (firstInput) firstInput.focus();
            // scroll to the quiz form
            window.scrollTo({ top: quizForm.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        });
    })();

    // ScrollTrigger animations for the Evolució timeline
    (function setupTimelineOnFirstScroll() {
        let timelineInitialized = false;

        function initTimelineTriggers() {
            try {
                if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
                gsap.registerPlugin(ScrollTrigger);

                // animate each timeline content from left/right or from below on small screens
                const mq = window.matchMedia('(max-width: 767.98px)');
                const container = document.querySelector('.timeline-fullwidth');
                const items = Array.from(document.querySelectorAll('.timeline-item'));

                // set initial invisible state
                items.forEach(row => {
                    const item = row.querySelector('.timeline-content');
                    if (!item) return;
                    const side = item.dataset.side || 'left';
                    const isMobile = mq.matches;
                    if (isMobile) {
                        gsap.set(item, { y: 30, opacity: 0, immediateRender: false });
                    } else {
                        gsap.set(item, { x: side === 'left' ? -120 : 120, opacity: 0, immediateRender: false });
                    }
                });

                // create a dot per item on the central line and animate it when the item appears
                items.forEach(row => {
                    const item = row.querySelector('.timeline-content');
                    if (!item) return;

                    // create dot placed in the fullwidth container
                    const dot = document.createElement('div');
                    dot.className = 'timeline-dot';
                    if (container) container.appendChild(dot);

                    // position function (update on refresh/resize)
                    function positionDot() {
                        const containerRect = container.getBoundingClientRect();
                        const rowRect = row.getBoundingClientRect();
                        const top = rowRect.top - containerRect.top + rowRect.height / 2;
                        dot.style.top = (top) + 'px';
                    }

                    positionDot();

                    // animate the content and the dot when in view
                    const side = item.dataset.side || 'left';
                    const isMobile = mq.matches;
                    const animVars = isMobile ? { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' } : { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out' };

                    gsap.to(item, {
                        ...(isMobile ? { y: 0 } : { x: 0 }),
                        opacity: 1,
                        duration: animVars.duration,
                        ease: animVars.ease,
                        immediateRender: false,
                        scrollTrigger: {
                            trigger: item,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse',
                            onEnter: () => gsap.to(dot, { scale: 1, duration: 0.35, ease: 'back.out(1.7)' }),
                            onLeaveBack: () => gsap.to(dot, { scale: 0, duration: 0.2 })
                        }
                    });

                    // reposition dot on refresh/resize
                    ScrollTrigger.addEventListener('refreshInit', positionDot);
                    window.addEventListener('resize', positionDot);
                });

                // refresh ScrollTrigger on resize after a small debounce
                let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 150); });
            } catch (err) { console.warn('ScrollTrigger init error', err); }
        }

        function onFirstScroll() {
            if (timelineInitialized) return;
            timelineInitialized = true;
            initTimelineTriggers();
            window.removeEventListener('scroll', onFirstScroll);
            window.removeEventListener('touchstart', onFirstScroll);
        }

        // wait for the user to scroll (or touch) before initialising the timeline animations
        window.addEventListener('scroll', onFirstScroll, { passive: true });
        window.addEventListener('touchstart', onFirstScroll, { passive: true });
    })();

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

    // Ensure clicking the centered logo reloads the page to the top (remove any hash first)
    try {
        const centeredLogoLink = document.querySelector('.logo-container-custom a');
        if (centeredLogoLink) {
            centeredLogoLink.addEventListener('click', (e) => {
                // allow normal middle-click / ctrl-click to open in new tab
                if (e.metaKey || e.ctrlKey || e.button === 1) return;
                e.preventDefault();
                // remove any hash to avoid anchor jumps
                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (err) { /* ignore */ }
                // Smooth scroll to top instead of reloading
                if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
                    gsap.to(window, { duration: 0, ease: 'power2.out', scrollTo: { y: 0, autoKill: false } });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    } catch (err) { /* silent */ }

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
                        p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" class="mega-detail-img"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
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

    /* ---------------- Video carousel (thumbnails -> load iframe) ---------------- */
    (function initVideoCarousel() {
        const pistaV = document.querySelector('.carousel-track-videos');
        if (!pistaV) return;

        const wrapper = document.getElementById('videoCarousel');
        const btnPrev = document.querySelector('.carousel-btn-prev-videos');
        const btnNext = document.querySelector('.carousel-btn-next-videos');

        const slidesInicialsV = Array.from(pistaV.querySelectorAll('.carousel-slide'));
        const totalV = slidesInicialsV.length;

        // clone twice for infinite loop (3 groups)
        for (let i = 0; i < 2; i++) {
            slidesInicialsV.forEach(s => {
                const clone = s.cloneNode(true);
                pistaV.appendChild(clone);
            });
        }

        const diapositivesV = Array.from(pistaV.children);
        const slideWidth = 288 + 24; // 18rem (288px) + gap 24

        let indexV = totalV; // start at middle group
        let enTransicioV = false;

        // position initial
        pistaV.style.transition = 'none';
        pistaV.style.transform = `translateX(-${slideWidth * indexV}px)`;
        setTimeout(() => { pistaV.style.transition = 'transform 0.5s ease-in-out'; updateFocusableThumbnails(); }, 50);

        function updateFocusableThumbnails() {
            const trackRect = pistaV.getBoundingClientRect();
            // target iframes inside .video-thumb (now embeds)
            const iframes = pistaV.querySelectorAll('.video-thumb iframe');
            iframes.forEach(iframe => {
                const slide = iframe.closest('.carousel-slide');
                if (!slide) { iframe.tabIndex = -1; return; }
                const rect = slide.getBoundingClientRect();
                const visible = !(rect.right < trackRect.left || rect.left > trackRect.right);
                // iframe is focusable by default, but ensure tabindex for keyboard navigation
                iframe.tabIndex = visible ? 0 : -1;
                // set a sensible title for screen readers (should already be set in HTML)
                if (!iframe.getAttribute('title')) iframe.setAttribute('title', 'Vídeo');
            });
        }

        function moureAlaSlideV(index) {
            if (enTransicioV) return;
            enTransicioV = true;
            pistaV.style.transform = `translateX(-${slideWidth * index}px)`;
            indexV = index;
            setTimeout(() => {
                if (indexV >= totalV * 2) {
                    pistaV.style.transition = 'none';
                    indexV = indexV - totalV;
                    pistaV.style.transform = `translateX(-${slideWidth * indexV}px)`;
                    setTimeout(() => { pistaV.style.transition = 'transform 0.5s ease-in-out'; updateFocusableThumbnails(); }, 50);
                } else if (indexV < totalV) {
                    pistaV.style.transition = 'none';
                    indexV = indexV + totalV;
                    pistaV.style.transform = `translateX(-${slideWidth * indexV}px)`;
                    setTimeout(() => { pistaV.style.transition = 'transform 0.5s ease-in-out'; updateFocusableThumbnails(); }, 50);
                }
                enTransicioV = false;
                updateFocusableThumbnails();
            }, 500);
        }

        function moveToIndexV(targetIndex) {
            if (!enTransicioV) moureAlaSlideV(targetIndex);
            else setTimeout(() => moveToIndexV(targetIndex), 120);
        }

        btnNext.addEventListener('click', () => moureAlaSlideV(indexV + 1));
        btnPrev.addEventListener('click', () => moureAlaSlideV(indexV - 1));

        // keyboard + click handlers for thumbnails (lazy load iframe)
        // update focusables on resize
        window.addEventListener('resize', updateFocusableThumbnails);
    })();

    // fallback que obre una nova finestra si GSAP no està disponible
    function openYtPopupFallback(name, frontSrc) {
        const features = 'width=700,height=600,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes';
        const win = window.open('', '_blank', features);
        if (!win) {
            alert('El navegador ha bloquejat la finestra emergent. Permet els pop-ups i torna-ho a provar.');
            return;
        }
        const safeName = name || 'Youtuber';
        const content = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>${safeName} — Detalls</title><link rel="stylesheet" href="./css/styles.css"></head><body class="popup-body"><h2>${safeName}</h2><img src="${frontSrc}" class="mega-detail-img"><div class="popup-note">Afegeix aquí la informació del youtuber.</div></body></html>`;
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
                p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" class="mega-detail-img"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                body.appendChild(p);
                if (typeof gsap !== 'undefined') gsap.from(p, { y: -20, opacity: 0, duration: 0.45 });
            }, delay);
        } else {
            if (typeof gsap !== 'undefined') {
                gsap.to(body.children, {
                    duration: 0.22, y: -10, opacity: 0, stagger: 0.02, onComplete: () => {
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
                                    p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" class="mega-detail-img"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                                    body.appendChild(p);
                                    gsap.from(p, { y: -20, opacity: 0, duration: 0.45 });
                                }
                            } else {
                                const p = document.createElement('div');
                                p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" class="mega-detail-img"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                                body.appendChild(p);
                                gsap.from(p, { y: -20, opacity: 0, duration: 0.45 });
                            }
                        }, 220);
                    }
                });
            } else {
                // fallback sense GSAP: replace immediatament
                body.innerHTML = '';
                const p = document.createElement('div');
                p.innerHTML = `<h4>${name}</h4><img src="${frontSrc}" class="mega-detail-img"><p class=\"mt-3\">Contingut no disponible encara.</p>`;
                body.appendChild(p);
            }
        }

        // Actualitza l'índex a l'estat
        megaState.currentIndex = idx;
    }

    // assigna handlers a les imatges que fem servir com a botó Play
    document.querySelectorAll('img[data-detail]').forEach(imgEl => {
        // fer la imatge focusable amb teclat (tab) per accessibilitat
        imgEl.tabIndex = 0;
        // indicar que l'element es comporta com a botó per lectors de pantalla
        imgEl.setAttribute('role', 'button');

        // suport de teclat: Enter o Space obren la mega (i evitem que Space faci scroll a la pàgina)
        imgEl.addEventListener('keydown', (ev) => {
            const key = ev.key || ev.keyCode;
            if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 13 || key === 32) {
                ev.preventDefault();
                imgEl.click();
            }
        });

        // No runtime fallback: icons are in the HTML and CSS provides hover/focus styles.
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

    /* ---------------- Capsule simple: swap clapboard and scroll ---------------- */
    (function initCapsule() {
        const capImg = document.getElementById('capsuleImg');
        const targetSection = document.getElementById('youtubers');
        if (!capImg || !targetSection) return;

        const srcOpen = capImg.dataset.open;
        const srcClosed = capImg.dataset.closed;
        let clicked = false;

        function doAction() {
            // smooth scroll to youtubers
            try {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                window.scrollTo({ top: targetSection.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' });
            }
        }

        function onActivate() {
            if (clicked) return;
            clicked = true;

            // Respect reduced motion preference: do a simple swap + delayed scroll
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                if (srcClosed) capImg.src = srcClosed;
                setTimeout(() => doAction(), 3000);
                return;
            }

            // Animation timings (ms)
            const ENLARGE = 600;
            const HOLD = 600; // while enlarged show the second image
            const SHRINK = 600;
            const TOTAL = ENLARGE + HOLD + SHRINK; // 2600
            const SCROLL_DELAY = 1500; // user requested scroll after 3s
            const SCALE = 1.6; // target scale when centered (moderate)

            // Compute geometry to animate from current position toward center
            const rect = capImg.getBoundingClientRect();
            const vw = window.innerWidth || document.documentElement.clientWidth;
            const vh = window.innerHeight || document.documentElement.clientHeight;
            const centerX = vw / 2;
            const centerY = vh / 2;
            const imgCenterX = rect.left + rect.width / 2;
            const imgCenterY = rect.top + rect.height / 2;
            const deltaX = Math.round(centerX - imgCenterX);
            const deltaY = Math.round(centerY - imgCenterY);

            // Prepare element: fix it at its current coords so transforms are relative to that box
            capImg.style.position = 'fixed';
            capImg.style.left = rect.left + 'px';
            capImg.style.top = rect.top + 'px';
            capImg.style.width = rect.width + 'px';
            capImg.style.height = rect.height + 'px';
            capImg.style.margin = '0';
            capImg.style.transformOrigin = 'center center';
            capImg.style.pointerEvents = 'none';
            capImg.style.zIndex = '99999';

            // Start transition state
            capImg.classList.add('animating');
            // ensure initial transform is identity
            capImg.style.transform = `translate(0px, 0px) scale(1)`;
            // force reflow so the browser registers the starting point
            void capImg.offsetWidth;

            // Animate to center + scale
            capImg.style.transition = 'transform 600ms cubic-bezier(.2,.9,.2,1)';
            capImg.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${SCALE})`;

            // After ENLARGE phase, swap image while still enlarged
            setTimeout(() => {
                if (srcClosed) capImg.src = srcClosed;
            }, ENLARGE);

            // After HOLD, animate back to original size/position
            setTimeout(() => {
                capImg.style.transform = `translate(0px, 0px) scale(1)`;
            }, ENLARGE + HOLD);

            // Cleanup after full animation: remove inline styles and animation class
            setTimeout(() => {
                capImg.classList.remove('animating');
                // remove transition and transform (let CSS handle normal state)
                capImg.style.transition = '';
                capImg.style.transform = '';
                // restore layout position by clearing fixed coordinates
                capImg.style.position = '';
                capImg.style.left = '';
                capImg.style.top = '';
                capImg.style.width = '';
                capImg.style.height = '';
                capImg.style.margin = '';
                capImg.style.zIndex = '';
                capImg.style.pointerEvents = '';
            }, TOTAL + 80);

            // Finally, after SCROLL_DELAY, perform the scroll to the youtubers section
            setTimeout(() => {
                doAction();
            }, SCROLL_DELAY);
        }

        capImg.addEventListener('click', onActivate);
        capImg.addEventListener('keydown', (ev) => {
            const key = ev.key || ev.keyCode;
            if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 13 || key === 32) {
                ev.preventDefault();
                onActivate();
            }
        });
    })();

    /* ---------------- Global scroll entrance animations (from bottom) ---------------- */
    (function initScrollEntrance() {
        try {
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            gsap.registerPlugin(ScrollTrigger);

            // Respect user preference
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Select sensible page-level containers to animate. We skip timeline items and overlays.
            const nodes = gsap.utils.toArray('.container, .container-lg, section, article');
            const targets = nodes.filter(el => {
                if (!el) return false;
                // Do not animate any element that is inside the hero/banner first container (#inici)
                if (el.closest('#inici')) return false;
                if (el.closest('.timeline-fullwidth')) return false;
                if (el.closest('.mega-overlay')) return false;
                if (el.id === 'quiz' || el.id === 'quizResult') return false;
                return true;
            });

            if (prefersReduced) {
                // Immediately show targets without animation
                targets.forEach(t => { t.style.opacity = ''; t.style.transform = ''; });
                return;
            }

            targets.forEach((el, i) => {
                // initial state
                gsap.set(el, { y: 40, opacity: 0, force3D: true });

                gsap.to(el, {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    delay: 0,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                        markers: false
                    }
                });
            });
        } catch (err) {
            // silent
        }
    })();
});