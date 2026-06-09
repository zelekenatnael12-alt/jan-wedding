/**
 * JAN Wedding Platform — Gallery Logic
 * ──────────────────────────────────────────
 * Filters approved uploads, manages search,
 * and handles fullscreen lightbox & slideshow.
 */

document.addEventListener('DOMContentLoaded', () => {
  const galleryGrid   = document.getElementById('gallery-grid');
  const galleryEmpty  = document.getElementById('gallery-empty');
  const searchInput   = document.getElementById('gallery-search');
  const filterTabs    = document.querySelectorAll('.cat-tab');
  const slideshowBtn  = document.getElementById('slideshow-toggle');

  // Lightbox elements
  const lightbox       = document.getElementById('lightbox-overlay');
  const lightboxClose  = document.getElementById('lightbox-close');
  const lightboxPrev   = document.getElementById('lightbox-prev');
  const lightboxNext   = document.getElementById('lightbox-next');
  const mediaContainer = document.getElementById('lightbox-media-container');
  const lbGuest        = document.getElementById('lightbox-guest');
  const lbTime         = document.getElementById('lightbox-time');
  const lbMessage      = document.getElementById('lightbox-message');

  let activeItems = []; // List of currently matching items
  let allGalleryItems = []; // List of all approved files
  let currentIdx = 0;
  let slideshowInterval = null;

  /* ── Demo Data Fallback ─────────────────────────────────────────── */
  const demoGallery = [
    { id: 101, name: "Sarah & Mike", message: "Such a beautiful wedding! Wishing you both a lifetime of happiness.", type: "image", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop", timestamp: "2026-06-09T18:00:00.000Z" },
    { id: 102, name: "Jessica L.", message: "The venue is breathtaking. Cheers to the perfect couple!", type: "image", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop", timestamp: "2026-06-09T18:15:00.000Z" },
    { id: 103, name: "Uncle Robert", message: "So happy I could make it to celebrate with you.", type: "image", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop", timestamp: "2026-06-09T18:30:00.000Z" },
    { id: 104, name: "The Millers", message: "Congratulations! We love you guys.", type: "image", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop", timestamp: "2026-06-09T18:45:00.000Z" },
    { id: 105, name: "Emily & David", message: "Dancing the night away! 💃🕺", type: "image", url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?w=800&auto=format&fit=crop", timestamp: "2026-06-09T19:00:00.000Z" },
    { id: 106, name: "Daniel K.", message: "Unforgettable evening. Let the adventure begin!", type: "image", url: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&auto=format&fit=crop", timestamp: "2026-06-09T19:10:00.000Z" }
  ];

  /* ── Load Items ─────────────────────────────────────────────────── */
  async function loadGallery() {
    let uploads = [];
    try {
      uploads = await JAN_BACKEND.getUploads();
    } catch (err) {
      console.error('Error fetching gallery uploads:', err);
      try {
        uploads = JSON.parse(localStorage.getItem('jan_uploads') || '[]');
      } catch {
        uploads = [];
      }
    }

    // Extract all approved individual files
    allGalleryItems = [];
    uploads.forEach(u => {
      if (u.status === 'approved' && u.files && Array.isArray(u.files)) {
        u.files.forEach((file, idx) => {
          allGalleryItems.push({
            id: `${u.id}-${idx}`,
            name: u.name,
            message: u.message,
            type: file.type,
            url: file.url,
            timestamp: u.timestamp
          });
        });
      }
    });

    // If no approved files, fall back to the beautiful demo gallery
    if (allGalleryItems.length === 0) {
      allGalleryItems = [...demoGallery];
    }

    activeItems = [...allGalleryItems];
    renderGrid();
  }

  /* ── Render Grid ────────────────────────────────────────────────── */
  function renderGrid() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    if (activeItems.length === 0) {
      galleryEmpty.style.display = 'block';
      galleryGrid.style.display = 'none';
      return;
    }

    galleryEmpty.style.display = 'none';
    galleryGrid.style.display = 'grid';

    galleryGrid.innerHTML = activeItems.map((item, idx) => {
      const isVideo = item.type === 'video';
      return `
        <div class="gallery-item" data-index="${idx}" role="listitem">
          ${isVideo ? `<div class="gallery-item-video-badge">Video</div>` : ''}
          ${isVideo 
            ? `<video src="${item.url}" muted playsinline preload="metadata"></video>` 
            : `<img src="${item.url}" alt="Wedding memory by ${escHtml(item.name)}" loading="lazy" />`
          }
          <div class="gallery-item-overlay">
            <div class="gallery-item-name">${escHtml(item.name)}</div>
            ${item.message ? `<div class="gallery-item-msg">${escHtml(item.message)}</div>` : ''}
            <div class="gallery-item-time">${formatTime(item.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners
    const items = galleryGrid.querySelectorAll('.gallery-item');
    items.forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.index);
        openLightbox(idx);
      });
    });
  }

  /* ── Filters and Search ────────────────────────────────────────── */
  function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const activeTab = document.querySelector('.cat-tab.active');
    const mediaType = activeTab ? activeTab.dataset.filter : 'all';

    activeItems = allGalleryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search) || 
                            (item.message && item.message.toLowerCase().includes(search));
      const matchesType = (mediaType === 'all') || (item.type === mediaType);
      return matchesSearch && matchesType;
    });

    renderGrid();
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      applyFilters();
    });
  });

  /* ── Lightbox Logic ─────────────────────────────────────────────── */
  function openLightbox(index) {
    if (index < 0 || index >= activeItems.length) return;
    currentIdx = index;
    
    const item = activeItems[currentIdx];

    // Load media
    mediaContainer.innerHTML = '';
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.url;
      video.controls = true;
      video.autoplay = true;
      video.style.outline = 'none';
      mediaContainer.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = `Enlarged view by ${item.name}`;
      mediaContainer.appendChild(img);
    }

    // Load text details
    lbGuest.textContent = item.name;
    lbTime.textContent  = formatTime(item.timestamp);
    lbMessage.textContent = item.message || 'Shared a moment';
    
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    
    // Stop any video
    const video = mediaContainer.querySelector('video');
    if (video) video.pause();
    
    stopSlideshow();
  }

  function nextSlide() {
    if (activeItems.length <= 1) return;
    openLightbox((currentIdx + 1) % activeItems.length);
  }

  function prevSlide() {
    if (activeItems.length <= 1) return;
    openLightbox((currentIdx - 1 + activeItems.length) % activeItems.length);
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', nextSlide);
  lightboxPrev.addEventListener('click', prevSlide);

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  // Close when clicking overlay (outside container)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ── Slideshow Logic ────────────────────────────────────────────── */
  function startSlideshow() {
    if (activeItems.length === 0) return;
    
    // Open lightbox at first slide if not open
    if (!lightbox.classList.contains('open')) {
      openLightbox(0);
    }
    
    slideshowBtn.textContent = '⏸ Pause Slideshow';
    slideshowBtn.classList.add('btn-gold');
    slideshowBtn.classList.remove('btn-outline');

    slideshowInterval = setInterval(nextSlide, 3500);
  }

  function stopSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
    slideshowBtn.textContent = '▶ Play Slideshow';
    slideshowBtn.classList.remove('btn-gold');
    slideshowBtn.classList.add('btn-outline');
  }

  slideshowBtn.addEventListener('click', () => {
    if (slideshowInterval) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  });

  /* ── Helpers ────────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  /* ── Init ───────────────────────────────────────────────────────── */
  (async () => {
    await loadGallery();
  })();
});
