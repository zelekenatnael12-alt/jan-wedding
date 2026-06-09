/**
 * JAN Wedding Platform — Backend Client Adapter
 * ──────────────────────────────────────────────────
 * A hybrid client that switches dynamically between
 * LocalStorage (demo mode) and Supabase (live mode)
 * depending on config values.
 */

(function() {
  const cfg = window.JAN_CONFIG && window.JAN_CONFIG.backend;
  const isLive = !!(cfg && cfg.supabaseUrl && cfg.supabaseKey);

  let supabaseClient = null;

  if (isLive) {
    try {
      // Ensure supabase is loaded from CDN
      if (window.supabase) {
        supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
      } else {
        console.error("Supabase CDN script not loaded in HTML head.");
      }
    } catch (e) {
      console.error("Error initializing Supabase client:", e);
    }
  }

  const JAN_BACKEND = {
    isLive: !!supabaseClient,

    /* ── RSVPs ────────────────────────────────────────────────────── */
    async saveRsvp(data) {
      if (this.isLive) {
        const { error } = await supabaseClient
          .from('rsvps')
          .upsert({
            id: data.id,
            primary_name: data.primaryName,
            contact: data.contact,
            attendance: data.attendance,
            party_size: data.partySize || 0,
            guest1_meal: data.guest1Meal || null,
            guest2_name: data.guest2Name || null,
            guest2_meal: data.guest2Meal || null,
            dietary_notes: data.dietaryNotes || null,
            congrats_note: data.congratsNote || null,
            timestamp: data.timestamp
          });
        if (error) throw error;
        return data;
      } else {
        const rsvps = JSON.parse(localStorage.getItem('jan_rsvps') || '[]');
        const idx = rsvps.findIndex(r => r.primaryName.toLowerCase() === data.primaryName.toLowerCase());
        if (idx > -1) {
          rsvps[idx] = data;
        } else {
          rsvps.push(data);
        }
        localStorage.setItem('jan_rsvps', JSON.stringify(rsvps));
        return data;
      }
    },

    async getRsvps() {
      if (this.isLive) {
        const { data, error } = await supabaseClient
          .from('rsvps')
          .select('*')
          .order('timestamp', { ascending: true });
        if (error) throw error;
        // Map backend snake_case to frontend camelCase
        return data.map(r => ({
          id: r.id,
          primaryName: r.primary_name,
          contact: r.contact,
          attendance: r.attendance,
          partySize: r.party_size,
          guest1Meal: r.guest1_meal,
          guest2Name: r.guest2_name,
          guest2Meal: r.guest2_meal,
          dietaryNotes: r.dietary_notes,
          congratsNote: r.congrats_note,
          timestamp: r.timestamp
        }));
      } else {
        return JSON.parse(localStorage.getItem('jan_rsvps') || '[]');
      }
    },

    /* ── Registry Reservations ────────────────────────────────────── */
    async saveReservation(giftId, reserverName) {
      if (this.isLive) {
        const { error } = await supabaseClient
          .from('reservations')
          .insert({
            gift_id: giftId,
            reserved_by: reserverName
          });
        if (error) throw error;
      } else {
        const reservations = JSON.parse(localStorage.getItem('jan_reservations') || '{}');
        reservations[giftId] = reserverName;
        localStorage.setItem('jan_reservations', JSON.stringify(reservations));
      }
    },

    async getReservations() {
      if (this.isLive) {
        const { data, error } = await supabaseClient
          .from('reservations')
          .select('*');
        if (error) throw error;

        // Map database list to registry list format expected by frontend
        return data.map(r => {
          const gift = JAN_CONFIG.registry.find(g => g.id === r.gift_id);
          return { id: r.gift_id, reservedBy: r.reserved_by, gift };
        }).filter(r => r.gift);
      } else {
        const raw = JSON.parse(localStorage.getItem('jan_reservations') || '{}');
        return Object.entries(raw).map(([id, name]) => {
          const gift = JAN_CONFIG.registry.find(g => g.id === Number(id));
          return { id: Number(id), reservedBy: name, gift };
        }).filter(r => r.gift);
      }
    },

    /* ── Memory Uploads ───────────────────────────────────────────── */
    async saveUpload(name, message, fileObjects) {
      const fileCount = fileObjects.length;
      const id = Date.now();
      const timestamp = new Date().toISOString();

      if (this.isLive) {
        const uploadedFiles = [];
        
        // 1. Upload files to Supabase Storage public bucket 'memories'
        for (let i = 0; i < fileObjects.length; i++) {
          const file = fileObjects[i];
          const fileExt = file.name.split('.').pop();
          const filePath = `${id}-${i}.${fileExt}`;

          const { data, error } = await supabaseClient.storage
            .from('memories')
            .upload(filePath, file);

          if (error) throw error;

          const { data: publicData } = supabaseClient.storage
            .from('memories')
            .getPublicUrl(filePath);

          uploadedFiles.push({
            type: file.type.startsWith('video/') ? 'video' : 'image',
            url: publicData.publicUrl
          });
        }

        // 2. Insert metadata record in PostgreSQL 'uploads'
        const { error } = await supabaseClient
          .from('uploads')
          .insert({
            id: id,
            name: name,
            message: message || null,
            file_count: fileCount,
            status: 'pending',
            files: uploadedFiles,
            timestamp: timestamp
          });

        if (error) throw error;
        return { id, name, message, fileCount, status: 'pending', files: uploadedFiles, timestamp };

      } else {
        // LocalStorage fallback (simulated Unsplash media mapping)
        const simulatedPhotos = [
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1519225495810-7512c696505a?w=800&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&auto=format&fit=crop"
        ];
        const simulatedVideo = "https://assets.mixkit.co/videos/preview/mixkit-wedding-couple-walking-under-cherry-blossoms-42217-large.mp4";

        const mappedFiles = fileObjects.map((file, idx) => {
          const isVideo = file.type.startsWith('video/');
          if (isVideo) {
            return { type: "video", url: simulatedVideo };
          } else {
            const imgUrl = simulatedPhotos[(idx + Date.now()) % simulatedPhotos.length];
            return { type: "image", url: imgUrl };
          }
        });

        const uploads = JSON.parse(localStorage.getItem('jan_uploads') || '[]');
        const record = { id, name, message, fileCount, status: 'pending', files: mappedFiles, timestamp };
        uploads.push(record);
        localStorage.setItem('jan_uploads', JSON.stringify(uploads));
        return record;
      }
    },

    async getUploads() {
      if (this.isLive) {
        const { data, error } = await supabaseClient
          .from('uploads')
          .select('*')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        
        return data.map(u => ({
          id: u.id,
          name: u.name,
          message: u.message,
          fileCount: u.file_count,
          status: u.status,
          files: u.files,
          timestamp: u.timestamp
        }));
      } else {
        return JSON.parse(localStorage.getItem('jan_uploads') || '[]');
      }
    },

    async moderateUpload(id, action) {
      if (this.isLive) {
        if (action === 'approve') {
          const { error } = await supabaseClient
            .from('uploads')
            .update({ status: 'approved' })
            .eq('id', id);
          if (error) throw error;
        } else if (action === 'reject') {
          const { error } = await supabaseClient
            .from('uploads')
            .delete()
            .eq('id', id);
          if (error) throw error;
        }
      } else {
        let uploads = JSON.parse(localStorage.getItem('jan_uploads') || '[]');
        if (action === 'approve') {
          uploads = uploads.map(u => {
            if (u.id === id) u.status = 'approved';
            return u;
          });
        } else if (action === 'reject') {
          uploads = uploads.filter(u => u.id !== id);
        }
        localStorage.setItem('jan_uploads', JSON.stringify(uploads));
      }
    },

    /* ── Audio Guestbook ──────────────────────────────────────────── */
    async saveMessage(name, audioBlob) {
      const id = Date.now();
      const timestamp = new Date().toISOString();

      if (this.isLive) {
        // 1. Upload audio WAV to Supabase Storage bucket 'voice-notes'
        const filePath = `${id}-voice.wav`;
        const { error: uploadErr } = await supabaseClient.storage
          .from('voice-notes')
          .upload(filePath, audioBlob);

        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabaseClient.storage
          .from('voice-notes')
          .getPublicUrl(filePath);

        // 2. Insert record to guestbook database
        const { error: dbErr } = await supabaseClient
          .from('guestbook')
          .insert({
            id: id,
            name: name,
            audio_url: publicData.publicUrl,
            timestamp: timestamp
          });

        if (dbErr) throw dbErr;
        return { id, name, audioUrl: publicData.publicUrl, timestamp };

      } else {
        // LocalStorage fallback: convert blob to Base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result;
            const messages = JSON.parse(localStorage.getItem('jan_guestbook') || '[]');
            const record = { id, name, audioUrl: base64Audio, timestamp };
            messages.push(record);
            localStorage.setItem('jan_guestbook', JSON.stringify(messages));
            resolve(record);
          };
          reader.onerror = reject;
        });
      }
    },

    async getMessages() {
      if (this.isLive) {
        const { data, error } = await supabaseClient
          .from('guestbook')
          .select('*')
          .order('timestamp', { ascending: true });
        if (error) throw error;
        
        return data.map(m => ({
          id: m.id,
          name: m.name,
          audioUrl: m.audio_url,
          timestamp: m.timestamp
        }));
      } else {
        return JSON.parse(localStorage.getItem('jan_guestbook') || '[]');
      }
    },

    /* ── Clear/Reset Data ─────────────────────────────────────────── */
    async clearAllData() {
      if (this.isLive) {
        // Clean out live database tables (PostgreSQL deletes)
        await supabaseClient.from('rsvps').delete().neq('id', 0);
        await supabaseClient.from('uploads').delete().neq('id', 0);
        await supabaseClient.from('guestbook').delete().neq('id', 0);
        await supabaseClient.from('reservations').delete().neq('gift_id', 0);
      } else {
        localStorage.removeItem('jan_uploads');
        localStorage.removeItem('jan_rsvps');
        localStorage.removeItem('jan_reservations');
        localStorage.removeItem('jan_guestbook');
      }
    }
  };

  // Expose to window
  window.JAN_BACKEND = JAN_BACKEND;

  // Add developer-friendly aliases to align with frontend integration
  JAN_BACKEND.getGuestbook = JAN_BACKEND.getMessages;
  JAN_BACKEND.saveGuestbookEntry = JAN_BACKEND.saveMessage;
  JAN_BACKEND.updateUploadStatus = async function(id, status) {
    return this.moderateUpload(id, status === 'approved' ? 'approve' : 'reject');
  };
  JAN_BACKEND.deleteUpload = async function(id) {
    return this.moderateUpload(id, 'reject');
  };
})();
