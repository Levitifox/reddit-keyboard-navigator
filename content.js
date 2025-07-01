(function() {
  'use strict';

  const HIGHLIGHT = 'rkni-highlight';

  function getPosts() {
    const anchors = Array.from(document.querySelectorAll('a[href*="/comments/"]'));
    const seen = new Set();
    return anchors
      .map(a => a.closest('article') || a.closest('[data-testid="post-container"]'))
      .filter(post => post
        && !seen.has(post)
        && post.getBoundingClientRect().height > 50
        && (seen.add(post), true)
      );
  }

  function getCurrentIndex(posts) {
    return posts.findIndex(p => p.classList.contains(HIGHLIGHT));
  }

  function highlight(index, posts) {
    posts.forEach(p => p.classList.remove(HIGHLIGHT));
    const p = posts[index];
    if (!p) return;
    p.classList.add(HIGHLIGHT);
    p.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function pauseMedia(post) {
    if (!post) return;
    post.querySelectorAll('video, audio').forEach(m => {
      m.pause();
      m.currentTime = 0;
    });
  }

  function openPost(newTab, posts) {
    const p = posts[getCurrentIndex(posts)];
    if (!p) return;
    const link = p.querySelector('a[data-click-id="body"], a[href*="/comments/"]');
    if (!link) return;
    newTab
      ? window.open(link.href, '_blank')
      : (location.href = link.href);
  }

  function openMedia(posts) {
    const p = posts[getCurrentIndex(posts)];
    if (!p) return;
    const wrap = p.querySelector('[data-click-id="media"], [data-testid="post-content"]');
    if (wrap) { wrap.click(); return; }
    const leaf = p.querySelector('img[src*="preview.redd.it"], img[src*="i.redd.it"], video');
    leaf && leaf.click();
  }

  function lightboxOpen() {
    return !!document.querySelector('[data-testid="media-lightbox"], .Lightbox, [role="dialog"]');
  }
  function navLightbox(dir) {
    const root = document.querySelector('[data-testid="media-lightbox"], .Lightbox, [role="dialog"]');
    if (!root) return;
    const sel = dir==='prev'
      ? 'button[aria-label*="Previous"], [data-testid="lightbox-prev"]'
      : 'button[aria-label*="Next"], [data-testid="lightbox-next"]';
    const btn = root.querySelector(sel);
    btn && btn.click();
  }
  function closeLightbox() {
    const btn = document.querySelector('[data-testid="lightbox-close"], button[aria-label*="Close"]');
    btn && btn.click();
  }

  document.addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable) {
      if (e.key === 'Escape' && lightboxOpen()) {
        e.preventDefault();
        closeLightbox();
      }
      return;
    }

    const posts = getPosts();
    const idx = getCurrentIndex(posts);
    let newIdx = idx;

    switch (e.key) {
      case 'ArrowUp':
        if (!lightboxOpen() && posts.length) {
          e.preventDefault();
          pauseMedia(posts[idx]);
          newIdx = idx <= 0 ? 0 : idx - 1;
          if (idx < 0) newIdx = 0;
          highlight(newIdx, posts);
        }
        break;

      case 'ArrowDown':
        if (!lightboxOpen() && posts.length) {
          e.preventDefault();
          pauseMedia(posts[idx]);
          newIdx = idx < 0
            ? 0
            : Math.min(posts.length - 1, idx + 1);
          highlight(newIdx, posts);
        }
        break;

      case 'Enter':
        if (!lightboxOpen()) {
          e.preventDefault();
          openPost(e.shiftKey, posts);
        }
        break;

      case 'i': case 'I':
        if (!lightboxOpen()) {
          e.preventDefault();
          openMedia(posts);
        }
        break;

      case 'ArrowLeft':
        if (lightboxOpen()) {
          e.preventDefault();
          navLightbox('prev');
        }
        break;

      case 'ArrowRight':
        if (lightboxOpen()) {
          e.preventDefault();
          navLightbox('next');
        }
        break;

      case 'Escape':
        if (lightboxOpen()) {
          e.preventDefault();
          closeLightbox();
        }
        break;
    }
  }, true);

  window.addEventListener('load', () => {
    const posts = getPosts();
    if (!posts.length) return;
    let start = posts.findIndex(p => {
      const r = p.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
    if (start < 0) start = 0;
    highlight(start, posts);
  });

})();
