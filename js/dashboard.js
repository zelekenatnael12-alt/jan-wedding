/**
 * JAN Wedding Platform — Couple's Dashboard Logic
 * ─────────────────────────────────────────────────
 * PIN lock, stats, submissions viewer, registry manager
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── PIN Lock ─────────────────────────────────────────────────── */
  const pinScreen   = document.getElementById('pin-screen');
  const dashboard   = document.getElementById('dashboard');
  const pinDots     = document.querySelectorAll('.pin-dot');
  const pinKeys     = document.querySelectorAll('.pin-key');

  let pinEntry = '';
  const CORRECT_PIN = JAN_CONFIG.dashboardPin || '1234';
  const SESSION_KEY = 'jan_dash_auth';

  // Check if already authenticated this session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    unlockDashboard();
  }

  function updateDots() {
    pinDots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < pinEntry.length);
      dot.classList.remove('error');
    });
  }

  function showError() {
    pinDots.forEach(d => d.classList.add('error'));
    pinEntry = '';
    setTimeout(updateDots, 600);
  }

  function checkPin() {
    if (pinEntry === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      pinScreen.style.opacity = '0';
      pinScreen.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        pinScreen.style.display = 'none';
        unlockDashboard();
      }, 500);
    } else {
      showError();
    }
  }

  async function unlockDashboard() {
    dashboard.classList.add('visible');
    await renderDashboard();
  }

  pinKeys.forEach(key => {
    key.addEventListener('click', () => {
      const val = key.dataset.value;
      if (val === 'clear') {
        pinEntry = pinEntry.slice(0, -1);
        updateDots();
        return;
      }
      if (pinEntry.length >= 4) return;
      pinEntry += val;
      updateDots();
      if (pinEntry.length === 4) {
        setTimeout(checkPin, 150);
      }
    });
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (pinScreen.style.display === 'none') return;
    if (e.key >= '0' && e.key <= '9') {
      const btn = document.querySelector(`.pin-key[data-value="${e.key}"]`);
      btn?.click();
    }
    if (e.key === 'Backspace') {
      document.querySelector('.pin-key[data-value="clear"]')?.click();
    }
  });

  /* ── Initialise Demo Data if empty ────────────────────────────── */
  function initDemoData() {
    // 1. RSVPs
    if (!localStorage.getItem('jan_rsvps')) {
      const demoRsvps = [
        { id: 1001, primaryName: "Sarah & Mike Jenkins", contact: "sarah.j@example.com", attendance: "accept", partySize: 2, guest1Meal: "beef", guest2Name: "Mike Jenkins", guest2Meal: "salmon", dietaryNotes: "No shellfish, please.", congratsNote: "We can't wait to share your big day with you! Congratulations!", timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
        { id: 1002, primaryName: "David Miller", contact: "555-0199", attendance: "decline", partySize: 0, congratsNote: "So sorry we can't make it, sending all our love and wishes!", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: 1003, primaryName: "Emily Stone", contact: "emily.stone@example.com", attendance: "accept", partySize: 1, guest1Meal: "risotto", dietaryNotes: "Gluten-free", congratsNote: "Wishing you both a lifetime of happiness together.", timestamp: new Date(Date.now() - 3600000 * 5).toISOString() }
      ];
      localStorage.setItem('jan_rsvps', JSON.stringify(demoRsvps));
    }

    // 2. Uploads
    if (!localStorage.getItem('jan_uploads')) {
      const demoUploads = [
        {
          id: 2001,
          name: "Uncle Robert",
          message: "Great speeches tonight!",
          fileCount: 2,
          status: "approved",
          files: [
            { type: "image", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop" },
            { type: "image", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop" }
          ],
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 2002,
          name: "Jessica L.",
          message: "Look at the beautiful table settings!",
          fileCount: 1,
          status: "pending",
          files: [
            { type: "image", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop" }
          ],
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      localStorage.setItem('jan_uploads', JSON.stringify(demoUploads));
    }

    // 3. Guestbook
    if (!localStorage.getItem('jan_guestbook')) {
      const demoMessages = [
        { id: 3001, name: "Grandma Evelyn", audioUrl: "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA", timestamp: new Date(Date.now() - 86400000).toISOString() }
      ];
      localStorage.setItem('jan_guestbook', JSON.stringify(demoMessages));
    }
  }

  // Populate data if first run
  initDemoData();

  /* ── Render Dashboard ─────────────────────────────────────────── */
  async function renderDashboard() {
    try {
      const [rsvps, uploads, reservations, messages] = await Promise.all([
        getRsvps(),
        getUploads(),
        getReservations(),
        getMessages()
      ]);

      renderStats(uploads, reservations, messages, rsvps);
      renderUploadsTable(uploads);
      renderRsvpsTable(rsvps);
      renderMealCharts(rsvps);
      renderReservationsTable(reservations);
      renderMessagesTable(messages);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Error loading dashboard statistics.', 'error');
    }
  }

  /* ── Data Loaders ─────────────────────────────────────────────── */
  async function getRsvps() {
    try { return await JAN_BACKEND.getRsvps(); }
    catch {
      try { return JSON.parse(localStorage.getItem('jan_rsvps') || '[]'); }
      catch { return []; }
    }
  }

  async function getUploads() {
    try { return await JAN_BACKEND.getUploads(); }
    catch {
      try { return JSON.parse(localStorage.getItem('jan_uploads') || '[]'); }
      catch { return []; }
    }
  }

  async function getReservations() {
    try {
      const rows = await JAN_BACKEND.getReservations();
      return rows.map(r => {
        const gift = JAN_CONFIG.registry.find(g => g.id === Number(r.gift_id));
        return { id: Number(r.gift_id), reservedBy: r.reserver_name, gift };
      }).filter(r => r.gift);
    } catch {
      try {
        const raw = JSON.parse(localStorage.getItem('jan_reservations') || '{}');
        return Object.entries(raw).map(([id, name]) => {
          const gift = JAN_CONFIG.registry.find(g => g.id === Number(id));
          return { id: Number(id), reservedBy: name, gift };
        }).filter(r => r.gift);
      } catch { return []; }
    }
  }

  async function getMessages() {
    try { return await JAN_BACKEND.getGuestbook(); }
    catch {
      try { return JSON.parse(localStorage.getItem('jan_guestbook') || '[]'); }
      catch { return []; }
    }
  }

  /* ── Stats ────────────────────────────────────────────────────── */
  function renderStats(uploads, reservations, messages, rsvps) {
    const totalFiles = uploads.reduce((sum, u) => sum + (u.fileCount || 0), 0);
    const attendingCount = rsvps.reduce((sum, r) => r.attendance === 'accept' ? sum + (r.partySize || 1) : sum, 0);
    const declinedCount  = rsvps.filter(r => r.attendance === 'decline').length;

    set('stat-uploads',        uploads.length);
    set('stat-files',          totalFiles);
    set('stat-reservations',   reservations.length);
    set('stat-messages',       messages.length);
    set('stat-rsvp-attending', attendingCount);
    set('stat-rsvp-declined',  declinedCount);
  }

  /* ── Uploads Table & Moderation Actions ───────────────────────── */
  function renderUploadsTable(uploads) {
    const tbody = document.getElementById('uploads-tbody');
    const count = document.getElementById('uploads-count');
    if (!tbody) return;

    count.textContent = `${uploads.length} submission${uploads.length !== 1 ? 's' : ''}`;

    if (uploads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <span class="empty-state-icon">📭</span>
          <p class="empty-state-text">No memories submitted yet. Share the portal with your guests!</p>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = uploads.slice().reverse().map(u => {
      // Map thumbnails
      let thumbsHtml = '—';
      if (u.files && Array.isArray(u.files)) {
        thumbsHtml = u.files.map(f => {
          if (f.type === 'video') {
            return `<span class="dash-thumb" style="display:inline-flex;align-items:center;justify-content:center;background:#1a1a1a;color:var(--gold);font-size:0.8rem;" title="Video submission">📹</span>`;
          }
          return `<img src="${f.url}" class="dash-thumb" alt="Preview" />`;
        }).join('');
      }

      const isPending = u.status !== 'approved';
      const statusBadge = isPending 
        ? `<span class="badge" style="color:#f2c94c;border-color:rgba(242,201,76,0.4);background:rgba(242,201,76,0.08);">Pending</span>`
        : `<span class="badge badge-available">Approved</span>`;

      const actionHtml = isPending
        ? `<div class="action-btns">
             <button class="btn-action approve" data-id="${u.id}">Approve</button>
             <button class="btn-action reject" data-id="${u.id}">Delete</button>
           </div>`
        : `<div class="action-btns">
             <button class="btn-action reject" data-id="${u.id}" style="border-color:rgba(235,87,87,0.2);">Delete</button>
           </div>`;

      return `
        <tr data-upload-id="${u.id}">
          <td class="td-name">${escHtml(u.name)}</td>
          <td><div style="display:flex;gap:0.25rem;">${thumbsHtml}</div></td>
          <td>${u.message ? `<span title="${escHtml(u.message)}" style="cursor:help;color:var(--white-dim);font-size:0.82rem;">${escHtml(u.message.slice(0, 45))}${u.message.length > 45 ? '…' : ''}</span>` : '<span class="td-meta">—</span>'}</td>
          <td class="td-time">${formatTime(u.timestamp)}</td>
          <td>${statusBadge}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    // Attach moderation click handlers
    tbody.querySelectorAll('.btn-action.approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        await moderateUpload(id, 'approve');
      });
    });

    tbody.querySelectorAll('.btn-action.reject').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        if (confirm('Are you sure you want to delete this submission?')) {
          await moderateUpload(id, 'reject');
        }
      });
    });
  }

  async function moderateUpload(id, action) {
    try {
      if (action === 'approve') {
        await JAN_BACKEND.updateUploadStatus(id, 'approved');
        showToast('Memory approved! It is now visible in the public Gallery.', 'success');
      } else if (action === 'reject') {
        await JAN_BACKEND.deleteUpload(id);
        showToast('Memory deleted.', 'default');
      }
    } catch (err) {
      console.error('Error moderating upload:', err);
      // Fallback for localStorage
      let uploads = [];
      try { uploads = JSON.parse(localStorage.getItem('jan_uploads') || '[]'); } catch {}
      if (action === 'approve') {
        uploads = uploads.map(u => {
          if (u.id === id) u.status = 'approved';
          return u;
        });
        showToast('Memory approved locally.', 'success');
      } else if (action === 'reject') {
        uploads = uploads.filter(u => u.id !== id);
        showToast('Memory deleted locally.', 'default');
      }
      localStorage.setItem('jan_uploads', JSON.stringify(uploads));
    }
    await renderDashboard();
  }

  /* ── RSVPs Table ──────────────────────────────────────────────── */
  function renderRsvpsTable(rsvps) {
    const tbody = document.getElementById('rsvp-tbody');
    const count = document.getElementById('rsvp-count');
    if (!tbody) return;

    count.textContent = `${rsvps.length} response${rsvps.length !== 1 ? 's' : ''}`;

    if (rsvps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <span class="empty-state-icon">💌</span>
          <p class="empty-state-text">No RSVPs received yet. Share the portal link with guests!</p>
        </div></td></tr>`;
      return;
    }

    const mealConfig = (window.JAN_CONFIG && JAN_CONFIG.meals) || [];

    tbody.innerHTML = rsvps.slice().reverse().map(r => {
      const isAttending = r.attendance === 'accept';
      const statusBadge = isAttending
        ? `<span class="badge badge-available">Attending</span>`
        : `<span class="badge badge-reserved">Declined</span>`;

      // Construct meals display
      let mealsText = '—';
      if (isAttending) {
        const meal1 = mealConfig.find(m => m.value === r.guest1Meal)?.label || r.guest1Meal;
        if (r.partySize === 2) {
          const meal2 = mealConfig.find(m => m.value === r.guest2Meal)?.label || r.guest2Meal;
          mealsText = `<div style="font-size:0.75rem;">1. ${escHtml(r.primaryName.split(' ')[0])}: ${escHtml(meal1)}<br>2. ${escHtml((r.guest2Name || 'Guest 2').split(' ')[0])}: ${escHtml(meal2)}</div>`;
        } else {
          mealsText = `<span style="font-size:0.75rem;">${escHtml(meal1)}</span>`;
        }
      }

      return `
        <tr>
          <td class="td-name">${escHtml(r.primaryName)}</td>
          <td>${statusBadge}</td>
          <td class="td-count">${isAttending ? r.partySize : 0}</td>
          <td>${mealsText}</td>
          <td>${r.dietaryNotes ? `<span style="font-size:0.78rem;color:#eb5757;">⚠️ ${escHtml(r.dietaryNotes)}</span>` : '<span class="td-meta">—</span>'}</td>
          <td>${r.congratsNote ? `<span title="${escHtml(r.congratsNote)}" style="cursor:help;color:var(--white-dim);font-size:0.82rem;">${escHtml(r.congratsNote.slice(0, 40))}${r.congratsNote.length > 40 ? '…' : ''}</span>` : '<span class="td-meta">—</span>'}</td>
          <td class="td-time">${formatTime(r.timestamp)}</td>
        </tr>
      `;
    }).join('');
  }

  /* ── Meal breakdown chart ───────────────────────────────────────── */
  function renderMealCharts(rsvps) {
    const grid = document.getElementById('meal-bars-grid');
    if (!grid) return;

    const mealConfig = (window.JAN_CONFIG && JAN_CONFIG.meals) || [
      { value: "beef", label: "Pan-Seared Filet Mignon" },
      { value: "salmon", label: "Herb-Crusted Salmon" },
      { value: "risotto", label: "Wild Mushroom Risotto (V/GF)" },
      { value: "kids", label: "Kid's Meal (Chicken Tenders)" }
    ];

    // Initialize counts
    const counts = {};
    mealConfig.forEach(m => counts[m.value] = 0);

    let totalAttendingMeals = 0;

    rsvps.forEach(r => {
      if (r.attendance === 'accept') {
        if (r.guest1Meal && counts[r.guest1Meal] !== undefined) {
          counts[r.guest1Meal]++;
          totalAttendingMeals++;
        }
        if (r.partySize === 2 && r.guest2Meal && counts[r.guest2Meal] !== undefined) {
          counts[r.guest2Meal]++;
          totalAttendingMeals++;
        }
      }
    });

    grid.innerHTML = mealConfig.map(m => {
      const count = counts[m.value] || 0;
      const pct   = totalAttendingMeals > 0 ? (count / totalAttendingMeals) * 100 : 0;
      return `
        <div class="meal-bar-container">
          <div class="meal-bar-info">
            <span style="font-weight: 500;">${escHtml(m.label)}</span>
            <span style="color: var(--gold); font-weight: 600;">${count} (${Math.round(pct)}%)</span>
          </div>
          <div class="meal-bar-track">
            <div class="meal-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Registry Reservations Table ───────────────────────────────── */
  function renderReservationsTable(reservations) {
    const tbody = document.getElementById('reservations-tbody');
    const count = document.getElementById('reservations-count');
    if (!tbody) return;

    count.textContent = `${reservations.length} of ${JAN_CONFIG.registry.length} reserved`;

    if (reservations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">
        <div class="empty-state">
          <span class="empty-state-icon">🎁</span>
          <p class="empty-state-text">No gifts reserved yet. Share your registry link!</p>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = reservations.map(r => `
      <tr>
        <td class="td-gift-emoji">${r.gift.emoji}</td>
        <td class="td-name">${escHtml(r.gift.name)}</td>
        <td class="td-reserved-by">${escHtml(r.reservedBy)}</td>
        <td>
          <span class="badge badge-gold">${escHtml(r.gift.category)}</span>
          &nbsp;
          <span style="color:var(--gold);font-weight:500;">$${r.gift.price.toLocaleString()}</span>
        </td>
      </tr>
    `).join('');
  }

  /* ── Voice Messages Table ─────────────────────────────────────── */
  function renderMessagesTable(messages) {
    const tbody = document.getElementById('messages-tbody');
    const count = document.getElementById('messages-count');
    if (!tbody) return;

    count.textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;

    if (messages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3">
        <div class="empty-state">
          <span class="empty-state-icon">🎤</span>
          <p class="empty-state-text">No voice messages yet. Share the Audio Guestbook with guests!</p>
        </div></td></tr>`;
      return;
    }

    tbody.innerHTML = messages.slice().reverse().map(m => `
      <tr>
        <td class="td-name">${escHtml(m.name)}</td>
        <td>
          <audio controls src="${m.audioUrl}" class="message-player" style="width:200px;height:32px;"></audio>
        </td>
        <td class="td-time">${formatTime(m.timestamp)}</td>
      </tr>
    `).join('');
  }

  /* ── Logout ───────────────────────────────────────────────────── */
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  /* ── Clear Data (dev utility) ─────────────────────────────────── */
  document.getElementById('clear-data-btn')?.addEventListener('click', async () => {
    if (!confirm('⚠️ This will clear ALL data (uploads, RSVPs, reservations, voice messages). Continue?')) return;
    
    try {
      await JAN_BACKEND.clearAllData();
      showToast('All database data has been cleared.', 'success');
    } catch (err) {
      console.error('Error clearing data:', err);
      showToast('Failed to clear some database tables.', 'error');
    }
    
    // Reset back to empty state
    location.reload();
  });

  /* ── Helpers ──────────────────────────────────────────────────── */
  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

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
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
});
