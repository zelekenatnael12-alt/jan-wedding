/**
 * JAN Wedding Platform — Upload Page Logic
 * ─────────────────────────────────────────
 * Drag & drop, file preview grid, form, local submission
 */

document.addEventListener('DOMContentLoaded', () => {
  const dropZone      = document.getElementById('drop-zone');
  const fileInput     = document.getElementById('file-input');
  const previewGrid   = document.getElementById('preview-grid');
  const previewSection= document.getElementById('preview-section');
  const previewCount  = document.getElementById('preview-count');
  const clearAllBtn   = document.getElementById('clear-all');
  const uploadForm    = document.getElementById('upload-form');
  const submitBtn     = document.getElementById('submit-btn');
  const progressBar   = document.getElementById('upload-progress');
  const progressFill  = document.getElementById('progress-fill');
  const progressPct   = document.getElementById('progress-pct');
  const uploadView    = document.getElementById('upload-view');
  const successScreen = document.getElementById('success-screen');
  const submitAgainBtn= document.getElementById('submit-again');
  const confettiCanvas= document.getElementById('confetti-canvas');

  let files = []; // { file, url, id }
  let nextId = 0;

  /* ── Drag & Drop ─────────────────────────────────────────────── */
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', e => {
    const dropped = Array.from(e.dataTransfer.files).filter(isAccepted);
    addFiles(dropped);
  });

  fileInput.addEventListener('change', () => {
    const selected = Array.from(fileInput.files).filter(isAccepted);
    addFiles(selected);
    fileInput.value = ''; // Reset so same file can be re-selected
  });

  function isAccepted(file) {
    return file.type.startsWith('image/') || file.type.startsWith('video/');
  }

  /* ── File Management ─────────────────────────────────────────── */
  function addFiles(newFiles) {
    if (!newFiles.length) return;

    newFiles.forEach(file => {
      const id  = nextId++;
      const url = URL.createObjectURL(file);
      files.push({ file, url, id });
      renderPreviewItem({ file, url, id });
    });

    updatePreviewState();
  }

  function removeFile(id) {
    const idx = files.findIndex(f => f.id === id);
    if (idx === -1) return;

    URL.revokeObjectURL(files[idx].url);
    files.splice(idx, 1);

    const el = previewGrid.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.style.transform = 'scale(0)';
      el.style.opacity   = '0';
      setTimeout(() => el.remove(), 300);
    }

    updatePreviewState();
  }

  function clearAll() {
    files.forEach(f => URL.revokeObjectURL(f.url));
    files = [];
    previewGrid.innerHTML = '';
    updatePreviewState();
  }

  function updatePreviewState() {
    const count = files.length;
    previewSection.style.display = count > 0 ? 'block' : 'none';
    previewCount.textContent = `${count} file${count !== 1 ? 's' : ''} selected`;
    submitBtn.disabled = count === 0;
    submitBtn.style.opacity = count === 0 ? '0.5' : '1';
  }

  /* ── Render Preview Item ─────────────────────────────────────── */
  function renderPreviewItem({ file, url, id }) {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.dataset.id = id;

    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      item.appendChild(video);

      const badge = document.createElement('div');
      badge.className = 'preview-video-badge';
      badge.textContent = 'Video';
      item.appendChild(badge);
    } else {
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name;
      item.appendChild(img);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.innerHTML = '✕';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile(id);
    });
    item.appendChild(removeBtn);

    previewGrid.appendChild(item);
  }

  /* ── Clear All Button ────────────────────────────────────────── */
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAll);
  }

  /* ── Form Submission ─────────────────────────────────────────── */
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      showToast('Please select at least one photo or video.', 'error');
      return;
    }

    const guestName = document.getElementById('guest-name').value.trim();
    const guestMsg  = document.getElementById('guest-message').value.trim();

    if (!guestName) {
      showToast('Please enter your name before submitting.', 'error');
      document.getElementById('guest-name').focus();
      return;
    }

    // Show progress
    submitBtn.disabled = true;
    progressBar.classList.add('visible');

    // Simulate upload progress (in real deployment, swap this for actual fetch)
    await simulateUpload((pct) => {
      progressFill.style.width  = pct + '%';
      progressPct.textContent   = pct + '%';
    });

    // Upload via backend (Supabase live → real file upload; demo → Unsplash mock)
    const actualFiles = files.map(f => f.file);
    try {
      await JAN_BACKEND.saveUpload(guestName, guestMsg, actualFiles);
    } catch (err) {
      console.error('Upload error:', err);
      progressBar.classList.remove('visible');
      submitBtn.disabled = false;
      showToast('Upload failed. Please try again.', 'error');
      return;
    }

    // Update success screen
    const successName = document.getElementById('success-name');
    if (successName) successName.textContent = guestName;

    const successCount = document.getElementById('success-count');
    if (successCount) successCount.textContent = `${files.length} memory${files.length > 1 ? 's' : ''}`;

    // Show success
    uploadView.style.display    = 'none';
    successScreen.classList.add('visible');
    launchConfetti();
  });

  /* ── Submit Again ────────────────────────────────────────────── */
  if (submitAgainBtn) {
    submitAgainBtn.addEventListener('click', () => {
      clearAll();
      uploadForm.reset();
      progressBar.classList.remove('visible');
      progressFill.style.width = '0%';
      successScreen.classList.remove('visible');
      uploadView.style.display = '';
      submitBtn.disabled = false;
    });
  }

  /* ── Simulate Upload Progress ────────────────────────────────── */
  function simulateUpload(onProgress) {
    return new Promise(resolve => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += Math.random() * 18 + 5;
        if (pct >= 100) {
          pct = 100;
          onProgress(100);
          clearInterval(interval);
          setTimeout(resolve, 300);
        } else {
          onProgress(Math.round(pct));
        }
      }, 180);
    });
  }

  /* ── Initial State ───────────────────────────────────────────── */
  updatePreviewState();
});
