/**
 * JAN Wedding Platform — Audio Guestbook Logic
 * ──────────────────────────────────────────────
 * MediaRecorder API: record, preview, submit voice messages
 */

document.addEventListener('DOMContentLoaded', () => {

  const micBtn       = document.getElementById('mic-btn');
  const micIcon      = document.getElementById('mic-icon');
  const micRings     = document.querySelectorAll('.mic-ring');
  const micStatus    = document.getElementById('mic-status');
  const recTimer     = document.getElementById('rec-timer');
  const waveform     = document.getElementById('waveform');
  const waveBars     = document.querySelectorAll('.wave-bar');
  const playbackArea = document.getElementById('playback-area');
  const audioPreview = document.getElementById('audio-preview');
  const discardBtn   = document.getElementById('discard-btn');
  const gbForm       = document.getElementById('gb-form');
  const submitBtn    = document.getElementById('gb-submit');
  const nameInput    = document.getElementById('gb-name');
  const messagesList = document.getElementById('messages-list');
  const emptyMsg     = document.getElementById('empty-msg');

  let mediaRecorder  = null;
  let audioChunks    = [];
  let audioBlob      = null;
  let audioUrl       = null;
  let timerInterval  = null;
  let seconds        = 0;
  let analyser       = null;
  let animFrame      = null;
  const MAX_SECONDS  = 120; // 2 minute limit

  /* ── Render Existing Messages ─────────────────────────────────── */
  async function loadMessages() {
    let messages = [];
    try {
      messages = await JAN_BACKEND.getGuestbook();
    } catch (err) {
      console.error('Error fetching guestbook:', err);
      try {
        messages = JSON.parse(localStorage.getItem('jan_guestbook') || '[]');
      } catch { messages = []; }
    }

    if (messages.length === 0) {
      emptyMsg?.style && (emptyMsg.style.display = 'block');
      messagesList.innerHTML = '';
      return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';
    messagesList.innerHTML = '';
    messages.slice().reverse().forEach(m => renderMessage(m));
  }

  function renderMessage(m) {
    const initial = (m.name || '?')[0].toUpperCase();
    const card = document.createElement('div');
    card.className = 'message-card fade-up';
    card.innerHTML = `
      <div class="message-avatar">${initial}</div>
      <div class="message-body">
        <div class="message-header">
          <span class="message-name">${escHtml(m.name)}</span>
          <span class="message-time">${formatTime(m.timestamp)}</span>
        </div>
        <audio controls src="${m.audioUrl || m.audio_url}" class="message-player"></audio>
      </div>
    `;
    messagesList.appendChild(card);
    requestAnimationFrame(() => card.classList.add('visible'));
  }

  /* ── Mic Button: Start / Stop ─────────────────────────────────── */
  micBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      await startRecording();
    } else {
      stopRecording();
    }
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupAnalyser(stream);

      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioUrl  = URL.createObjectURL(audioBlob);
        audioPreview.src = audioUrl;
        playbackArea.classList.add('visible');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        setIdle();
      };

      mediaRecorder.start(100);
      setRecording();

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        showToast('Microphone access denied. Please allow it in your browser settings.', 'error');
      } else {
        showToast('Could not access microphone. Please check your device.', 'error');
      }
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    clearInterval(timerInterval);
    cancelAnimationFrame(animFrame);
    waveform.classList.remove('active');
  }

  /* ── Visual States ────────────────────────────────────────────── */
  function setRecording() {
    micBtn.classList.add('recording');
    micIcon.textContent = '⏹';
    micStatus.textContent = 'Recording… tap to stop';
    micStatus.classList.add('active');
    recTimer.classList.add('visible');
    waveform.classList.add('active');
    micRings.forEach(r => r.classList.add('pulse'));

    seconds = 0;
    updateTimer();
    timerInterval = setInterval(() => {
      seconds++;
      updateTimer();
      if (seconds >= MAX_SECONDS) stopRecording();
    }, 1000);

    animateWave();
  }

  function setIdle() {
    micBtn.classList.remove('recording');
    micIcon.textContent = '🎤';
    micStatus.textContent = 'Listen back, then submit below';
    micStatus.classList.remove('active');
    recTimer.classList.remove('visible');
    micRings.forEach(r => r.classList.remove('pulse'));
  }

  function updateTimer() {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    recTimer.innerHTML = `<span class="rec-dot"></span>${m}:${s}`;
  }

  /* ── Waveform Analyser ────────────────────────────────────────── */
  function setupAnalyser(stream) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    analyser  = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
  }

  function animateWave() {
    if (!analyser) {
      // Fallback random animation if analyser not available
      waveBars.forEach(bar => {
        const h = Math.random() * 28 + 4;
        bar.style.setProperty('--h', h + 'px');
      });
      animFrame = requestAnimationFrame(animateWave);
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    waveBars.forEach((bar, i) => {
      const val = data[i] || 0;
      const h   = Math.max(4, (val / 255) * 36);
      bar.style.setProperty('--h', h + 'px');
    });
    animFrame = requestAnimationFrame(animateWave);
  }

  /* ── Discard Recording ────────────────────────────────────────── */
  discardBtn?.addEventListener('click', () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioBlob = audioUrl = null;
    audioPreview.src = '';
    playbackArea.classList.remove('visible');
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    micStatus.textContent = 'Tap the microphone to start recording';
    micStatus.classList.remove('active');
  });

  /* ── Form Submit ──────────────────────────────────────────────── */
    // Disable submit button during upload
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      await JAN_BACKEND.saveGuestbookEntry(name, audioBlob);
      showToast(`🎤 Message saved! Thank you, ${name}.`, 'success');
      gbForm.reset();
      discardBtn?.click();
      await loadMessages();
    } catch (err) {
      console.error('Guestbook upload error:', err);
      showToast('Could not save your recording. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Voice Message';
    }
  });

  /* ── Helpers ──────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.5';
  loadMessages();
});
