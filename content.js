(function () {
    "use strict";

    const htmlEl = document.documentElement;
    const isDark = htmlEl.classList.contains("theme-dark");
    htmlEl.setAttribute("data-rkni-theme", isDark ? "dark" : "light");

    const HIGHLIGHT = "rkni-highlight";
    const INDICATOR_ID = "rkni-indicator";
    const OVERLAY_ID = "rkni-overlay";
    let shortcutsEnabled = true;

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

    function vote(type, posts) {
        const idx = getCurrentIndex(posts);
        const selector = type === "up" ? "button[upvote]" : "button[downvote]";
        let btn = null;
        if (idx >= 0 && posts[idx]) {
            const post = posts[idx];
            const voteContainers = ['[data-post-click-location="vote"]', '[data-testid="vote-arrows"]', ".vote", '[class*="vote"]', "shreddit-post"];

            for (const containerSelector of voteContainers) {
                const container = post.querySelector(containerSelector);
                if (container) {
                    btn = container.querySelector(selector);
                    if (btn) break;
                    if (container.shadowRoot) {
                        btn = container.shadowRoot.querySelector(selector);
                        if (btn) break;
                    }
                }
            }

            if (!btn) {
                btn = post.querySelector(selector);
            }
        }
        if (!btn) {
            const container = document.querySelector('[data-post-click-location="vote"]');
            if (container) btn = container.querySelector(selector);
        }
        if (!btn) {
            const sp = document.querySelector("shreddit-post");
            if (sp && sp.shadowRoot) {
                btn = sp.shadowRoot.querySelector(selector);
            }
        }
        btn && btn.click();
    }

    function createIndicator() {
        if (document.getElementById(INDICATOR_ID)) return;
        const el = document.createElement("div");
        el.id = INDICATOR_ID;
        el.innerHTML = `
      <span class="rkni-indicator-text">Shortcuts:</span>
      <span class="rkni-indicator-key">Shift + ?</span>
    `;
        document.body.appendChild(el);
    }

    function updateIndicator() {
        const el = document.getElementById(INDICATOR_ID);
        if (!el) return;
        const textSpan = el.querySelector(".rkni-indicator-text");
        const keySpan = el.querySelector(".rkni-indicator-key");
        if (shortcutsEnabled) {
            textSpan.textContent = "Shortcuts:";
            keySpan.textContent = "Shift + ?";
        } else {
            textSpan.textContent = "Turn on shortcuts:";
            keySpan.textContent = "Ctrl + \\";
        }
    }

    function createOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const ov = document.createElement("div");
        ov.id = OVERLAY_ID;
        ov.innerHTML = `
      <div class="rkni-ov-content">
        <h3>Reddit Keyboard Navigator</h3>
        
        <div class="rkni-shortcuts-grid">
          <div class="shortcut-category">
            <div class="category-title">Navigation</div>
            <ul>
              <li><span class="shortcut-strong-wrapper"><strong>↑ / ↓</strong></span> Navigate posts</li>
              <li><span class="shortcut-strong-wrapper"><strong>Alt + ← / →</strong></span> Back/Forward</li>
            </ul>
          </div>

          <div class="shortcut-category">
            <div class="category-title">Posts</div>
            <ul>
              <li><span class="shortcut-strong-wrapper"><strong>Enter</strong></span> Open post</li>
              <li><span class="shortcut-strong-wrapper"><strong>Shift+Enter</strong></span> Open post in new tab</li>
              <li><span class="shortcut-strong-wrapper"><strong>U / D</strong></span> Upvote/Downvote post</li>
            </ul>
          </div>

          <div class="shortcut-category">
            <div class="category-title">Media</div>
            <ul>
              <li><span class="shortcut-strong-wrapper"><strong>I / Esc</strong></span> Open/Close image(s)</li>
              <li><span class="shortcut-strong-wrapper"><strong>← / →</strong></span> Prev/Next image</li>
              <li><span class="shortcut-strong-wrapper"><strong>Space</strong></span> Play/Pause video</li>
              <li><span class="shortcut-strong-wrapper"><strong>M</strong></span> Mute/unmute video</li>
              <li><span class="shortcut-strong-wrapper"><strong>F</strong></span> Toggle fullscreen</li>
            </ul>
          </div>

          <div class="shortcut-category">
            <div class="category-title">Help</div>
            <ul>
              <li><span class="shortcut-strong-wrapper"><strong>Shift + ?</strong></span> Toggle this help</li>
              <li><span class="shortcut-strong-wrapper"><strong>Ctrl + \\</strong></span> Toggle all shortcuts</li>
            </ul>
          </div>
        </div>

        <p class="close-hint">Press <strong>Shift + ?</strong> or <strong>Esc</strong> to close</p>
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
            if (e.ctrlKey && e.key === "\\") {
                e.preventDefault();
                shortcutsEnabled = !shortcutsEnabled;
                updateIndicator();
                if (!shortcutsEnabled) {
                    const posts = getPosts();
                    posts.forEach(p => p.classList.remove(HIGHLIGHT));
                }
                return;
            }
            if (!shortcutsEnabled) {
                return;
            }
            if (/INPUT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            if (e.altKey && e.key === "ArrowLeft") {
                e.preventDefault();
                window.history.back();
                return;
            }
            if (e.altKey && e.key === "ArrowRight") {
                e.preventDefault();
                window.history.forward();
                return;
            }

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

            if (e.key.toLowerCase() === "u") {
                e.preventDefault();
                vote("up", posts);
                return;
            }
            if (e.key.toLowerCase() === "d") {
                e.preventDefault();
                vote("down", posts);
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                let videoEl = null;
                if (lightbox) {
                    const lbPlayer = lightbox.querySelector("shreddit-player-2");
                    if (lbPlayer && lbPlayer.shadowRoot) {
                        videoEl = lbPlayer.shadowRoot.querySelector("video");
                    }
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
                    if (videoEl.paused) videoEl.play();
                    else videoEl.pause();
                }
                return;
            }

            if (e.key.toLowerCase() === "m") {
                e.preventDefault();
                let videoEl = null;
                if (lightbox) {
                    const lbPlayer = lightbox.querySelector("shreddit-player-2");
                    if (lbPlayer && lbPlayer.shadowRoot) {
                        videoEl = lbPlayer.shadowRoot.querySelector("video");
                    }
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

            if (e.key.toLowerCase() === "f") {
                e.preventDefault();
                let playerShadow = null;
                const lightboxF = document.querySelector("#shreddit-media-lightbox");
                if (lightboxF) {
                    const lbPlayerF = lightboxF.querySelector("shreddit-player-2");
                    if (lbPlayerF && lbPlayerF.shadowRoot) playerShadow = lbPlayerF.shadowRoot;
                }
                if (!playerShadow) {
                    const feedPlayerF = posts[getCurrentIndex(posts)]?.querySelector("shreddit-player-2");
                    if (feedPlayerF && feedPlayerF.shadowRoot) playerShadow = feedPlayerF.shadowRoot;
                }
                if (!playerShadow) {
                    const pagePlayerF = document.querySelector("shreddit-player-2");
                    if (pagePlayerF && pagePlayerF.shadowRoot) playerShadow = pagePlayerF.shadowRoot;
                }
                if (playerShadow) {
                    const fsBtn = playerShadow.querySelector('button[aria-label="Toggle fullscreen"], button[aria-label="Full screen"], button.fullscreen');
                    if (fsBtn) {
                        fsBtn.click();
                        return;
                    }
                }
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    return;
                }
                const lightboxHost = document.querySelector("#shreddit-media-lightbox")?.querySelector("shreddit-player-2");
                const feedHost = posts[getCurrentIndex(posts)]?.querySelector("shreddit-player-2");
                const pageHost = document.querySelector("shreddit-player-2");
                const host = lightboxHost || feedHost || pageHost;
                if (host && host.requestFullscreen) {
                    host.requestFullscreen();
                    return;
                }
            }

            if (e.key === "?" && e.shiftKey) {
                e.preventDefault();
                return toggleOverlay();
            }
            if (e.key === "Escape" && document.getElementById(OVERLAY_ID)) {
                e.preventDefault();
                return toggleOverlay();
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
        createIndicator();
        updateIndicator();
        if (!posts.length) return;
        let start = posts.findIndex(p => {
            const r = p.getBoundingClientRect();
            return r.top >= 0 && r.bottom <= window.innerHeight;
        });
        if (start < 0) start = 0;
        highlight(start, posts);
    }

    const _push = history.pushState;
    history.pushState = function () {
        _push.apply(this, arguments);
        window.dispatchEvent(new Event("locationchange"));
    };
    const _replace = history.replaceState;
    history.replaceState = function () {
        _replace.apply(this, arguments);
        window.dispatchEvent(new Event("locationchange"));
    };
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
    window.addEventListener("locationchange", () => setTimeout(init, 50));

    if (document.readyState === "complete") setTimeout(init, 50);
    else window.addEventListener("load", init);
})();
