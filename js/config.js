/**
 * JAN Wedding Platform — Configuration
 * ─────────────────────────────────────
 * Edit this file to personalize the platform for any couple.
 * All pages read from this single source of truth.
 */

const JAN_CONFIG = {
  // ── Couple Details ────────────────────────────────────────────────
  coupleNames: "Alex & Jordan",
  weddingDate: "2027-01-15T16:00:00",   // ISO 8601 — the big day!
  venue: "The Grand Ballroom",
  venueAddress: "123 Luxury Lane, New York, NY",
  hashtag: "#AlexAndJordan2027",
  welcomeMessage: "We're so glad you're here. Share your love, your memories, and your joy with us.",

  // ── Branding ──────────────────────────────────────────────────────
  platformName: "JAN",
  accentColor: "#C9A84C",        // Gold — override for different themes
  accentGlow: "#E8C97A",

  // ── Dashboard (Couple's Private Access) ───────────────────────────
  dashboardPin: "1234",          // Change this to your secure PIN
  portalUrl: "index.html",       // Full URL when deployed (for QR code)

  // ── Backend Configuration (Supabase API keys) ──────────────────────
  backend: {
    supabaseUrl: "",             // e.g. "https://xyz.supabase.co"
    supabaseKey: ""              // e.g. "eyJhbGciOi..."
  },

  // ── Meal Options ──────────────────────────────────────────────────
  meals: [
    { value: "beef", label: "Pan-Seared Filet Mignon" },
    { value: "salmon", label: "Herb-Crusted Salmon" },
    { value: "risotto", label: "Wild Mushroom Risotto (V/GF)" },
    { value: "kids", label: "Kid's Meal (Chicken Tenders)" }
  ],

  // ── Registry Items ────────────────────────────────────────────────
  registry: [
    {
      id: 1,
      name: "KitchenAid Stand Mixer",
      category: "Kitchen",
      price: 449,
      description: "Professional 5-quart stand mixer in matte black.",
      emoji: "🍰"
    },
    {
      id: 2,
      name: "Le Creuset Dutch Oven",
      category: "Kitchen",
      price: 395,
      description: "Enameled cast iron, 5.5-quart, signature color.",
      emoji: "🫕"
    },
    {
      id: 3,
      name: "Espresso Machine",
      category: "Kitchen",
      price: 699,
      description: "De'Longhi La Specialista — barista quality at home.",
      emoji: "☕"
    },
    {
      id: 4,
      name: "Paris Anniversary Trip",
      category: "Experiences",
      price: 1200,
      description: "Contribute toward our honeymoon in Paris, France.",
      emoji: "🗼"
    },
    {
      id: 5,
      name: "Spa Day for Two",
      category: "Experiences",
      price: 350,
      description: "Full-day couples spa experience at a luxury retreat.",
      emoji: "🧖"
    },
    {
      id: 6,
      name: "Fine Dining Experience",
      category: "Experiences",
      price: 280,
      description: "Tasting menu for two at a Michelin-starred restaurant.",
      emoji: "🍽️"
    },
    {
      id: 7,
      name: "Linen Bedding Set",
      category: "Home",
      price: 320,
      description: "French linen duvet set, King size, in oyster white.",
      emoji: "🛏️"
    },
    {
      id: 8,
      name: "Artwork Print",
      category: "Home",
      price: 185,
      description: "Limited edition abstract print for our living room.",
      emoji: "🖼️"
    },
    {
      id: 9,
      name: "Smart Home Hub",
      category: "Home",
      price: 230,
      description: "Google Nest Hub Max — smart home command center.",
      emoji: "🏠"
    },
    {
      id: 10,
      name: "Luggage Set",
      category: "Travel",
      price: 595,
      description: "Away hardshell 3-piece luggage set in Midnight Black.",
      emoji: "🧳"
    },
    {
      id: 11,
      name: "Travel Accessories Kit",
      category: "Travel",
      price: 145,
      description: "Premium travel organizers, adapters, and essentials.",
      emoji: "✈️"
    },
    {
      id: 12,
      name: "Noise-Cancelling Headphones",
      category: "Travel",
      price: 379,
      description: "Sony WH-1000XM5 — perfect for long flights together.",
      emoji: "🎧"
    }
  ]
};
