(function () {
    "use strict";

    const HIGHLIGHT = "rkni-highlight";
    const INDICATOR_ID = "rkni-indicator";
    const OVERLAY_ID = "rkni-overlay";

    function getPosts() {
        const anchors = Array.from(document.querySelectorAll('a[href*="/comments/"]'));
        const seen = new Set();
        return anchors.map(a => a.closest("article") || a.closest('[data-testid="post-container"]')).filter(p => p && !seen.has(p) && seen.add(p));
    }

    function getCurrentIndex(posts) {
        return posts.findIndex(p => p.classList.contains(HIGHLIGHT));
    }

    function highlight(idx, posts) {
        posts.forEach(p => p.classList.remove(HIGHLIGHT));
        const p = posts[idx];
        if (!p) return;
        p.classList.add(HIGHLIGHT);
        p.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function openMedia(posts) {
        const idx = getCurrentIndex(posts);
        if (idx >= 0 && posts.length) {
            const p = posts[idx];
            const wrap = p.querySelector('[data-click-id="media"], [data-testid="post-content"]');
            if (wrap) return wrap.click();
            const leaf = p.querySelector('img[src*="i.redd.it"], img[src*="preview.redd.it"], video');
            if (leaf) return leaf.click();
        }
        const wrapPage = document.querySelector('[data-click-id="media"], [data-testid="post-content"]');
        if (wrapPage) return wrapPage.click();
        const leafPage = document.querySelector('img[src*="i.redd.it"], img[src*="preview.redd.it"], video');
        leafPage && leafPage.click();
    }

    function openPost(posts, openInNewTab) {
        const p = posts[getCurrentIndex(posts)];
        if (!p) return;
        const link = p.querySelector('a[href*="/comments/"]');
        if (!link) return;
        if (openInNewTab) {
            link.dispatchEvent(
                new MouseEvent("click", {
                    ctrlKey: true,
                    shiftKey: true,
                    bubbles: true,
                    cancelable: true,
                    view: window,
                }),
            );
        } else {
            window.location.href = link.href;
        }
    }

    function createIndicator() {
        if (document.getElementById(INDICATOR_ID)) return;
        const el = document.createElement("div");
        el.id = INDICATOR_ID;
        el.innerHTML = `
      <span class="rkni-indicator-text">Shortcuts:</span>
      <span class="rkni-indicator-key">Shift+?</span>
    `;
        document.body.appendChild(el);
    }

    function createOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const ov = document.createElement("div");
        ov.id = OVERLAY_ID;
        ov.innerHTML = `
      <div class="rkni-ov-content">
        <h3>Reddit Keyboard Navigator</h3>
        
        <div class="shortcut-category">
          <div class="category-title">Navigation</div>
          <ul>
            <li><strong>↑ / ↓</strong> Navigate posts</li>
            <li><strong>/</strong> Search Reddit</li>
          </ul>
        </div>

        <div class="shortcut-category">
          <div class="category-title">Posts</div>
          <ul>
            <li><strong>Enter</strong> Open post</li>
            <li><strong>Shift+Enter</strong> Open post in new tab</li>
          </ul>
        </div>

        <div class="shortcut-category">
          <div class="category-title">Media</div>
          <ul>
            <li><strong>I</strong> Open image/gallery</li>
            <li><strong>← / →</strong> Prev/Next image</li>
            <li><strong>Esc</strong> Close image</li>
            <li><strong>M</strong> Mute/unmute video</li>
          </ul>
        </div>

        <div class="shortcut-category">
          <div class="category-title">Help</div>
          <ul>
            <li><strong>Shift+?</strong> Toggle this help</li>
          </ul>
        </div>

        <p class="close-hint">Press <strong>Shift+?</strong> or <strong>Esc</strong> to close</p>
      </div>
    `;
        document.body.appendChild(ov);
    }

    function toggleOverlay() {
        const ov = document.getElementById(OVERLAY_ID);
        if (ov) ov.remove();
        else createOverlay();
    }

    document.addEventListener(
        "keydown",
        e => {
            let galleryRoot = null;

            const lightbox = document.querySelector("#shreddit-media-lightbox");
            if (lightbox) {
                const gb = lightbox.querySelector("gallery-carousel");
                galleryRoot = gb && gb.shadowRoot;
            }

            const posts = getPosts();
            const idx = getCurrentIndex(posts);
            if (!galleryRoot && idx >= 0) {
                const p = posts[idx];
                const gb2 = p && p.querySelector("gallery-carousel");
                galleryRoot = gb2 && gb2.shadowRoot;
            }

            if (!galleryRoot) {
                const gb3 = document.querySelector("gallery-carousel");
                galleryRoot = gb3 && gb3.shadowRoot;
            }

            if (galleryRoot) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    const prev = galleryRoot.querySelector('button[aria-label="Previous page"]');
                    prev && prev.click();
                    return;
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    const next = galleryRoot.querySelector('button[aria-label="Next page"]');
                    next && next.click();
                    return;
                }
            }

            if (e.key.toLowerCase() === "m") {
                e.preventDefault();
                let videoEl = null;
                const lbPlayer = lightbox && lightbox.querySelector("shreddit-player-2");
                if (lbPlayer && lbPlayer.shadowRoot) {
                    videoEl = lbPlayer.shadowRoot.querySelector("video");
                }
                if (!videoEl && idx >= 0) {
                    const feedPlayer = posts[idx].querySelector("shreddit-player-2");
                    if (feedPlayer && feedPlayer.shadowRoot) {
                        videoEl = feedPlayer.shadowRoot.querySelector("video");
                    }
                }
                if (!videoEl) {
                    const pagePlayer = document.querySelector("shreddit-player-2");
                    if (pagePlayer && pagePlayer.shadowRoot) {
                        videoEl = pagePlayer.shadowRoot.querySelector("video");
                    }
                }
                if (videoEl) {
                    videoEl.muted = !videoEl.muted;
                }
                return;
            }

            if (e.key === "?" && e.shiftKey) {
                e.preventDefault();
                return toggleOverlay();
            }
            if (e.key === "Escape" && document.getElementById(OVERLAY_ID)) {
                e.preventDefault();
                return toggleOverlay();
            }

            if (/INPUT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            if (["ArrowUp", "ArrowDown", "i", "Enter"].includes(e.key) || e.key.toLowerCase() === "i") {
                if (e.key === "ArrowUp") {
                    if (!posts.length) return;
                    e.preventDefault();
                    const newIdx = idx <= 0 ? 0 : idx - 1;
                    highlight(newIdx, posts);
                } else if (e.key === "ArrowDown") {
                    if (!posts.length) return;
                    e.preventDefault();
                    const newIdx = idx < 0 ? 0 : Math.min(posts.length - 1, idx + 1);
                    highlight(newIdx, posts);
                } else if (e.key.toLowerCase() === "i") {
                    e.preventDefault();
                    openMedia(posts);
                } else if (e.key === "Enter") {
                    if (!posts.length) return;
                    e.preventDefault();
                    openPost(posts, e.shiftKey);
                }
            }
        },
        true,
    );

    function init() {
        const posts = getPosts();
        if (!posts.length) return;
        let start = posts.findIndex(p => {
            const r = p.getBoundingClientRect();
            return r.top >= 0 && r.bottom <= window.innerHeight;
        });
        if (start < 0) start = 0;
        highlight(start, posts);
        createIndicator();
    }

    if (document.readyState === "complete") setTimeout(init, 50);
    else window.addEventListener("load", init);
})();
