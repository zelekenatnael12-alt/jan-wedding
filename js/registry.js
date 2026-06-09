/**
 * JAN Wedding Platform — Registry Page Logic
 * ────────────────────────────────────────────
 * Renders gift cards, handles search/filter, reservations via JAN_BACKEND
 */

document.addEventListener('DOMContentLoaded', () => {
  const grid          = document.getElementById('registry-grid');
  const searchInput   = document.getElementById('registry-search');
  const categoryTabs  = document.querySelectorAll('.cat-tab');
  const modalOverlay  = document.getElementById('modal-overlay');
  const modalGiftName = document.getElementById('modal-gift-name');
  const modalGiftPrice= document.getElementById('modal-gift-price');
  const modalGiftEmoji= document.getElementById('modal-gift-emoji');
  const reserverInput = document.getElementById('reserver-name');
  const confirmBtn    = document.getElementById('confirm-reserve');
  const cancelBtn     = document.getElementById('cancel-reserve');
  const modalClose    = document.getElementById('modal-close');

  const statTotal     = document.getElementById('stat-total');
  const statReserved  = document.getElementById('stat-reserved');
  const statAvail     = document.getElementById('stat-available');

  let activeCategory  = 'all';
  let activeGiftId    = null;
  let reservations    = {};   // { giftId: reserverName }

  /* ── Load Reservations ────────────────────────────────────────── */
  async function loadReservations() {
    try {
      const rows = await JAN_BACKEND.getReservations();
      reservations = {};
      rows.forEach(r => { reservations[r.gift_id] = r.reserver_name; });
    } catch {
      try { reservations = JSON.parse(localStorage.getItem('jan_reservations') || '{}'); }
      catch { reservations = {}; }
    }
  }

  /* ── Merge Config Data with Reservations ─────────────────────── */
  function getItems() {
    return JAN_CONFIG.registry.map(item => ({
      ...item,
      reserved:     !!reservations[item.id],
      reservedBy:   reservations[item.id] || null
    }));
  }

  /* ── Filter Items ─────────────────────────────────────────────── */
  function filterItems(items) {
    const query = (searchInput?.value || '').trim().toLowerCase();
    return items.filter(item => {
      const matchCat   = activeCategory === 'all' || item.category.toLowerCase() === activeCategory;
      const matchQuery = !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }

  /* ── Render Grid ──────────────────────────────────────────────── */
  function render() {
    const all      = getItems();
    const filtered = filterItems(all);

    // Stats
    const reserved = all.filter(i => i.reserved).length;
    if (statTotal)    statTotal.textContent    = all.length;
    if (statReserved) statReserved.textContent = reserved;
    if (statAvail)    statAvail.textContent    = all.length - reserved;

    // Grid
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <span class="no-results-icon">🔍</span>
          <p>No gifts found. Try a different search or category.</p>
        </div>`;
      return;
    }

    filtered.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = `gift-card${item.reserved ? ' reserved' : ''} fade-up`;
      card.style.transitionDelay = `${i * 50}ms`;
      card.innerHTML = buildCardHTML(item);
      grid.appendChild(card);

      if (!item.reserved) {
        card.querySelector('.btn-reserve')?.addEventListener('click', () => {
          openModal(item);
        });
      }
    });

    // Trigger scroll reveal for newly added cards
    setTimeout(() => {
      grid.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 30);
  }

  function buildCardHTML(item) {
    return `
      <div class="gift-card-emoji">
        <span>${item.emoji}</span>
        ${item.reserved ? `<div class="reserved-ribbon">Reserved</div>` : ''}
      </div>
      <div class="gift-card-body">
        <div class="gift-card-top">
          <div class="gift-name">${item.name}</div>
          <div class="gift-price">$${item.price.toLocaleString()}</div>
        </div>
        <div class="gift-desc">${item.description}</div>
        <div class="gift-footer">
          ${item.reserved
            ? `<span class="badge badge-reserved">Reserved</span>
               <span class="gift-reservee">by ${item.reservedBy}</span>`
            : `<span class="badge badge-available">Available</span>
               <button class="btn btn-gold btn-reserve">Reserve →</button>`
          }
        </div>
      </div>
    `;
  }

  /* ── Category Tabs ────────────────────────────────────────────── */
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.category;
      render();
    });
  });

  /* ── Search ───────────────────────────────────────────────────── */
  let searchTimeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(render, 200);
  });

  /* ── Reserve Modal ────────────────────────────────────────────── */
  function openModal(item) {
    activeGiftId = item.id;
    if (modalGiftEmoji) modalGiftEmoji.textContent  = item.emoji;
    if (modalGiftName)  modalGiftName.textContent   = item.name;
    if (modalGiftPrice) modalGiftPrice.textContent  = `$${item.price.toLocaleString()}`;
    if (reserverInput)  reserverInput.value = '';
    modalOverlay?.classList.add('open');
    setTimeout(() => reserverInput?.focus(), 200);
  }

  function closeModal() {
    modalOverlay?.classList.remove('open');
    activeGiftId = null;
  }

  modalClose?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  // Allow ESC to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  confirmBtn?.addEventListener('click', async () => {
    const name = reserverInput?.value.trim();
    if (!name) {
      reserverInput?.focus();
      reserverInput?.classList.add('shake');
      setTimeout(() => reserverInput?.classList.remove('shake'), 400);
      showToast('Please enter your name to reserve this gift.', 'error');
      return;
    }

    if (activeGiftId === null) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Reserving…';
    try {
      await JAN_BACKEND.saveReservation(activeGiftId, name);
      reservations[activeGiftId] = name;
    } catch (err) {
      console.error('Reservation error:', err);
      showToast('Could not save reservation. Please try again.', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Reservation';
      return;
    }
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Reservation';
    closeModal();
    render();
    showToast(`🎁 Reserved! Thank you, ${name}.`, 'success');
  });

  // Allow Enter to confirm
  reserverInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmBtn?.click();
  });

  /* ── Init ─────────────────────────────────────────────────────── */
  (async () => {
    await loadReservations();
    render();
  })();
});
