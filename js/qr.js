/**
 * JAN Wedding Platform — QR Code Generator Logic
 * ─────────────────────────────────────────────────
 * Generates branded QR codes via qrserver.com API
 * Downloads PNG, shows print card preview
 */

document.addEventListener('DOMContentLoaded', () => {

  const urlInput       = document.getElementById('qr-url');
  const qrImg          = document.getElementById('qr-img');
  const qrLoading      = document.getElementById('qr-loading');
  const downloadBtn    = document.getElementById('download-btn');
  const copyLinkBtn    = document.getElementById('copy-link-btn');
  const sizeBtns       = document.querySelectorAll('.size-btn');
  const couplePreview  = document.getElementById('qr-couple-preview');
  const taglinePreview = document.getElementById('qr-tagline-preview');
  const printQrImg     = document.getElementById('print-qr-img');
  const printNames     = document.getElementById('print-names');
  const printUrl       = document.getElementById('print-url');

  let currentSize = 300;
  let debounceTimer;

  /* ── Init from Config ─────────────────────────────────────────── */
  const defaultUrl = JAN_CONFIG.portalUrl || window.location.href.replace('qr.html', 'index.html');
  urlInput.value   = defaultUrl;

  if (couplePreview)  couplePreview.textContent  = JAN_CONFIG.coupleNames;
  if (taglinePreview) taglinePreview.textContent = JAN_CONFIG.hashtag || 'Scan to celebrate with us';
  if (printNames)     printNames.textContent     = JAN_CONFIG.coupleNames;

  /* ── Generate QR ──────────────────────────────────────────────── */
  function generateQR() {
    const url  = urlInput.value.trim();
    if (!url) return;

    // Show loader
    qrImg.style.display     = 'none';
    qrLoading.style.display = 'flex';

    const encodedUrl = encodeURIComponent(url);
    const apiUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=${currentSize}x${currentSize}&data=${encodedUrl}&color=080808&bgcolor=FFFFFF&margin=10&format=png&ecc=M`;

    const img  = new Image();
    img.onload = () => {
      qrImg.src           = apiUrl;
      qrImg.style.display = 'block';
      qrLoading.style.display = 'none';
      downloadBtn.disabled    = false;
      downloadBtn.style.opacity = '1';

      // Update print card
      if (printQrImg) {
        printQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodedUrl}&color=080808&bgcolor=FFFFFF&margin=4&format=png`;
      }
      if (printUrl) printUrl.textContent = url;
    };
    img.onerror = () => {
      qrLoading.style.display = 'none';
      qrImg.style.display     = 'block';
      showToast('Could not generate QR code. Check the URL and try again.', 'error');
    };
    img.src = apiUrl;
  }

  /* ── URL Input Debounce ───────────────────────────────────────── */
  urlInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateQR, 600);
  });

  /* ── Size Buttons ─────────────────────────────────────────────── */
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSize = Number(btn.dataset.size);
      generateQR();
    });
  });

  /* ── Download ─────────────────────────────────────────────────── */
  downloadBtn?.addEventListener('click', async () => {
    const url  = urlInput.value.trim();
    if (!url) return;

    const encodedUrl = encodeURIComponent(url);
    const apiUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=${currentSize}x${currentSize}&data=${encodedUrl}&color=080808&bgcolor=FFFFFF&margin=10&format=png&ecc=M`;

    try {
      const resp = await fetch(apiUrl);
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.href     = URL.createObjectURL(blob);
      link.download = `JAN-Wedding-QR-${currentSize}px.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('QR code downloaded!', 'success');
    } catch {
      // Fallback: open in new tab
      window.open(apiUrl, '_blank');
    }
  });

  /* ── Copy Link ────────────────────────────────────────────────── */
  copyLinkBtn?.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!', 'success');
      copyLinkBtn.textContent = '✓ Copied!';
      setTimeout(() => copyLinkBtn.textContent = 'Copy Link', 2000);
    }).catch(() => {
      showToast('Could not copy — please copy the URL manually.', 'error');
    });
  });

  /* ── Init ─────────────────────────────────────────────────────── */
  downloadBtn.disabled    = true;
  downloadBtn.style.opacity = '0.5';
  generateQR();
});
