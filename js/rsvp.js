/**
 * JAN Wedding Platform — RSVP Logic
 * ──────────────────────────────────────────
 * Handles form validation, conditional fields,
 * and localStorage data persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  const rsvpForm       = document.getElementById('rsvp-form');
  const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
  const acceptanceFields = document.getElementById('acceptance-fields');
  const partySizeSelect = document.getElementById('party-size');
  const guest2Fields    = document.getElementById('guest2-fields');
  const guest1Meal      = document.getElementById('guest1-meal');
  const guest2Meal      = document.getElementById('guest2-meal');
  const primaryNameInput = document.getElementById('primary-name');
  const guest2NameInput  = document.getElementById('guest2-name');
  const rsvpView        = document.getElementById('rsvp-view');
  const successScreen   = document.getElementById('rsvp-success-screen');
  const successName     = document.getElementById('success-primary-name');
  const successMsgText  = document.getElementById('success-msg-text');

  /* ── Populates Meal Choices from Config ────────────────────────── */
  function populateMeals() {
    const mealList = (window.JAN_CONFIG && JAN_CONFIG.meals) || [
      { value: "beef", label: "Pan-Seared Filet Mignon" },
      { value: "salmon", label: "Herb-Crusted Salmon" },
      { value: "risotto", label: "Wild Mushroom Risotto (V/GF)" },
      { value: "kids", label: "Kid's Meal (Chicken Tenders)" }
    ];

    const optionsHtml = mealList.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
    
    if (guest1Meal) guest1Meal.innerHTML = optionsHtml;
    if (guest2Meal) guest2Meal.innerHTML = optionsHtml;
  }

  populateMeals();

  /* ── Attendance Radio Change Toggle ────────────────────────────── */
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'accept') {
        acceptanceFields.style.display = 'block';
        acceptanceFields.style.animation = 'slideDown 0.35s ease forwards';
        // Make sure fields are required if visible
        toggleRequiredAcceptance(true);
      } else {
        acceptanceFields.style.display = 'none';
        toggleRequiredAcceptance(false);
      }
    });
  });

  function toggleRequiredAcceptance(isAccepting) {
    if (!isAccepting) {
      guest2NameInput.required = false;
    } else {
      guest2NameInput.required = (partySizeSelect.value === '2');
    }
  }

  /* ── Party Size Change Toggle ──────────────────────────────────── */
  partySizeSelect.addEventListener('change', () => {
    const size = partySizeSelect.value;
    if (size === '2') {
      guest2Fields.style.display = 'block';
      guest2NameInput.required = true;
      guest2NameInput.focus();
    } else {
      guest2Fields.style.display = 'none';
      guest2NameInput.required = false;
    }
  });

  /* ── Form Submit Handler ────────────────────────────────────────── */
  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const primaryName = primaryNameInput.value.trim();
    const contactInfo = document.getElementById('guest-contact').value.trim();
    const congratsNote = document.getElementById('congrats-note').value.trim();

    // Reset animations
    primaryNameInput.classList.remove('shake');
    guest2NameInput.classList.remove('shake');

    // Validation
    if (!primaryName) {
      showToast('Please enter your full name.', 'error');
      primaryNameInput.classList.add('shake');
      primaryNameInput.focus();
      return;
    }

    let rsvpData = {
      id: Date.now(),
      primaryName: primaryName,
      contact: contactInfo,
      attendance: attendance,
      congratsNote: congratsNote,
      timestamp: new Date().toISOString()
    };

    if (attendance === 'accept') {
      const partySize = Number(partySizeSelect.value);
      const guest1MealVal = guest1Meal.value;
      const dietaryNotes = document.getElementById('dietary-notes').value.trim();

      rsvpData.partySize = partySize;
      rsvpData.guest1Meal = guest1MealVal;
      rsvpData.dietaryNotes = dietaryNotes;

      if (partySize === 2) {
        const guest2Name = guest2NameInput.value.trim();
        if (!guest2Name) {
          showToast("Please enter the second guest's name.", 'error');
          guest2NameInput.classList.add('shake');
          guest2NameInput.focus();
          return;
        }
        rsvpData.guest2Name = guest2Name;
        rsvpData.guest2Meal = guest2Meal.value;
      }
    } else {
      // Declines
      rsvpData.partySize = 0;
    }

    // Save via backend (Supabase live or localStorage demo)
    const submitBtn = document.getElementById('submit-rsvp-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      await JAN_BACKEND.saveRsvp(rsvpData);
    } catch (err) {
      console.error('RSVP save error:', err);
      showToast('Something went wrong saving your RSVP. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit RSVP';
      return;
    }

    // Show Success screen
    if (successName) successName.textContent = primaryName;
    if (successMsgText) {
      if (attendance === 'accept') {
        successMsgText.textContent = `Your response has been saved. We are absolutely thrilled to celebrate with you at ${JAN_CONFIG.venue}!`;
      } else {
        successMsgText.textContent = `Your response has been saved. We will miss you, but we thank you for letting us know and appreciate your warm wishes!`;
      }
    }

    rsvpView.style.display = 'none';
    successScreen.classList.add('visible');

    // Confetti for accepts!
    if (attendance === 'accept' && typeof launchConfetti === 'function') {
      launchConfetti();
    }
  });
});
