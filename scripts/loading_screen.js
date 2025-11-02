// loading_screen.js
// Inserts a fullscreen loader overlay immediately and hides it when
// page resources (images + audio) are ready or when window.load fires.
// Exposes window.hideLoader() to hide the loader manually.

(function () {
    const STYLE_ID = 'global-loader-styles';
    const LOADER_ID = 'global-loader-overlay';
    const FADE_DURATION_MS = 400;
    const MAX_WAIT_MS = 15000; // give up after 15s

    // CSS for the overlay and loader. We don't change <body> or global layout.
    const css = `
    /* Loader overlay (covers entire viewport, above everything) */
    #${LOADER_ID} {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(#0f0c31, #070512);
        z-index: 1000000;
        transition: opacity ${FADE_DURATION_MS}ms ease, visibility ${FADE_DURATION_MS}ms ease;
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    #${LOADER_ID}.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }

    /* The small animated loader square from your design */
    #${LOADER_ID} .loader {
        width: 45px;
        aspect-ratio: 1;
        --c: no-repeat linear-gradient(#ffffff 0 0);
        background:
            var(--c) 0%   100%,
            var(--c) 50%  100%,
            var(--c) 100% 100%;
        animation: l2 1s infinite linear;
        border-radius: 6px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.5);
    }

    @keyframes l2 {
        0%  {background-size: 20% 100%,20% 100%,20% 100%}
        20% {background-size: 20% 60% ,20% 100%,20% 100%}
        40% {background-size: 20% 80% ,20% 60% ,20% 100%}
        60% {background-size: 20% 100%,20% 80% ,20% 60% }
        80% {background-size: 20% 100%,20% 100%,20% 80% }
        100%{background-size: 20% 100%,20% 100%,20% 100%}
    }

    /* Respect reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
        #${LOADER_ID} .loader { animation: none; }
    }
    `;

    // Insert style once
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        // Try to insert into head; if not present yet, insert into documentElement
        const target = document.head || document.documentElement;
        target.appendChild(style);
    }

    // Create overlay element immediately
    function createOverlay() {
        if (document.getElementById(LOADER_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = LOADER_ID;
        overlay.setAttribute('aria-hidden', 'true');

        const loader = document.createElement('div');
        loader.className = 'loader';
        overlay.appendChild(loader);

        // If body exists, append to body, otherwise append to documentElement so it's visible early.
        const parent = document.body || document.documentElement;
        parent.appendChild(overlay);
    }

    // Check whether all images on the page are loaded (complete + non-zero natural size)
    function allImagesLoaded() {
        const imgs = Array.from(document.images || []);
        if (imgs.length === 0) return true;
        return imgs.every(img => img.complete && (img.naturalWidth || img.naturalHeight));
    }

    // Check audio readiness: treat audio with no src or preload='none' as OK.
    // For audio with src and preload not 'none', require readyState >= 3 (HAVE_FUTURE_DATA).
    function allAudioReady() {
        const audios = Array.from(document.querySelectorAll('audio'));
        if (audios.length === 0) return true;
        return audios.every(a => {
            const hasSrc = !!(a.currentSrc || a.src);
            if (!hasSrc) return true; // no source -> ignore
            const preload = (a.getAttribute('preload') || '').toLowerCase();
            if (preload === 'none') return true; // won't load automatically
            return a.readyState >= 3; // 3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA
        });
    }

    function allResourcesReady() {
        try {
            return allImagesLoaded() && allAudioReady();
        } catch (e) {
            return true; // be forgiving
        }
    }

    // Hide overlay with fade and then remove from DOM
    function hideOverlay() {
        const overlay = document.getElementById(LOADER_ID);
        if (!overlay) return;
        overlay.classList.add('hidden');
        // remove after transition
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, FADE_DURATION_MS + 50);
    }

    // Expose manual control
    window.hideLoader = hideOverlay;
    window.showLoader = function showLoader() {
        createOverlay();
    };

    // Setup and monitoring
    injectStyle();
    createOverlay();

    // Helper: load an image by URL and resolve on load/error
    function loadImageUrl(url) {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = url;
                // if already cached
                if (img.complete) {
                    resolve();
                }
            } catch (e) {
                resolve();
            }
        });
    }

    // Extract background-image URLs from computed styles of elements
    function extractBackgroundUrls() {
        const urls = new Set();
        const elements = Array.from(document.querySelectorAll('*'));
        const urlRegex = /url\((?:"|'|)(.*?)(?:"|'|)\)/g;
        elements.forEach(el => {
            try {
                const bg = getComputedStyle(el).backgroundImage;
                if (bg && bg !== 'none') {
                    let match;
                    while ((match = urlRegex.exec(bg)) !== null) {
                        const u = match[1];
                        if (u) urls.add(u);
                    }
                }
            } catch (e) {
                // ignore cross-origin computed style failures
            }
        });
        return Array.from(urls);
    }

    // Create promises for all current images, background-images, audio and video
    function createResourcePromises() {
        const promises = [];

        // regular <img> elements
        const imgs = Array.from(document.images || []);
        imgs.forEach(img => {
            if (img.complete && (img.naturalWidth || img.naturalHeight)) return;
            promises.push(new Promise((res) => {
                img.addEventListener('load', res, { once: true });
                img.addEventListener('error', res, { once: true });
            }));
        });

        // CSS background images
        const bgUrls = extractBackgroundUrls();
        bgUrls.forEach(u => {
            // ignore data: URIs (they are already available) but still safe to load
            promises.push(loadImageUrl(u));
        });

        // audio/video elements
        const medias = Array.from(document.querySelectorAll('audio,video'));
        medias.forEach(m => {
            const hasSrc = !!(m.currentSrc || m.src);
            if (!hasSrc) return; // nothing to wait for
            const preload = (m.getAttribute('preload') || '').toLowerCase();
            if (preload === 'none') return; // won't preload
            if (m.readyState >= 3) return; // already has enough data
            promises.push(new Promise((res) => {
                const onReady = () => { cleanup(); res(); };
                const onError = () => { cleanup(); res(); };
                const cleanup = () => {
                    m.removeEventListener('canplaythrough', onReady);
                    m.removeEventListener('loadeddata', onReady);
                    m.removeEventListener('error', onError);
                };
                m.addEventListener('canplaythrough', onReady, { once: true });
                m.addEventListener('loadeddata', onReady, { once: true });
                m.addEventListener('error', onError, { once: true });
            }));
        });

        return promises;
    }

    // Watch for newly added <img>, audio, video elements for a short grace period
    function waitForDynamicResources(timeoutMs = 2000) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(muts => {
                muts.forEach(m => {
                    m.addedNodes && m.addedNodes.forEach(node => {
                        if (!(node instanceof Element)) return;
                        if (node.tagName.toLowerCase() === 'img') {
                            if (!(node.complete && (node.naturalWidth || node.naturalHeight))) {
                                node.addEventListener('load', () => {}, { once: true });
                            }
                        }
                    });
                });
            });
            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
            // stop observing after timeout
            setTimeout(() => { observer.disconnect(); resolve(); }, timeoutMs);
        });
    }

    // Main waiting logic: gather promises, plus a MutationObserver grace window, with an overall timeout
    (async function waitForResourcesAndHide() {
        try {
            const resourcePromises = createResourcePromises();
            // also scan dynamic additions for a short grace period
            const dynamicPromise = waitForDynamicResources(1200);

            // wait for all current resources + dynamic grace to finish gathering
            await dynamicPromise;

            // refresh list (in case dynamic added elements created new media)
            const finalPromises = createResourcePromises();

            const allPromises = finalPromises.length ? Promise.all(finalPromises) : Promise.resolve();

            // race between resources finishing and MAX_WAIT_MS timeout
            await Promise.race([
                allPromises,
                new Promise(res => setTimeout(res, MAX_WAIT_MS))
            ]);

            // final hide with small delay so the transition is visible
            setTimeout(hideOverlay, 80);
        } catch (e) {
            // on any error, hide to avoid blocking the UI
            hideOverlay();
        }
    })();

})();
